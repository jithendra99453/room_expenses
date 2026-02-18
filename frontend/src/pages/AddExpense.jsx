import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';

const AddExpense = () => {
    const { user, room: authRoom } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [members, setMembers] = useState([]);

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [splitAmong, setSplitAmong] = useState([]);

    useEffect(() => {
        if (!authRoom) return;

        // Fetch members to populate dropdowns
        const fetchMembers = async () => {
            try {
                const roomId = authRoom._id || authRoom.id;
                const memberId = user._id || user.id;
                const res = await client.get(`/rooms/${roomId}/summary`, {
                    headers: { 'x-member-id': memberId }
                });
                // The summary object keys are member IDs. We need an array of {id, name}
                const summary = res.data.summary;
                const memberList = Object.keys(summary)
                    .map(id => ({
                        id,
                        name: summary[id].name,
                        isDeleted: summary[id].isDeleted
                    }))
                    .filter(m => !m.isDeleted);

                setMembers(memberList);

                // Default paidBy to current user if found in list
                // User from context only has few details, we need to match ID if possible
                // Assuming authContext user object has _id
                if (user && user._id) {
                    setPaidBy(user._id);
                } else if (memberList.length > 0) {
                    setPaidBy(memberList[0].id);
                }

                // Default split among all members
                setSplitAmong(memberList.map(m => m.id));
            } catch (err) {
                console.error("Failed to fetch members", err);
                setError("Could not load members");
            }
        };

        fetchMembers();
    }, [authRoom, user]);

    const handleSplitChange = (memberId) => {
        if (splitAmong.includes(memberId)) {
            setSplitAmong(splitAmong.filter(id => id !== memberId));
        } else {
            setSplitAmong([...splitAmong, memberId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (splitAmong.length === 0) {
            setError("Expense must be split among at least one member");
            setLoading(false);
            return;
        }

        try {
            const roomId = authRoom._id || authRoom.id;
            const memberId = user._id || user.id;
            await client.post(`/rooms/${roomId}/expenses`, {
                roomId: authRoom._id, // API expects roomId in params, logic handles it
                amount: parseFloat(amount),
                description,
                paidBy,
                splitAmong
            }, {
                headers: { 'x-member-id': memberId }
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Expense</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                            placeholder="e.g. Dinner at Taj"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Paid By</label>
                        <select
                            value={paidBy}
                            onChange={(e) => setPaidBy(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
                        >
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Split Among</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 p-2 rounded">
                            {members.map(m => (
                                <label key={m.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input
                                        type="checkbox"
                                        checked={splitAmong.includes(m.id)}
                                        onChange={() => handleSplitChange(m.id)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">{m.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition flex items-center justify-center disabled:opacity-50 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Add Expense'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddExpense;
