import Member from "../models/Member.js";

export const addMember = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;

    const member = await Member.create({
      name,
      room: roomId,
      role: "member"
    });

    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const deleteMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (member.role === "admin") {
      const adminCount = await Member.countDocuments({
        room: member.room,
        role: "admin"
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot delete the last admin"
        });
      }
    }

    await Member.findByIdAndDelete(memberId);
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};