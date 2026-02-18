
import axios from "axios";
import mongoose from "mongoose";
import Room from "./models/Room.js";
import Member from "./models/Member.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const uri = process.env.MONGO_URI;

// We need DB connection just to get a valid room/member ID to call the API
if (!uri) {
    console.error("MONGO_URI not found");
    process.exit(1);
}

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to DB to fetch IDs...");
        const room = await Room.findOne({});
        if (!room) {
            console.log("No room found");
            process.exit();
        }
        const member = await Member.findOne({ room: room._id });
        if (!member) {
            console.log("No member found");
            process.exit();
        }

        console.log(`Using Room: ${room._id}, Member: ${member._id}`);
        console.log(`Calling API: ${API_URL}/rooms/${room._id}/summary`);

        try {
            const res = await axios.get(`${API_URL}/rooms/${room._id}/summary`, {
                headers: { 'x-member-id': member._id.toString() }
            });
            console.log("API Response Status:", res.status);
            console.log("API 'todaysTotal':", res.data.todaysTotal);
            console.log("Type of 'todaysTotal':", typeof res.data.todaysTotal);

            if (res.data.todaysTotal === undefined) {
                console.log("❌ todaysTotal is UNDEFINED in response!");
            } else {
                console.log("✅ todaysTotal received.");
            }
        } catch (e) {
            console.error("API Call Failed:", e.message);
            if (e.code === 'ECONNREFUSED') {
                console.log("Likely the server is NOT running on localhost:5000");
            }
        } finally {
            process.exit();
        }
    })
    .catch(e => {
        console.error("DB Error", e);
        process.exit(1);
    });
