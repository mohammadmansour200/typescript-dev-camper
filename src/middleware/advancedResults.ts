import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

type Populate = string | { [key: string]: any };

interface Pagination {
  next?: {
    page: number;
    limit: number;
  };
  prev?: {
    page: number;
    limit: number;
  };
}

interface IAdvancedResults {
  success: boolean;
  count: number;
  pagination: Pagination;
  data: any;
}

declare module "express" {
  interface Response {
    advancedResults: IAdvancedResults;
  }
}

const advancedResults =
  <T>(model: mongoose.Model<T>, populate?: Populate) =>
  async (req: Request, res: Response, next: NextFunction) => {
    let query;

    const reqQuery = { ...req.query };

    const removeFields = ["select", "sort", "page", "limit"];

    removeFields.forEach((param) => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);

    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    query = model.find(JSON.parse(queryStr));

    if (req.query.select) {
      const fields = (req.query.select as string).split(",").join(" ");
      query = query.select(fields);
    }

    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments();

    query = query.skip(startIndex).limit(limit);

    if (populate) {
      query = query.populate(populate);
    }

    const results = await query;

    const pagination: Pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    const expressRes = res as Response;
    expressRes.advancedResults = {
      success: true,
      count: results.length,
      pagination,
      data: results,
    };
    next();
  };
export default advancedResults;
