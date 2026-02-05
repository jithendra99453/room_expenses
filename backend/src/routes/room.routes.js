import express from "express";
import { createRoom, getRoomSummary } from "../controllers/room.controller.js";
import { isRoomMember } from "../middlewares/isRoomMember.js";

const router = express.Router();

// CREATE ROOM
router.post("/", createRoom);

// ROOM SUMMARY
router.get("/:roomId/summary", isRoomMember, getRoomSummary);

export default router;