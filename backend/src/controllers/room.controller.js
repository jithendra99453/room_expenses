import mongoose from "mongoose";
import Room from "../models/Room.js";
import Member from "../models/Member.js";
import Expense from "../models/Expense.js";
import Deposit from "../models/Deposit.js";
import DailyTotal from "../models/DailyTotal.js";
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

export const loginMember = async (req, res) => {
  try {
    const { roomId, accessKey } = req.body;

    if (!roomId || !accessKey) {
      return res.status(400).json({ message: "Room ID and Access Key are required" });
    }

    // 1. Find the room by the short code (e.g. "T60LPM")
    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // 2. Find the member by their _id (the Access Key) AND they must belong to this room
    let member;
    try {
      member = await Member.findOne({
        _id: new mongoose.Types.ObjectId(accessKey.trim()),
        room: room._id,
        isDeleted: { $ne: true }
      });
    } catch {
      return res.status(400).json({ message: "Invalid Access Key format" });
    }

    if (!member) {
      return res.status(403).json({ message: "Invalid Room ID or Access Key" });
    }

    // 3. Return member + room data (no role restriction — admins and members both log in here)
    res.json({
      member: {
        _id: member._id,
        name: member.name,
        role: member.role
      },
      room: {
        _id: room._id,
        roomId: room.roomId,
        name: room.name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoomSummary = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);

    // Limit initial load to 5 items for performance
    const expenses = await Expense.find({ room: roomId })
      .populate("paidBy", "name")
      .populate("splitAmong", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    const deposits = await Deposit.find({ room: roomId })
      .populate("member", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    const summary = await calculateRoomSummary(roomId);

    // Compute daily totals from ALL expenses (always accurate, IST timezone)
    // Groups by "YYYY-MM-DD" in IST (UTC+5:30 = +330 minutes)
    const dailyAgg = await Expense.aggregate([
      { $match: { room: new mongoose.Types.ObjectId(roomId) } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata"
            }
          },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Shape: [{ date: "YYYY-MM-DD", total: number }]
    const dailyTotals = dailyAgg.map(d => ({ date: d._id, total: d.total }));

    res.json({
      room,
      expenses,
      deposits,
      summary,
      dailyTotals
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};