import { Router } from "express";
import {
  forgotPassword,
  getUser,
  login,
  logoutUser,
  register,
  resetPassword,
  updateDetails,
  updatePassword,
} from "../controllers/auth";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logoutUser);
router.get("/user", protect, getUser);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);
router.put("/updatepassword", protect, updatePassword);
router.put("/updatedetails", protect, updateDetails);

export { router };
