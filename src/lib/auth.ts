import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getMetaUser } from "@/lib/metaApi";
import { encryptToken } from "@/lib/token";

const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "meta",
      name: "Meta",
      type: "oauth",
      clientId: process.env.META_CLIENT_ID!,
      clientSecret: process.env.META_CLIENT_SECRET!,
      authorization: {
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope:
            "pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,business_management,instagram_basic,instagram_manage_comments,instagram_manage_insights",
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
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ account }: { user: any; account: any }) {
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

    async jwt({ token, account }: { token: any; account: any }) {
      if (account?.provider === "meta") {
        token.accessToken = account.access_token;
        token.metaId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
