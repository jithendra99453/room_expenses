import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, Copy, Check, TrendingUp, Users, Pencil, X, Trash2, UserPlus, FileText } from 'lucide-react';

const Dashboard = () => {
    const { user, room: authRoom, logout } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Lists & Pagination
    const [expensesList, setExpensesList] = useState([]);
    const [depositsList, setDepositsList] = useState([]);
    const [expensePage, setExpensePage] = useState(1);
    const [depositPage, setDepositPage] = useState(1);
    const [hasMoreExpenses, setHasMoreExpenses] = useState(false);
    const [hasMoreDeposits, setHasMoreDeposits] = useState(false);
    const [loadingMoreExpenses, setLoadingMoreExpenses] = useState(false);
    const [loadingMoreDeposits, setLoadingMoreDeposits] = useState(false);

    // UI State
    const [copied, setCopied] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);

    const roomId = authRoom?._id || authRoom?.id;
    const memberId = user?._id || user?.id;

    const fetchInitialData = async () => {
        if (!roomId) return;
        try {
            setLoading(true);
            const res = await client.get(`/rooms/${roomId}/summary`, {
                headers: { 'x-member-id': memberId }
            });
            setRoomData(res.data);
            setExpensesList(res.data.expenses);
            setDepositsList(res.data.deposits);

            // Check if we hit the limit (5) implies there might be more
            setHasMoreExpenses(res.data.expenses.length === 5);
            setHasMoreDeposits(res.data.deposits.length === 5);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [authRoom]);

    const loadMoreExpenses = async () => {
        if (loadingMoreExpenses) return;
        try {
            setLoadingMoreExpenses(true);
            const nextPage = expensePage + 1;
            const res = await client.get(`/rooms/${roomId}/expenses?page=${nextPage}&limit=10`, {
                headers: { 'x-member-id': memberId }
            });

            // Filter duplicates just in case
            const newExpenses = res.data.expenses.filter(ne => !expensesList.some(e => e._id === ne._id));
            setExpensesList([...expensesList, ...newExpenses]);
            setExpensePage(nextPage);
            setHasMoreExpenses(res.data.expenses.length === 10);
        } catch (err) {
            console.error("Failed to load more expenses", err);
        } finally {
            setLoadingMoreExpenses(false);
        }
    };

    const loadMoreDeposits = async () => {
        if (loadingMoreDeposits) return;
        try {
            setLoadingMoreDeposits(true);
            const nextPage = depositPage + 1;
            const res = await client.get(`/rooms/${roomId}/deposits?page=${nextPage}&limit=10`, {
                headers: { 'x-member-id': memberId }
            });

            const newDeposits = res.data.deposits.filter(nd => !depositsList.some(d => d._id === nd._id));
            setDepositsList([...depositsList, ...newDeposits]);
            setDepositPage(nextPage);
            setHasMoreDeposits(res.data.deposits.length === 10);
        } catch (err) {
            console.error("Failed to load more deposits", err);
        } finally {
            setLoadingMoreDeposits(false);
        }
    };

    const copyToClipboard = () => {
        if (roomData?.room?.roomId) {
            navigator.clipboard.writeText(roomData.room.roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteMember = async () => {
        if (!memberToDelete) return;

        try {
            await client.delete(`/rooms/${roomId}/members/${memberToDelete.id}`, {
                headers: { 'x-member-id': memberId }
            });
            // Refresh data to update summary and balances
            fetchInitialData();
            setMemberToDelete(null);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete member");
        }
    };

    if (loading) return <div className="flex bg-gray-100 h-screen items-center justify-center">Loading...</div>;
    if (!roomData) return <div className="flex bg-gray-100 h-screen items-center justify-center">Failed to load data</div>;

    const { room, summary } = roomData;
    const myDeposits = depositsList.filter(d => d.member?._id === memberId) || [];

    // Calculate Available Money
    const totalDeposits = depositsList.reduce((sum, d) => sum + d.amount, 0); // Note: this is only loaded deposits, for accurate header we might need simple total from backend, but current implementation calculated it on frontend. 
    // Wait, the Summary object calculates totals based on ALL backend data. 
    // `summary` object from backend has `deposited`, `spent`, `balance`.

    // Correct way to get Total Available Money is Sum(All Member Balances) -> wait, sum of balances is 0.
    // Available Money = Total Deposited - Total Spent.
    // We can compute this from the `summary` object values.
    const allMembers = Object.values(summary);
    const globalDeposited = allMembers.reduce((sum, m) => sum + m.deposited, 0);
    const globalSpent = allMembers.reduce((sum, m) => sum + m.spent, 0);
    const availableMoney = globalDeposited - globalSpent;

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-24">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Welcome, {user?.name}</p>
                        <h1 className="text-2xl font-bold text-gray-800">{room.name}</h1>
                        <div className="flex items-center text-gray-500 mt-1 cursor-pointer" onClick={copyToClipboard}>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm mr-2">ID: {room.roomId}</span>
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </div>
                    </div>

                    <div className="bg-green-50 px-6 py-3 rounded-xl border border-green-100 text-center md:text-right w-full md:w-auto">
                        <p className="text-sm text-green-600 font-medium mb-1">Available Money</p>
                        <p className="text-3xl font-bold text-green-700">₹{availableMoney.toFixed(2)}</p>
                    </div>

                    <button onClick={logout} className="text-gray-500 hover:text-red-500 transition absolute top-6 right-6 md:static">
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>

                {/* Member Directory */}
                {user?.role === 'admin' && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2" /> Member Directory
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                        <th className="py-2 font-medium">Name</th>
                                        <th className="py-2 font-medium">Role</th>
                                        <th className="py-2 font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary).filter(([_, m]) => !m.isDeleted).map(([id, member]) => (
                                        <tr key={id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                            <td className="py-2.5 text-gray-800 font-medium">{member.name}</td>
                                            <td className="py-2.5">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {member.role || 'member'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const link = `${window.location.origin}/magic-login/${room.roomId}/${id}`;
                                                        navigator.clipboard.writeText(link);
                                                        alert("Link copied: " + link);
                                                    }}
                                                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" /> Copy Invite
                                                </button>
                                                {member.role !== 'admin' && (
                                                    <button
                                                        onClick={() => setMemberToDelete({ id, name: member.name })}
                                                        className="text-gray-400 hover:text-red-600 p-1"
                                                        title="Remove Member"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Balances */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2" /> Members & Balances
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(summary).filter(([_, m]) => !m.isDeleted).map(([id, member]) => (
                            <div key={id} className={`p-4 rounded-lg border ${member.balance >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <div className="font-bold text-gray-800 flex justify-between">
                                    {member.name}
                                    {user?.role === 'admin' && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 py-0.5 px-1.5 rounded font-mono border border-gray-200" title="Access Key">
                                            {id}
                                        </span>
                                    )}
                                </div>
                                <div className={`text-lg font-bold ${member.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {member.balance >= 0 ? `+₹${member.balance.toFixed(2)}` : `-₹${Math.abs(member.balance).toFixed(2)}`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Spent: ₹{member.spent.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Deposits Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* My Deposits */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <Check className="w-5 h-5 mr-2 text-green-600" /> My Deposits
                        </h2>
                        {myDeposits.length === 0 ? (
                            <p className="text-gray-500 text-sm">No deposits yet.</p>
                        ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {myDeposits.map(d => (
                                    <div key={d._id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                                        <div className="text-gray-600">
                                            {new Date(d.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="font-bold text-green-600">
                                            +₹{d.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* All Deposits with Load More */}
                    {user?.role === 'admin' && (
                        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-blue-600" /> All Deposits
                            </h2>
                            {depositsList.length === 0 ? (
                                <p className="text-gray-500 text-sm">No deposits yet.</p>
                            ) : (
                                <div className="space-y-3 flex-1 overflow-y-auto mb-2">
                                    {depositsList.map(d => (
                                        <div key={d._id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                                            <div>
                                                <span className="font-medium text-gray-800">{d.member?.name}</span>
                                                <span className="text-xs text-gray-400 block">{new Date(d.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="font-bold text-green-600">
                                                +₹{d.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {hasMoreDeposits && (
                                <button
                                    onClick={loadMoreDeposits}
                                    disabled={loadingMoreDeposits}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 text-center"
                                >
                                    {loadingMoreDeposits ? 'Loading...' : 'Load More'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Expenses with Load More */}
            <div className="bg-white rounded-xl shadow-sm p-6 max-w-4xl mx-auto mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" /> Recent Expenses
                    </h2>
                    <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Today's Total: <span className="text-gray-800 font-bold">₹{(roomData.todaysTotal || 0).toFixed(2)}</span>
                    </div>
                </div>
                {expensesList.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No expenses yet.</p>
                ) : (
                    <div className="space-y-4">
                        {expensesList.map(expense => (
                            <div key={expense._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition border-b border-gray-100 last:border-0">
                                <div>
                                    <div className="font-medium text-gray-800">{expense.description}</div>
                                    <div className="text-sm text-gray-500">
                                        Paid by <span className="font-medium text-gray-700">{expense.paidBy?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {new Date(expense.createdAt).toLocaleString()} • Split among: {expense.splitAmong?.map(m => m.name).join(', ') || 'All'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-gray-800">
                                        ₹{expense.amount.toFixed(2)}
                                    </div>
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => setEditingExpense(expense)}
                                            className="p-1 text-gray-400 hover:text-blue-500 transition"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {hasMoreExpenses && (
                    <button
                        onClick={loadMoreExpenses}
                        disabled={loadingMoreExpenses}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-4 py-2 border border-blue-100 rounded bg-blue-50 hover:bg-blue-100 transition"
                    >
                        {loadingMoreExpenses ? 'Loading...' : 'Load More Expenses'}
                    </button>
                )}
            </div>

            {/* Edit Expense Modal */}
            {
                editingExpense && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Edit Expense</h2>
                                <button onClick={() => setEditingExpense(null)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    setLoading(true);
                                    const form = e.target;
                                    const amount = parseFloat(form.amount.value);
                                    const description = form.description.value;

                                    const expenseId = editingExpense._id;

                                    await client.put(`/expenses/${expenseId}`, { amount, description }, {
                                        headers: { 'x-member-id': memberId }
                                    });

                                    // Refresh data
                                    fetchInitialData();
                                    setEditingExpense(null);
                                } catch (err) {
                                    alert("Failed to update expense");
                                } finally {
                                    setLoading(false);
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Description</label>
                                    <input
                                        name="description"
                                        type="text"
                                        defaultValue={editingExpense.description}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Amount</label>
                                    <input
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingExpense.amount}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingExpense(null)}
                                        className="mr-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }


            {/* Deposit Modal */}
            {
                showDepositModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Deposit Funds</h2>
                                <button onClick={() => setShowDepositModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Record a payment you made to the shared account (e.g., BHIM).
                            </p>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    setLoading(true);
                                    const amount = parseFloat(e.target.amount.value);

                                    await client.post(`/rooms/${roomId}/deposits`, {
                                        memberId,
                                        amount
                                    }, {
                                        headers: { 'x-member-id': memberId }
                                    });

                                    // Refresh
                                    fetchInitialData();
                                    setShowDepositModal(false);
                                } catch (err) {
                                    alert("Failed to add deposit");
                                } finally {
                                    setLoading(false);
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Amount</label>
                                    <input
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 500"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
                                >
                                    Confirm Deposit
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Member Confirmation Modal */}
            {memberToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-red-600 flex items-center">
                                <Trash2 className="w-5 h-5 mr-2" /> Delete Member
                            </h2>
                            <button onClick={() => setMemberToDelete(null)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-600 mb-2">
                                This will permanently remove <span className="font-bold text-gray-800">{memberToDelete.name}</span> from the room.
                                Their past expenses and deposits will remain, but their balance calculation might be affected.
                            </p>
                            <div className="bg-red-50 border border-red-100 rounded p-3 mb-4">
                                <p className="text-sm text-red-800 mb-1">To confirm, type the following:</p>
                                <code className="block bg-white px-2 py-1 rounded border border-red-200 font-mono text-sm select-all">
                                    delete {memberToDelete.name}
                                </code>
                            </div>

                            <input
                                type="text"
                                placeholder={`Type "delete ${memberToDelete.name}"`}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:outline-none"
                                onChange={(e) => {
                                    setMemberToDelete(prev => ({ ...prev, confirmationInput: e.target.value }));
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setMemberToDelete(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMember}
                                disabled={memberToDelete.confirmationInput !== `delete ${memberToDelete.name}`}
                                className={`px-6 py-2 text-white font-bold rounded transition ${memberToDelete.confirmationInput === `delete ${memberToDelete.name}`
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-red-300 cursor-not-allowed'
                                    }`}
                            >
                                Delete Member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {
                showAddMemberModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Add Member</h2>
                                <button onClick={() => setShowAddMemberModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    setLoading(true);
                                    const name = e.target.name.value;

                                    await client.post(`/rooms/${roomId}/members`, { name }, {
                                        headers: { 'x-member-id': memberId }
                                    });

                                    // Refresh
                                    fetchInitialData();
                                    setShowAddMemberModal(false);
                                } catch (err) {
                                    alert("Failed to add member");
                                } finally {
                                    setLoading(false);
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Name</label>
                                    <input
                                        name="name"
                                        type="text"
                                        placeholder="Member Name"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                                >
                                    Add Member
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Floating Action Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3">
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition transform hover:scale-105"
                        title="Add Member"
                    >
                        <UserPlus className="w-6 h-6" />
                    </button>
                )}
                <button
                    onClick={() => setShowDepositModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition transform hover:scale-105"
                    title="Deposit Money"
                >
                    <Check className="w-6 h-6" />
                </button>
                <button
                    onClick={() => navigate('/add-expense')}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition transform hover:scale-105"
                    title="Add Expense"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div >
    );
};

export default Dashboard;
