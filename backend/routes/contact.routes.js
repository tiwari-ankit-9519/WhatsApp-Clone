import { Router } from "express";
import {
  sendContactRequest,
  acceptContactRequest,
  rejectContactRequest,
  blockContact,
  unblockContact,
  getContacts,
  getPendingRequests,
  getBlockedContacts,
  searchUsers,
} from "../controllers/contact.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/request", sendContactRequest);
router.patch("/request/:contactId/accept", acceptContactRequest);
router.delete("/request/:contactId/reject", rejectContactRequest);
router.post("/block", blockContact);
router.patch("/unblock/:contactId", unblockContact);
router.get("/", getContacts);
router.get("/pending", getPendingRequests);
router.get("/blocked", getBlockedContacts);
router.get("/search", searchUsers);

export default router;
