import { Router } from "express";

import { authorize, protect } from "../middleware/auth";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controllers/user";
import advancedResults from "../middleware/advancedResults";
import User from "../models/User";

const router = Router({ mergeParams: true });

router.use(authorize("admin"));
router.use(protect);

router.route("/").get(advancedResults(User), getUsers).post(createUser);

router.route("/:id").get(getUser).delete(deleteUser).put(updateUser);

export { router };
