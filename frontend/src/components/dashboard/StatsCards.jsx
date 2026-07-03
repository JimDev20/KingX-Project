import React, { useEffect, useState } from 'react';
import { getAllStats } from '../../api/api';

const StatsCards = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getAllStats();
            setStats(data || {});
        } catch (err) {
            console.error('Error loading stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    const totalSites = stats.totalSites || 0;
    const totalDown = stats.downSites || 0;
    const avgUptime = stats.uptime || 100;
    const avgResponse = stats.averageResponseTime || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <p className="text-sm text-gray-500">Total Sites</p>
                <p className="text-2xl font-bold text-gray-800">{totalSites}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <p className="text-sm text-gray-500">Avg Uptime</p>
                <p className="text-2xl font-bold text-green-600">{avgUptime}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <p className="text-sm text-gray-500">Sites Down</p>
                <p className="text-2xl font-bold text-red-600">{totalDown}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <p className="text-sm text-gray-500">Avg Response Time</p>
                <p className="text-2xl font-bold text-purple-600">{avgResponse}ms</p>
            </div>
        </div>
    );
};

export default StatsCards;