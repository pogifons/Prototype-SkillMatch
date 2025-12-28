// API Client for SkillMatch Backend

// Automatically detect the API base URL from the current host
const API_BASE_URL = `${window.location.origin}/api`;

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Set token in localStorage
function setToken(token) {
    localStorage.setItem('token', token);
}

// Remove token from localStorage
function removeToken() {
    localStorage.removeItem('token');
}

// Make API request with authentication
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();
        
        if (!response.ok) {
            // For 401 errors on auth endpoints (login/register), don't redirect - show error
            if (response.status === 401 && (endpoint.includes('/auth/login') || endpoint.includes('/auth/register'))) {
                throw new Error(data.error || 'Authentication failed');
            }
            // For 401 errors on other endpoints, token expired - redirect to login
            if (response.status === 401) {
                removeToken();
                localStorage.removeItem('employer');
                window.location.href = '/login.html';
                return;
            }
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Auth API
const authAPI = {
    register: async (employerData) => {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(employerData)
        });
        if (response.token) {
            setToken(response.token);
        }
        return response;
    },

    login: async (email, password) => {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (response.token) {
            setToken(response.token);
        }
        return response;
    },

    getCurrentUser: async () => {
        return await apiRequest('/auth/me');
    },

    logout: () => {
        removeToken();
        localStorage.removeItem('employer');
        window.location.href = '/login.html';
    }
};

// Jobs API
const jobsAPI = {
    getAll: async () => {
        return await apiRequest('/jobs');
    },

    getById: async (id) => {
        return await apiRequest(`/jobs/${id}`);
    },

    create: async (jobData) => {
        return await apiRequest('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });
    },

    update: async (id, jobData) => {
        return await apiRequest(`/jobs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(jobData)
        });
    },

    delete: async (id) => {
        return await apiRequest(`/jobs/${id}`, {
            method: 'DELETE'
        });
    },

    getStats: async () => {
        return await apiRequest('/jobs/stats/summary');
    }
};

// Applicants API
const applicantsAPI = {
    getAll: async () => {
        return await apiRequest('/applicants');
    },

    getByJob: async (jobId) => {
        return await apiRequest(`/applicants/job/${jobId}`);
    },

    getById: async (id) => {
        return await apiRequest(`/applicants/${id}`);
    },

    updateStatus: async (id, jobId, status) => {
        return await apiRequest(`/applicants/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ jobId, status })
        });
    },

    getStats: async () => {
        return await apiRequest('/applicants/stats/summary');
    }
};

// Training API
const trainingAPI = {
    getAll: async () => {
        return await apiRequest('/training');
    },

    getById: async (id) => {
        return await apiRequest(`/training/${id}`);
    },

    create: async (trainingData) => {
        return await apiRequest('/training', {
            method: 'POST',
            body: JSON.stringify(trainingData)
        });
    },

    update: async (id, trainingData) => {
        return await apiRequest(`/training/${id}`, {
            method: 'PUT',
            body: JSON.stringify(trainingData)
        });
    },

    delete: async (id) => {
        return await apiRequest(`/training/${id}`, {
            method: 'DELETE'
        });
    },

    getStats: async () => {
        return await apiRequest('/training/stats/summary');
    }
};

// Analytics API
const analyticsAPI = {
    getDashboard: async () => {
        return await apiRequest('/analytics/dashboard');
    },

    getInsights: async () => {
        return await apiRequest('/analytics/insights');
    }
};

// Employer API
const employerAPI = {
    getDashboard: async () => {
        return await apiRequest('/employer/dashboard');
    }
};

// Export API objects
window.API = {
    auth: authAPI,
    jobs: jobsAPI,
    applicants: applicantsAPI,
    training: trainingAPI,
    analytics: analyticsAPI,
    employer: employerAPI
};

