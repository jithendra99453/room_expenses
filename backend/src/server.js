import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

import roomRoutes from "./routes/room.routes.js";
import memberRoutes from "./routes/member.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import depositRoutes from "./routes/deposit.routes.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use("/api/rooms", roomRoutes);
app.use("/api", memberRoutes);
app.use("/api", expenseRoutes);
app.use("/api", depositRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});