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

    // Forgot Password - request reset code
    requestPasswordReset: async (email) => {
        return await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    // Reset Password - submit code and new password
    resetPassword: async (email, code, newPassword) => {
        return await apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, code, newPassword })
        });
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
    getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/jobs${queryParams ? '?' + queryParams : ''}`);
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

    close: async (id) => {
        return await apiRequest(`/jobs/${id}/close`, {
            method: 'PUT'
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

    getByJob: async (jobId, filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/applicants/job/${jobId}${queryParams ? '?' + queryParams : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/applicants/${id}`);
    },

    updateStatus: async (id, jobId, status, interviewDate) => {
        return await apiRequest(`/applicants/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ jobId, status, interviewDate })
        });
    },

    addNote: async (id, jobId, note) => {
        return await apiRequest(`/applicants/${id}/notes`, {
            method: 'POST',
            body: JSON.stringify({ jobId, note })
        });
    },

    sendMessage: async (id, jobId, subject, message) => {
        return await apiRequest(`/applicants/${id}/message`, {
            method: 'POST',
            body: JSON.stringify({ jobId, subject, message })
        });
    },

    computeMatchScore: async (id, jobId) => {
        return await apiRequest(`/applicants/${id}/compute-match/${jobId}`, {
            method: 'POST'
        });
    },

    getRecommendedTrainings: async (id) => {
        return await apiRequest(`/applicants/${id}/recommended-trainings`);
    },

    getAssessmentHistory: async (id) => {
        return await apiRequest(`/applicants/${id}/assessment-history`);
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

    assign: async (trainingId, applicantId, targetCompletionDate) => {
        return await apiRequest('/training/assign', {
            method: 'POST',
            body: JSON.stringify({ trainingId, applicantId, targetCompletionDate })
        });
    },

    updateProgress: async (applicantId, trainingId, status, completionDate, assessmentScore) => {
        return await apiRequest(`/training/progress/${applicantId}/${trainingId}`, {
            method: 'PUT',
            body: JSON.stringify({ status, completionDate, assessmentScore })
        });
    },

    getApplicantProgress: async (applicantId) => {
        return await apiRequest(`/training/applicant/${applicantId}`);
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

    getInsights: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/analytics/insights${queryParams ? '?' + queryParams : ''}`);
    },

    getTimeToHire: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/analytics/time-to-hire${queryParams ? '?' + queryParams : ''}`);
    },

    exportReport: async (type, format, filters = {}) => {
        const params = { type, format, ...filters };
        const queryParams = new URLSearchParams(params).toString();
        return await fetch(`${API_BASE_URL}/analytics/export?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        }).then(response => {
            if (!response.ok) throw new Error('Export failed');
            return response.blob();
        });
    }
};

// Employer API
const employerAPI = {
    getDashboard: async () => {
        return await apiRequest('/employer/dashboard');
    },

    updateProfile: async (profileData) => {
        return await apiRequest('/employer/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    changePassword: async (currentPassword, newPassword) => {
        return await apiRequest('/employer/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    getTeam: async () => {
        return await apiRequest('/employer/team');
    },

    addTeamMember: async (email, role) => {
        return await apiRequest('/employer/team', {
            method: 'POST',
            body: JSON.stringify({ email, role })
        });
    },

    removeTeamMember: async (email) => {
        return await apiRequest(`/employer/team/${email}`, {
            method: 'DELETE'
        });
    },

    updateTeamMemberRole: async (email, role) => {
        return await apiRequest(`/employer/team/${email}`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
    },

    getNotifications: async () => {
        return await apiRequest('/employer/notifications');
    },

    updateNotifications: async (preferences) => {
        return await apiRequest('/employer/notifications', {
            method: 'PUT',
            body: JSON.stringify(preferences)
        });
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

