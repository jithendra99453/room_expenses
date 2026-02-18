
import mongoose from "mongoose";
import Expense from "./models/Expense.js";
import Room from "./models/Room.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const uri = process.env.MONGO_URI;
const logFile = path.join(__dirname, "../debug_output.txt");

// Clear log file
try { fs.unlinkSync(logFile); } catch (e) { }

function log(msg) {
    console.log(msg);
    try {
        fs.appendFileSync(logFile, msg + '\r\n');
    } catch (e) {
        console.error("Failed to write to log file:", e);
    }
}

if (!uri) {
    log("MONGO_URI not found");
    process.exit(1);
}

mongoose.connect(uri)
    .then(async () => {
        log("Connected to DB");

        const room = await Room.findOne({});
        if (!room) {
            log("No room found");
            process.exit();
        }
        log(`Checking room: ${room.name} (${room.roomId})`);

        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        istTime.setUTCHours(0, 0, 0, 0);
        const startOfTodayIST_UTC = new Date(istTime.getTime() - istOffset);

        log("--- Time Debug ---");
        log(`Server Time (ISO): ${now.toISOString()}`);
        log(`Start of Today IST (UTC): ${startOfTodayIST_UTC.toISOString()}`);

        const expenses = await Expense.find({ room: room._id }).sort({ createdAt: -1 });

        log(`Found ${expenses.length} expenses for room ${room.name}.`);
        log("--- Processing Expenses ---");

        let total = 0;
        let count = 0;
        for (const e of expenses) {
            const expenseDate = new Date(e.createdAt);
            const included = expenseDate >= startOfTodayIST_UTC;

            if (included) {
                log(`[INCLUDED] Amount: ${e.amount}, CreatedAt: ${expenseDate.toISOString()}`);
                total += e.amount;
                count++;
            } else {
                if (count < 5) {
                    log(`[EXCLUDED] Amount: ${e.amount}, CreatedAt: ${expenseDate.toISOString()}`);
                }
            }
        }

        log("------------------");
        log(`Calculated Today's Total: ${total}`);

        process.exit();
    })
    .catch(err => {
        log(`Error: ${err}`);
        process.exit(1);
    });
