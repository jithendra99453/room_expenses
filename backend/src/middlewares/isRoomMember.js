import Member from "../models/Member.js";

export const isRoomMember = async (req, res, next) => {
  try {
    const memberId = req.headers["x-member-id"];

    if (!memberId) {
      return res.status(401).json({ message: "Member ID required" });
    }

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(403).json({ message: "Invalid member" });
    }

    // If roomId exists in params, enforce room check
    if (req.params.roomId) {
      if (member.room.toString() !== req.params.roomId) {
        return res.status(403).json({ message: "Access denied to this room" });
      }
    }

    req.member = member;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};