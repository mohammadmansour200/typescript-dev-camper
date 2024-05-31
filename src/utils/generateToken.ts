import jwt from "jsonwebtoken";
import { Types } from "mongoose";

export default function generateToken(id: Types.ObjectId) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
}
