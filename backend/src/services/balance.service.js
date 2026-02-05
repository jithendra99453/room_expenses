import Deposit from "../models/Deposit.js";
import Expense from "../models/Expense.js";
import Member from "../models/Member.js";

export const calculateRoomSummary = async (roomId) => {
  const members = await Member.find({ room: roomId });

  const summary = {};
  members.forEach((m) => {
    summary[m._id] = {
      name: m.name,
      deposited: 0,
      spent: 0,
      balance: 0
    };
  });

  const deposits = await Deposit.find({ room: roomId });
  deposits.forEach((d) => {
    summary[d.member].deposited += d.amount;
    summary[d.member].balance += d.amount;
  });

  const expenses = await Expense.find({ room: roomId });
  expenses.forEach((e) => {
    const share = e.amount / e.splitAmong.length;

    e.splitAmong.forEach((memberId) => {
      summary[memberId].spent += share;
      summary[memberId].balance -= share;
    });

    summary[e.paidBy].balance += e.amount;
  });

  return summary;
};