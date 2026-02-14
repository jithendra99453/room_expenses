
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const MagicLogin = () => {
    const { roomId, memberId } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [status, setStatus] = useState('Verifying magic link...');

    useEffect(() => {
        const verifyAndLogin = async () => {
            try {
                // 1. Verify existence by fetching room summary
                // We use the memberId as the key
                const res = await client.get(`/rooms/${roomId}/summary`, {
                    headers: { 'x-member-id': memberId }
                });

                // 2. Identify the member details from the response
                const summary = res.data.summary;
                const room = res.data.room;

                // Find member in summary to get name and role
                // summary keys are memberIds
                const memberData = summary[memberId];

                if (!memberData) {
                    throw new Error("Member not found in this room");
                }

                const member = {
                    _id: memberId,
                    name: memberData.name,
                    role: memberData.role
                };

                // 3. Login
                login(member, room);

                // 4. Redirect
                setStatus('Login successful! Redirecting...');
                setTimeout(() => navigate('/dashboard'), 1000);

            } catch (err) {
                console.error(err);
                setStatus('Invalid or expired link.');
                setTimeout(() => navigate('/'), 3000);
            }
        };

        if (roomId && memberId) {
            verifyAndLogin();
        } else {
            setStatus('Invalid link format.');
        }
    }, [roomId, memberId, login, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-800">Magic Login</h2>
                <div className="animate-pulse text-blue-600 font-medium">
                    {status}
                </div>
            </div>
        </div>
    );
};

export default MagicLogin;
