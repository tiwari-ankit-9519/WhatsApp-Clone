import { Router } from "express";
import {
  starMessage,
  unstarMessage,
  getStarredMessages,
  updateStarredMessageNote,
} from "../controllers/starred-message.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/messages/:messageId/star", starMessage);

router.delete("/messages/:messageId/star", unstarMessage);

router.get("/starred", getStarredMessages);

router.patch("/messages/:messageId/star/note", updateStarredMessageNote);

export default router;
