import mongoose from "mongoose";
import { IUser } from "../models/UserModel";
export type userType = mongoose.Document<unknown, IUser> &
  IUser & {
    _id: mongoose.Types.ObjectId;
  };
declare global {
  namespace Express {
    export interface Request {
      user?: userType | null | undefined;
    }
  }
}
