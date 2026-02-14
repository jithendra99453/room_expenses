import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Try to load state from sessionStorage on boot
    const [user, setUser] = useState(() => {
        const saved = sessionStorage.getItem('room_app_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [room, setRoom] = useState(() => {
        const saved = sessionStorage.getItem('room_app_room');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        // Persist state changes
        if (user) sessionStorage.setItem('room_app_user', JSON.stringify(user));
        else sessionStorage.removeItem('room_app_user');

        if (room) sessionStorage.setItem('room_app_room', JSON.stringify(room));
        else sessionStorage.removeItem('room_app_room');
    }, [user, room]);

    const login = (userData, roomData) => {
        setUser(userData);
        setRoom(roomData);
    };

    const logout = () => {
        setUser(null);
        setRoom(null);
        sessionStorage.clear();
        // Also clear localStorage just in case to clean up old sessions
        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, room, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
