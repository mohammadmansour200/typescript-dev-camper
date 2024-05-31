import { NextFunction, Request, Response } from "express";
import ErrorResponse from "../utils/errorResponse";
import User from "../models/User";
import generateToken from "../utils/generateToken";
import { Types } from "mongoose";
import sendEmail from "../utils/sendEmail";
import { createHash } from "crypto";

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role } = req.body;

    //Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    sendTokenRes(200, res, user._id);
  } catch (err) {
    next(err);
  }
}

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    //Validate email and password
    if (!email || !password) {
      return next(
        new ErrorResponse("Please provide an email and password", 400)
      );
    }

    //Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    //Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    sendTokenRes(200, res, user._id);
  } catch (err) {
    next(err);
  }
}

// @desc    Get current logged in user
// @route   GET /api/v1/auth/user
// @access  Private
async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
async function updateDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
async function updatePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user.id).select("+password");

    //Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse("Password is incorrect", 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenRes(200, res, user._id);
  } catch (err) {
    next(err);
  }
}

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorResponse(`There is no user with that email`, 404));
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset",
        message,
      });

      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse("Email couldn't be sent", 500));
    }
  } catch (err) {
    next(err);
  }
}

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const resetPasswordToken = createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse("Invalid token", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenRes(200, res, user._id);
  } catch (err) {
    next(err);
  }
}

//Get token from model, create cookie and send res
function sendTokenRes(
  statusCode: number,
  res: Response,
  userId: Types.ObjectId
) {
  const token = generateToken(userId);

  const options = {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
}

// @desc    Logout user
// @route   POST /api/user/logout
// @access  Public
async function logoutUser(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("token");
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export {
  register,
  login,
  getUser,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logoutUser,
};
