import Expense from "../models/Expense.js";
import Member from "../models/Member.js";

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