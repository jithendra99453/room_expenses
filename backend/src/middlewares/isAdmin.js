export const isAdmin = (req, res, next) => {
  if (req.member.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};