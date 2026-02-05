import express from "express";
import { addMember, deleteMember } from "../controllers/member.controller.js";
import { isRoomMember } from "../middlewares/isRoomMember.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Add member (admin only)
router.post(
  "/rooms/:roomId/members",
  isRoomMember,
  isAdmin,
  addMember
);

// Delete member (admin only)
router.delete(
  "/rooms/:roomId/members/:memberId",
  isRoomMember,
  isAdmin,
  deleteMember
);

export default router;