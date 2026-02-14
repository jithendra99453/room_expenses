
const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

async function test() {
    try {
        console.log("1. Creating Room...");
        const roomRes = await axios.post(`${baseURL}/rooms`, {
            roomId: "TEST01",
            roomName: "Test Room",
            adminName: "Admin User"
        });
        const { room, admin } = roomRes.data;
        console.log(`   Room Created: ${room.roomId} (${room._id})`);
        console.log(`   Admin Created: ${admin.name} (${admin._id})`);

        console.log("\n2. Joining Room...");
        const joinRes = await axios.post(`${baseURL}/join`, {
            roomId: "TEST01",
            name: "Member User"
        });
        const { member } = joinRes.data;
        console.log(`   Member Joined: ${member.name} (${member._id})`);

        console.log("\n3. Adding Expense...");
        const expenseRes = await axios.post(`${baseURL}/rooms/${room._id}/expenses`, {
            amount: 100,
            description: "Test Expense",
            paidBy: admin._id,
            splitAmong: [admin._id, member._id]
        }, {
            headers: { 'x-member-id': admin._id } // Mock auth
        });
        console.log(`   Expense Added: ${expenseRes.data.description} - ${expenseRes.data.amount}`);

        console.log("\n4. Getting Summary...");
        const summaryRes = await axios.get(`${baseURL}/rooms/${room._id}/summary`, {
            headers: { 'x-member-id': admin._id }
        });
        const { summary } = summaryRes.data;
        console.log("   Summary received.");
        console.log("   Admin Balance:", summary[admin._id].balance); // Should be +50
        console.log("   Member Balance:", summary[member._id].balance); // Should be -50

        if (summary[admin._id].balance === 50 && summary[member._id].balance === -50) {
            console.log("\n✅ VERIFICATION SUCCESSFUL");
        } else {
            console.log("\n❌ VERIFICATION FAILED: Balances incorrect");
        }

    } catch (e) {
        console.error("\n❌ VERIFICATION FAILED", e.response ? e.response.data : e.message);
    }
}

test();
