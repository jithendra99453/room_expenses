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