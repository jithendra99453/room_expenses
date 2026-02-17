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

    // Calculate Today's Total
    // Calculate Today's Total (IST: UTC+5:30)
    // We want "Start of Today" in IST.
    // 1. Get current time in UTC
    const now = new Date();
    // 2. Add 5.5 hours to get "IST Time"
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    // 3. Set to midnight (00:00:00.000)
    istTime.setUTCHours(0, 0, 0, 0); // treating this Date object as if it were UTC to zero it out
    // 4. Subtract 5.5 hours to get back to UTC timestamp of "IST Midnight"
    const startOfTodayIST_UTC = new Date(istTime.getTime() - istOffset);

    console.log("Debug Daily Total:", {
      serverTime: now.toISOString(),
      startOfTodayIST: startOfTodayIST_UTC.toISOString()
    });

    const todaysTotal = expenses
      .filter(e => {
        const expenseDate = new Date(e.createdAt);
        // console.log(`Expense: ${e.amount}, Date: ${expenseDate.toISOString()}, Included? ${expenseDate >= startOfTodayIST_UTC}`);
        return expenseDate >= startOfTodayIST_UTC;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    res.json({
      room,
      expenses,
      deposits,
      summary,
      todaysTotal
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};