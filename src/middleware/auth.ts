import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import ErrorResponse from "../utils/errorResponse";
import User from "../models/User";

//Protect routes
export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) token = req.cookies.token;

    //Make sure token exists
    if (!token) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401)
      );
    }

    try {
      //Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      ) as jwt.JwtPayload;

      req.user = await User.findById(decoded.id);
      next();
    } catch (err) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401)
      );
    }
  } catch (err) {
    next(err);
  }
}

//Grant access to specific roles
export function authorize(...roles: (string | Date)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is unauthorized to access this route`,
          403
        )
      );
    }
    next();
  };
}
