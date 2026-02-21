import Expense from "../models/Expense.js";
import Member from "../models/Member.js";
import DailyTotal from "../models/DailyTotal.js";

export const addExpense = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { amount, description, paidBy, splitAmong } = req.body;

    const members = await Member.find({
      _id: { $in: splitAmong },
      room: roomId
    });

    if (members.length !== splitAmong.length) {
      return res.status(400).json({ message: "Invalid members in split" });
    }

    const expense = await Expense.create({
      room: roomId,
      amount,
      description,
      paidBy,
      splitAmong
    });

    // Upsert today's daily total (IST date key: "YYYY-MM-DD")
    const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    await DailyTotal.findOneAndUpdate(
      { room: roomId, date: dateKey },
      { $inc: { total: amount } },
      { upsert: true }
    );

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    await Expense.findByIdAndDelete(expenseId);
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const editExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { amount, description } = req.body;

    // Optional: Validate inputs

    const expense = await Expense.findByIdAndUpdate(
      expenseId,
      { amount, description },
      { new: true } // Return updated document
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoomExpenses = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const expenses = await Expense.find({ room: roomId })
      .populate("paidBy", "name")
      .populate("splitAmong", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Expense.countDocuments({ room: roomId });

    res.json({
      expenses,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalExpenses: total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};