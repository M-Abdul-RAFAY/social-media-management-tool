import NextAuth from "next-auth";
import type { Account, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getMetaUser } from "@/lib/metaApi";
import { encryptToken } from "@/lib/token";

/**
 * IMPORTANT: Meta API Permissions Configuration
 *
 * The permissions below are basic permissions that work without business verification.
 * For a full social media management dashboard, you'll need to:
 *
 * 1. Complete Business Verification: https://developers.facebook.com/docs/development/release/business-verification
 * 2. Submit for App Review to get advanced permissions like:
 *    - pages_show_list (to list user's Facebook pages)
 *    - pages_read_engagement (to read page engagement data)
 *    - pages_manage_posts (to create/edit page posts)
 *    - business_management (for business-level access)
 *    - instagram_basic (basic Instagram access)
 *    - instagram_manage_comments (manage Instagram comments)
 *    - instagram_content_publish (publish Instagram content)
 *
 * 3. For now, we use basic permissions to establish the OAuth flow.
 *    Once you have business verification, update the scope below.
 */

const handler = NextAuth({
  providers: [
    {
      id: "meta",
      name: "Meta",
      type: "oauth",
      clientId: process.env.META_CLIENT_ID!,
      clientSecret: process.env.META_CLIENT_SECRET!,
      authorization: {
        url: "https://www.facebook.com/dialog/oauth",
        params: {
          scope: "email,public_profile",
          auth_type: "rerequest",
          response_type: "code",
          display: "popup",
        },
      },
      token: "https://graph.facebook.com/v18.0/oauth/access_token",
      userinfo: {
        url: "https://graph.facebook.com/v18.0/me",
        params: {
          fields: "id,name,email,picture",
        },
      },
      profile(profile: any) {
        return {
          id: profile.id as string,
          name: profile.name as string,
          email: profile.email as string,
          image: profile.picture?.data?.url as string | undefined,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ account }: { account: Account | null }) {
      if (account?.provider === "meta" && account.access_token) {
        try {
          await dbConnect();

          // Get user info from Meta
          const metaUser = await getMetaUser(account.access_token);

          // Calculate token expiry (Meta tokens typically last 60 days)
          const tokenExpires = new Date();
          tokenExpires.setDate(tokenExpires.getDate() + 60);

          // Encrypt the access token
          const encryptedToken = encryptToken(account.access_token);

          // Create or update user in database
          await User.findOneAndUpdate(
            { metaId: metaUser.id },
            {
              name: metaUser.name,
              email: metaUser.email,
              image: metaUser.picture?.data?.url,
              metaId: metaUser.id,
              accessToken: encryptedToken,
              refreshToken: account.refresh_token
                ? encryptToken(account.refresh_token)
                : undefined,
              tokenExpires,
              permissions: account.scope?.split(",") || [],
            },
            { upsert: true, new: true }
          );

          return true;
        } catch (error) {
          console.error("Error saving user:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account?.provider === "meta") {
        token.accessToken = account.access_token;
        token.metaId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.metaId) {
        await dbConnect();
        const user = await User.findOne({ metaId: token.metaId });
        if (user) {
          session.user.id = user._id.toString();
          session.user.metaId = user.metaId;
          session.user.permissions = user.permissions;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
