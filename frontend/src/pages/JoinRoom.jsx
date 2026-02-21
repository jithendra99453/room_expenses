import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Loader2, Key } from 'lucide-react';

const JoinRoom = () => {
    const [formData, setFormData] = useState({
        roomId: '',
        accessKey: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await client.post('/rooms/login', {
                roomId: formData.roomId.trim(),
                accessKey: formData.accessKey.trim()
            });

            login(res.data.member, res.data.room);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid Room ID or Access Key');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <Link
                    to="/"
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition inline-block"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Link>

                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <Key className="w-6 h-6 mr-2 text-green-600" /> Member Login
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Room ID</label>
                        <input
                            type="text"
                            name="roomId"
                            value={formData.roomId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none transition uppercase tracking-widest"
                            placeholder="e.g. X7F3K9"
                            maxLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Access Key (Member ID)</label>
                        <input
                            type="text"
                            name="accessKey"
                            value={formData.accessKey}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none transition font-mono text-sm"
                            placeholder="Paste your Access Key here"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ask your Admin for your unique Access Key.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition flex items-center justify-center disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinRoom;
