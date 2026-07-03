const API_BASE = 'http://localhost:4000/api';

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// ==================== WEBSITE FUNCTIONS ====================
export const getWebsites = () => {
    return apiRequest('websites').then(res => res.websites);
};

export const addWebsite = (url) => {
    return apiRequest('websites', {
        method: 'POST',
        body: JSON.stringify({ name: url, url })
    });
};

export const deleteWebsite = (id) => {
    return apiRequest(`websites/${id}`, {
        method: 'DELETE'
    });
};

// ==================== STATS FUNCTIONS ====================
export const getAllStats = () => {
    return apiRequest('websites/dashboard').then(res => res.stats);
};

export const getWebsiteHistory = (websiteId) => {
    return apiRequest(`websites/${websiteId}/history`).then(res => res);
};