const fs = require("fs");
import { NextFunction, Request, Response } from "express";
import Course from "../models/Course";
import ErrorResponse from "../utils/errorResponse";
import Bootcamp from "../models/Bootcamp";

// @desc    Get all courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public
async function getCourses(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.params.bootcampId) {
      const courses = await Course.find({ bootcamp: req.params.bootcampId });
      return res
        .status(200)
        .json({ success: true, count: courses.length, data: courses });
    } else {
      res.status(200).json(res.advancedResults);
    }
  } catch (err) {
    next(err);
  }
}

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public
async function getCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: "bootcamp",
      select: "name description",
    });

    if (!course) {
      return next(
        new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

// @desc    Add course
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Private
async function addCourse(req: Request, res: Response, next: NextFunction) {
  try {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `No bootcamp with the id of ${req.params.bootcampId}`,
          404
        )
      );
    }

    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to add a course to this bootcamp`,
          401
        )
      );
    }

    const course = await Course.create(req.body);

    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private
async function deleteCourse(req: Request, res: Response, next: NextFunction) {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return next(
        new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
      );
    }

    if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this bootcamp`,
          401
        )
      );
    }

    course = await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
}

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private
async function updateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return next(
        new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
      );
    }

    if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this bootcamp`,
          401
        )
      );
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

export { getCourses, getCourse, addCourse, updateCourse, deleteCourse };
