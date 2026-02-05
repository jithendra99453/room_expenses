import express from "express";
import { addDeposit, deleteDeposit } from "../controllers/deposit.controller.js";
import { isRoomMember } from "../middlewares/isRoomMember.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.post(
  "/rooms/:roomId/deposits",
  isRoomMember,
  addDeposit
);

router.delete(
  "/deposits/:depositId",
  isRoomMember,
  isAdmin,
  deleteDeposit
);

export default router;