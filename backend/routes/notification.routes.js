import { Router } from "express";
import {
  getNotifications,
  clearChatNotifications,
  getTotalNotificationCount,
  getAllNotificationCounts,
  markContactRequestsViewed,
} from "../controllers/notification.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.get("/count", getTotalNotificationCount);
router.get("/all-counts", getAllNotificationCounts);
router.post("/clear/:chatId", clearChatNotifications);
router.post("/mark-contacts-viewed", markContactRequestsViewed);

export default router;
