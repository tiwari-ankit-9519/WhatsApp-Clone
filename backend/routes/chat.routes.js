import { Router } from "express";
import {
  createChat,
  getChats,
  getChatById,
  sendMessage,
  updateMessageStatus,
  markMessagesAsDelivered,
  markMessagesAsRead,
  getMessages,
  deleteMessage,
  reactToMessage,
  getMessageReplies,
} from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../config/fileUpload.js";

const router = Router();

router.use(authMiddleware);

router.post("/", upload.single("groupIcon"), createChat);
router.get("/", getChats);
router.get("/:chatId", getChatById);

router.get("/messages/search", authMiddleware, searchMessages);
router.get("/messages/:messageId/context", authMiddleware, getMessageContext);

router.post("/:chatId/messages", upload.single("media"), sendMessage);
router.get("/:chatId/messages", getMessages);
router.patch("/messages/:messageId/status", updateMessageStatus);
router.delete("/messages/:messageId", deleteMessage);
router.post("/:chatId/messages/delivered", markMessagesAsDelivered);
router.post("/:chatId/messages/read", markMessagesAsRead);

router.post("/messages/:messageId/react", reactToMessage);

router.get("/messages/:messageId/replies", getMessageReplies);

router.post(
  "/:chatId/messages/media",
  upload.multiple("files", 10),
  sendMessage
);

export default router;
