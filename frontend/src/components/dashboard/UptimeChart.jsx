import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAllStats } from '../../api/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const UptimeChart = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getAllStats();
            setStats(data);
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
        return <div className="bg-white rounded-lg shadow p-6 animate-pulse">Loading charts...</div>;
    }

    const urls = Object.keys(stats);
    if (urls.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No data available. Add a website to see charts.
            </div>
        );
    }

    const uptimeValues = urls.map(url => stats[url]?.uptime || 0);
    const avgUptime = Math.round(uptimeValues.reduce((a, b) => a + b, 0) / urls.length * 10) / 10;

    const pieData = {
        labels: ['UP', 'DOWN'],
        datasets: [{
            data: [avgUptime, 100 - avgUptime],
            backgroundColor: ['#22c55e', '#ef4444'],
            borderWidth: 1
        }]
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Uptime Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                    <div className="max-w-xs mx-auto">
                        <Pie data={pieData} />
                    </div>
                </div>
                <div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Average Uptime</p>
                            <p className="text-3xl font-bold text-green-600">{avgUptime}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Sites</p>
                            <p className="text-xl font-bold text-gray-800">{urls.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Sites with Data</p>
                            <p className="text-xl font-bold text-gray-800">
                                {urls.filter(url => stats[url]?.totalChecks > 0).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UptimeChart;