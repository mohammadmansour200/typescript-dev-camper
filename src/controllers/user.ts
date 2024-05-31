import { NextFunction, Request, Response } from "express";
import User from "../models/User";

// @desc    Get all users
// @route   GET /api/v1/auth/users
// @access  Private/Admin
async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(res.advancedResults);
  } catch (err) {
    next(err);
  }
}

// @desc    Get single user
// @route   GET /api/v1/auth/users/:id
// @access  Private/Admin
async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id);

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// @desc    Create user
// @route   POST /api/v1/auth/users
// @access  Private/Admin
async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.create(req.body);

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// @desc    Update user
// @route   PUT /api/v1/auth/users/:id
// @access  Private/Admin
async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// @desc    Delete user
// @route   PUT /api/v1/auth/users/:id
// @access  Private/Admin
async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
}

export { getUsers, getUser, updateUser, deleteUser, createUser };
