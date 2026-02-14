import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const Home = () => {
    const [health, setHealth] = useState('');

    useEffect(() => {
        client.get('/')
            .then(res => setHealth(res.data))
            .catch(err => setHealth('Error connecting to backend'));
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">Room Expenses App</h1>
            <p className="text-lg text-gray-700 mb-8">Backend Status: <span className="font-mono bg-white px-2 py-1 rounded border border-gray-300">{health}</span></p>

            <div className="space-x-4">
                <Link to="/create" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow transition inline-block">
                    Create Room
                </Link>
                <Link to="/join" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded shadow transition inline-block">
                    Member Login
                </Link>
            </div>
        </div>
    );
};

export default Home;
