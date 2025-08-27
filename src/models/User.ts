import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "@/types/db";

interface UserDocument extends IUser, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: String,
    metaId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: String,
    tokenExpires: { type: Date, required: true },
    permissions: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Remove duplicate indexes since unique: true already creates them
// UserSchema.index({ email: 1 }); - removed (unique: true already creates this)
// UserSchema.index({ metaId: 1 }); - removed (unique: true already creates this)

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
