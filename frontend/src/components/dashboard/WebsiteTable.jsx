import React, { useState, useEffect } from 'react';
import { getWebsites, addWebsite, deleteWebsite } from '../../api/api';

const WebsiteTable = () => {
    const [websites, setWebsites] = useState([]);
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadWebsites = async () => {
        try {
            setLoading(true);
            const data = await getWebsites();
            setWebsites(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWebsites();
        const interval = setInterval(loadWebsites, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;
        try {
            await addWebsite(url);
            setUrl('');
            await loadWebsites();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        try {
            await deleteWebsite(id);
            await loadWebsites();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Websites</h2>

            <form onSubmit={handleAdd} className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL (e.g., https://google.com)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
                >
                    Add Website
                </button>
            </form>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                    {error}
                </div>
            )}

            {loading && <p className="text-gray-500">Loading...</p>}

            {!loading && websites.length === 0 && (
                <p className="text-gray-500 text-center py-8">No websites monitored yet.</p>
            )}

            {!loading && websites.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">URL</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Last Check</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {websites.map((site) => (
                                <tr key={site.id || site.url} className="border-t border-gray-200">
                                    <td className="py-3 px-4">{site.name || site.url}</td>
                                    <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                                            site.status === 'up' ? 'bg-green-100 text-green-700' :
                                            site.status === 'down' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            <span className={`w-2 h-2 rounded-full inline-block ${
                                                site.status === 'up' ? 'bg-green-500' :
                                                site.status === 'down' ? 'bg-red-500' :
                                                'bg-yellow-500'
                                            }`}></span>
                                            {site.status === 'up' ? 'UP' :
                                             site.status === 'down' ? 'DOWN' :
                                             'Pending'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-500">
                                        {site.lastChecked ? new Date(site.lastChecked).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => handleDelete(site.id, site.name || site.url)}
                                            className="text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WebsiteTable;