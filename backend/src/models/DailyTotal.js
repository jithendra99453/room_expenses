import mongoose from "mongoose";

const dailyTotalSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    date: {
        type: String, // "YYYY-MM-DD" in IST
        required: true
    },
    total: {
        type: Number,
        default: 0
    }
});

// Ensure one record per room per day
dailyTotalSchema.index({ room: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyTotal", dailyTotalSchema);
