import { Router } from "express";
import {
  createUser,
  loginUser,
  getUserProfile,
  logoutUser,
  updateUserProfile,
  deleteUser,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../config/fileUpload.js";

const router = Router();

router.post("/register", upload.single("profilePic"), createUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getUserProfile);
router.post("/logout", authMiddleware, logoutUser);
router.put(
  "/update-profile",
  authMiddleware,
  upload.single("profilePic"),
  updateUserProfile
);
router.delete("/delete-profile", authMiddleware, deleteUser);

export default router;
