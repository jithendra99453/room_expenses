import Room from "../models/Room.js";
import Member from "../models/Member.js";
import { calculateRoomSummary } from "../services/balance.service.js";

export const createRoom = async (req, res) => {
  try {
    const { roomId, roomName, adminName } = req.body;

    const roomExists = await Room.findOne({ roomId });
    if (roomExists) {
      return res.status(400).json({ message: "Room already exists" });
    }

    const room = await Room.create({
      roomId,
      name: roomName
    });

    const admin = await Member.create({
      name: adminName,
      room: room._id,
      role: "admin"
    });

    res.status(201).json({
      room,
      admin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoomSummary = async (req, res) => {
  try {
    const { roomId } = req.params;
    const summary = await calculateRoomSummary(roomId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};