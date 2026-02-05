import express from "express";
import { addExpense, deleteExpense } from "../controllers/expense.controller.js";
import { isRoomMember } from "../middlewares/isRoomMember.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.post(
  "/rooms/:roomId/expenses",
  isRoomMember,
  addExpense
);

router.delete(
  "/expenses/:expenseId",
  isRoomMember,
  isAdmin,
  deleteExpense
);

export default router;