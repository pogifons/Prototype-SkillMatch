// Load and update employer info in sidebar
async function loadEmployerInfo() {
    try {
        let employer = null;
        
        // First, try to load from localStorage immediately (synchronous) to avoid flash
        const employerStr = localStorage.getItem('employer');
        if (employerStr) {
            try {
                employer = JSON.parse(employerStr);
                // Update immediately with cached data
                updateEmployerUI(employer);
            } catch (e) {
                console.error('Error parsing employer from localStorage:', e);
            }
        }
        
        // Then try to get from API to refresh data
        if (window.API && window.API.auth && window.API.auth.getCurrentUser) {
            try {
                employer = await window.API.auth.getCurrentUser();
                // Store in localStorage for future use
                if (employer) {
                    localStorage.setItem('employer', JSON.stringify(employer));
                    updateEmployerUI(employer);
                }
            } catch (error) {
                console.log('Could not fetch employer from API, using cached data:', error);
            }
        }
    } catch (error) {
        console.error('Error loading employer info:', error);
    }
}

function updateEmployerUI(employer) {
    if (!employer) return;
    
    const companyName = employer.companyName || 'Employer';
    const initials = companyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    // Update company name
    const companyNameElement = document.getElementById('employerName');
    if (companyNameElement) {
        companyNameElement.textContent = companyName;
    }
    
    // Update initials
    const initialsElement = document.getElementById('employerInitials');
    if (initialsElement) {
        initialsElement.textContent = initials;
    }
}

// Load employer info immediately if DOM is ready, otherwise wait
function initEmployerInfo() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadEmployerInfo);
    } else {
        loadEmployerInfo();
    }
}

// Start loading employer info immediately
initEmployerInfo();

// Load analytics KPIs from backend
async function loadAnalyticsDashboard() {
    if (!window.API || !window.API.analytics) return;
    try {
        const data = await window.API.analytics.getDashboard();

        const totalViewsEl = document.getElementById('totalViewsValue');
        const totalApplicationsEl = document.getElementById('totalApplicationsValue');
        const successfulHiresEl = document.getElementById('successfulHiresValue');
        const conversionRateEl = document.getElementById('conversionRateValue');

        if (totalViewsEl && typeof data.totalViews === 'number') {
            totalViewsEl.textContent = data.totalViews.toLocaleString();
        }
        if (totalApplicationsEl && typeof data.totalApplications === 'number') {
            totalApplicationsEl.textContent = data.totalApplications.toLocaleString();
        }
        if (successfulHiresEl && typeof data.successfulHires === 'number') {
            successfulHiresEl.textContent = data.successfulHires.toLocaleString();
        }
        if (conversionRateEl && typeof data.conversionRate === 'number') {
            conversionRateEl.textContent = `${data.conversionRate.toFixed(1)}%`;
        }
    } catch (error) {
        console.error('Error loading analytics dashboard:', error);
    }
}

// Wire up Export Report button to download CSV from backend
function setupExportButton() {
    if (!window.API || !window.API.analytics) return;

    let targetButton = null;
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn) => {
        if (!targetButton && btn.textContent.trim().includes('Export Report')) {
            targetButton = btn;
        }
    });

    if (!targetButton) return;

    targetButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const blob = await window.API.analytics.exportReport('applicants', 'csv');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-report-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting report:', error);
        }
    });
}

// Initialize analytics page: logout handling, KPIs, export
document.addEventListener('DOMContentLoaded', () => {
    const logoutLinks = document.querySelectorAll('a[href="login.html"]');
    logoutLinks.forEach(link => {
        const linkText = link.textContent.trim();
        const hasLogoutIcon = link.querySelector('.fa-sign-out-alt');

        if (hasLogoutIcon || linkText.includes('Logout')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.API && window.API.auth) {
                    window.API.auth.logout();
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('employer');
                    window.location.href = '/login.html';
                }
            });
        }
    });

    loadAnalyticsDashboard();
    setupExportButton();
});

