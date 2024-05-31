import { NextFunction, Request, Response } from "express";
import ErrorResponse from "../utils/errorResponse";
interface err extends Error {
  statusCode?: number;
  value?: string;
  code?: number;
}
export function errorHandler(
  err: err,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let error = { ...err };
  error.message = err.message;

  //Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  //Mongoose duplicate key
  if (err.code === 11000) {
    const message = `Duplicate field value entered`;
    error = new ErrorResponse(message, 400);
  }

  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message || "Server error" });
}
