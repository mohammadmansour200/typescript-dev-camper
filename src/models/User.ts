import { NextFunction } from "express";
import mongoose, { InferSchemaType } from "mongoose";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: [true, "You are already logged in"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  role: {
    type: String,
    enum: ["user", "publisher", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minLength: 6,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//Encrypt password using bcryptpassword
UserSchema.pre("save", async function (next: NextFunction) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//Match user entered password to hashed password in database
UserSchema.method(
  "matchPassword",
  async function matchPassword(enteredPassword: string) {
    console.log(await bcrypt.compare(enteredPassword, this.password));
    return await bcrypt.compare(enteredPassword, this.password);
  }
);

//Generate and hash forgot password token
UserSchema.method("getResetPasswordToken", function getResetPasswordToken() {
  //Generate token
  const resetToken = randomBytes(20).toString("hex");

  //Hash token and set to resetPasswordToken field
  this.resetPasswordToken = createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //Set forgot password token expiry
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
});

interface IUser extends InferSchemaType<typeof UserSchema> {
  matchPassword(enteredPassword: string): boolean;
  getResetPasswordToken(): string;
}

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
