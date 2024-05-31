import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { errorHandler } from "./middleware/error";
import fileUpload from "express-fileupload";
import connectDB from "./config/db";
import path from "path";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

//Load env vars
dotenv.config({ path: "./src/config/config.env" });

//Connect to DB
connectDB();

//Route files
import { router as bootcamps } from "./routes/bootcamps";
import { router as courses } from "./routes/courses";
import { router as auth } from "./routes/auth";
import { router as users } from "./routes/user";
import ErrorResponse from "./utils/errorResponse";

const app = express();

//Body parser
app.use(express.json());

//Cookie parser
app.use(cookieParser());

//Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Sanitize data
app.use(
  mongoSanitize({
    onSanitize: () => {
      throw new ErrorResponse(
        "Not on my watch.. go get yourself a life Hacker",
        401
      );
    },
  })
);

//Set security headers
app.use(helmet());

//Prevent XSS attacks
app.use(xss());

//Rate limiting
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000, //10 minutes
    limit: 70,
  })
);

//Prevent http param pollution
app.use(hpp());

//File uploading
app.use(fileUpload());

//Set static folder
app.use(express.static(path.join(__dirname, "../public")));

//Mount routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/auth/users", users);

//If you want to use it in the bootcamps controller methods, it has to be after the Routers mounting (Middlewares are executed in linear order)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

//Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error, promise) => {
  console.log(`Error: ${err.message}`);
  //Close server & exit process
  server.close(() => process.exit(1));
});
