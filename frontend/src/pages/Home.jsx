import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-blue-600 mb-8">Room Expenses App</h1>

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
