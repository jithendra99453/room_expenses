import Deposit from "../models/Deposit.js";

export const addDeposit = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { memberId, amount } = req.body;

    const deposit = await Deposit.create({
      room: roomId,
      member: memberId,
      amount
    });

    res.status(201).json(deposit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    await Deposit.findByIdAndDelete(depositId);
    res.json({ message: "Deposit deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoomDeposits = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const deposits = await Deposit.find({ room: roomId })
      .populate("member", "name")
      .sort({ createdAt: -1 }) // Assuming sorting by creation time
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Deposit.countDocuments({ room: roomId });

    res.json({
      deposits,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalDeposits: total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};