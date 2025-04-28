import { Router } from "express";
import {
  forwardMessage,
  getOriginalMessage,
  getForwardingHistory,
} from "../controllers/message-forward.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/messages/:messageId/forward", forwardMessage);

router.get("/messages/:messageId/original", getOriginalMessage);

router.get("/messages/:messageId/forwards", getForwardingHistory);

export default router;
