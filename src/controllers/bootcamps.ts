import { NextFunction, Request, Response } from "express";
import Bootcamp from "../models/Bootcamp";
import ErrorResponse from "../utils/errorResponse";
import Course from "../models/Course";
import fileUpload from "express-fileupload";
import path from "path";

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
async function getBootcamps(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(res.advancedResults);
  } catch (err) {
    next(err);
  }
}

// @desc    Get single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
async function getBootcamp(req: Request, res: Response, next: NextFunction) {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    next(err);
  }
}

// @desc    Create new bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
async function createBootcamp(req: Request, res: Response, next: NextFunction) {
  try {
    req.body.user = req.user.id;

    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    if (publishedBootcamp && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `The user with ID ${req.user.id} has already published a Bootcamp`,
          400
        )
      );
    }

    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
      success: true,
      data: bootcamp,
    });
  } catch (err) {
    next(err);
  }
}

// @desc    Update bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
async function updateBootcamp(req: Request, res: Response, next: NextFunction) {
  try {
    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this bootcamp`,
          401
        )
      );
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    next(err);
  }
}

// @desc    Delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
async function deleteBootcamp(req: Request, res: Response, next: NextFunction) {
  try {
    const bootcamps = await Bootcamp.findById(req.params.id);

    await Course.deleteMany({ bootcamp: req.params.id });
    if (!bootcamps) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    if (
      bootcamps.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this bootcamp`,
          401
        )
      );
    }

    await Bootcamp.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
}

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
async function bootcampPhotoUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
      return next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      );
    }

    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      console.log(bootcamp.user.toString() !== req.user.id);
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this bootcamp`,
          401
        )
      );
    }

    if (!req.files) {
      return next(new ErrorResponse("Please upload a file", 404));
    }

    const file = req.files.file as fileUpload.UploadedFile;

    if (!file.mimetype.startsWith("image")) {
      return next(new ErrorResponse("Please upload an image", 404));
    }

    if (file.size > Number(process.env.MAX_FILE_UPLOAD)) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
          404
        )
      );
    }

    file.name = `photo_${bootcamp.id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
      if (err) {
        return next(new ErrorResponse(`Problem with file upload`, 500));
      }
      await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

      res.status(200).json({
        success: true,
        data: file.name,
      });
    });
  } catch (err) {
    next(err);
  }
}

export {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  bootcampPhotoUpload,
};
