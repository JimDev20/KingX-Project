const API_BASE = 'https://kingx-project.onrender.com/api';

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
    return apiRequest('websites');
};

export const addWebsite = (url) => {
    return apiRequest('websites', {
        method: 'POST',
        body: JSON.stringify({ url })
    });
};

export const deleteWebsite = (url) => {
    return apiRequest(`websites/${encodeURIComponent(url)}`, {
        method: 'DELETE'
    });
};

// ==================== STATS FUNCTIONS ====================
export const getAllStats = () => {
    return apiRequest('websites/all-stats');
};

export const getWebsiteHistory = (url) => {
    return apiRequest(`websites/history/${encodeURIComponent(url)}`);
};