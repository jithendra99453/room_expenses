
import mongoose from "mongoose";
import Member from "./models/Member.js";
import Room from "./models/Room.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const uri = process.env.MONGO_URI;
const logFile = path.join(__dirname, "../debug_login_output.txt");

try { fs.unlinkSync(logFile); } catch (e) { }

function log(msg) {
    console.log(msg);
    try {
        fs.appendFileSync(logFile, msg + '\r\n');
    } catch (e) { }
}

if (!uri) {
    log("MONGO_URI not found");
    process.exit(1);
}

const targetMemberId = "6995066d7015b1876841b5a7";
const targetRoomIdInput = "4E2WNP"; // The one they tried

mongoose.connect(uri)
    .then(async () => {
        log("Connected to DB");

        log(`--- Investigating Member: ${targetMemberId} ---`);
        const member = await Member.findById(targetMemberId).populate("room");

        if (!member) {
            log("❌ Member not found in DB.");
        } else {
            log(`✅ Member Found: ${member.name}`);
            try {
                log(`   Linked Room Object ID: ${member.room._id}`);
                log(`   Linked Room ID (Public): ${member.room.roomId}`);
                log(`   Linked Room Name: ${member.room.name}`);

                if (member.room.roomId !== targetRoomIdInput) {
                    log(`\n⚠️ MISMATCH DETECTED`);
                    log(`User tried to login to: ${targetRoomIdInput}`);
                    log(`But this user belongs to: ${member.room.roomId}`);
                } else {
                    log("\n✅ Room IDs match. Issue might be something else.");
                }
            } catch (e) {
                log("Error reading room details from member object");
                console.log(member);
            }
        }

        process.exit();
    })
    .catch(err => {
        log(err);
        process.exit(1);
    });
