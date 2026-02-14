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

    // Populate room to check both _id and roomId string
    await member.populate('room');

    // If roomId exists in params, enforce room check
    if (req.params.roomId) {
      const paramRoomId = req.params.roomId;
      const memberRoomId = member.room._id.toString();
      const memberRoomCode = member.room.roomId;

      console.log(`[isRoomMember] Checking access for Member: ${memberId}`);
      console.log(`[isRoomMember] Param Room ID: ${paramRoomId}`);
      console.log(`[isRoomMember] Member Room _id: ${memberRoomId}`);
      console.log(`[isRoomMember] Member Room Code: ${memberRoomCode}`);

      if (memberRoomId !== paramRoomId && memberRoomCode !== paramRoomId) {
        console.log(`[isRoomMember] Access Denied: No match.`);
        return res.status(403).json({ message: "Access denied to this room" });
      }

      // Important: If the user passed the 6-char code, swap it for the _id
      // so that controllers (which expect _id) work correctly.
      if (memberRoomCode === paramRoomId) {
        req.params.roomId = memberRoomId;
      }
    }

    req.member = member;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};