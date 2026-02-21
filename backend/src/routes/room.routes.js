import express from "express";
import { createRoom, getRoomSummary, loginMember } from "../controllers/room.controller.js";
import { isRoomMember } from "../middlewares/isRoomMember.js";

const router = express.Router();

// CREATE ROOM
router.post("/", createRoom);

// MEMBER LOGIN
router.post("/login", loginMember);

// ROOM SUMMARY
router.get("/:roomId/summary", isRoomMember, getRoomSummary);

export default router;