import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

function AppContent() {
    const { user, logout } = useAuth();
    const [showLogin, setShowLogin] = React.useState(false);

    if (!user) {
        return (
            <div>
                {showLogin ? (
                    <Login onSwitch={() => setShowLogin(false)} />
                ) : (
                    <Register onSwitch={() => setShowLogin(true)} />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">🚀 KingX Uptime Monitor</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-700">Welcome, <strong>{user.username}</strong></span>
                    <button
                        onClick={logout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                        Logout
                    </button>
                </div>
            </nav>
            <div className="p-6 max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-600">Your websites will appear here.</p>
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;