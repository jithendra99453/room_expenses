import mongoose from "mongoose";
import Room from "../models/Room.js";
import Member from "../models/Member.js";
import Expense from "../models/Expense.js";
import Deposit from "../models/Deposit.js";
import { calculateRoomSummary } from "../services/balance.service.js";

export const createRoom = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { roomId, roomName, adminName } = req.body;

    // Check if room exists (outside transaction for performance, or inside for consistency - inside is safer against race conditions but we have unique index anyway)
    const roomExists = await Room.findOne({ roomId }).session(session);
    if (roomExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Room already exists" });
    }

    const room = await Room.create([{
      roomId,
      name: roomName
    }], { session });

    const admin = await Member.create([{
      name: adminName,
      room: room[0]._id,
      role: "admin"
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      room: room[0],
      admin: admin[0]
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
  }
};

export const getRoomSummary = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    const expenses = await Expense.find({ room: roomId }).populate("paidBy", "name").populate("splitAmong", "name").sort({ createdAt: -1 });
    const deposits = await Deposit.find({ room: roomId }).populate("member", "name").sort({ date: -1 });
    const summary = await calculateRoomSummary(roomId);

    res.json({
      room,
      expenses,
      deposits,
      summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};