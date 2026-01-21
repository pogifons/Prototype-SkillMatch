// Toggle match breakdown
function toggleMatchBreakdown(id) {
    const breakdown = document.getElementById(`breakdown-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    
    if (breakdown.classList.contains('hidden')) {
        breakdown.classList.remove('hidden');
        chevron.classList.remove('fa-chevron-down');
        chevron.classList.add('fa-chevron-up');
    } else {
        breakdown.classList.add('hidden');
        chevron.classList.remove('fa-chevron-up');
        chevron.classList.add('fa-chevron-down');
    }
}

// Mobile sidebar toggle (if needed)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

// Keyboard navigation for accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open breakdowns
        document.querySelectorAll('[id^="breakdown-"]').forEach(el => {
            if (!el.classList.contains('hidden')) {
                const id = el.id.split('-')[1];
                toggleMatchBreakdown(id);
            }
        });
    }
});

// Logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Destroy JWT token
        localStorage.removeItem('token');
        localStorage.removeItem('employer');
        // Redirect to login
        window.location.href = '/login.html';
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const dashboardData = await window.API.employer.getDashboard();
        
        // If API not available, use demo data
        if (!dashboardData) {
            console.log('API not available - using demo mode');
            return;
        }
        
        // Update KPI stats
        updateKPICard('activeJobs', dashboardData.stats?.activeJobs || 0);
        updateKPICard('newApplicants', dashboardData.stats?.newApplicants || 0);
        updateKPICard('interviews', dashboardData.stats?.interviewsScheduled || 0);
        updateKPICard('aiMatch', dashboardData.stats?.aiMatchAccuracy || 0, '%');
        
        // Update recent applicants
        if (dashboardData.recentApplicants && dashboardData.recentApplicants.length > 0) {
            renderRecentApplicants(dashboardData.recentApplicants);
        } else {
            document.querySelector('table[aria-label="Recent applicants"] tbody').innerHTML = 
                '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No applicants yet</td></tr>';
        }
        
        // Update recent jobs
        if (dashboardData.recentJobs && dashboardData.recentJobs.length > 0) {
            renderRecentJobs(dashboardData.recentJobs);
        } else {
            document.querySelector('table[aria-label="Recent job postings"] tbody').innerHTML = 
                '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No job postings yet</td></tr>';
        }
        
        // Update welcome message with employer username/name
        const employer = JSON.parse(localStorage.getItem('employer') || '{}');
        if (employer) {
            // Get employer name - prefer companyName, fallback to email username
            const employerName = employer.companyName || 
                                (employer.email ? employer.email.split('@')[0] : 'User');
            
            const welcomeHeading = document.querySelector('header h1.font-serif');
            if (welcomeHeading) {
                welcomeHeading.textContent = `Welcome back, ${employerName}`;
            }
            
            // Update user card with employer name
            if (employer.companyName) {
                const userCardName = document.getElementById('employerName');
                if (userCardName) {
                    userCardName.textContent = employer.companyName;
                }
                // Update initials in user card
                const initials = employer.companyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const initialsElement = document.getElementById('employerInitials');
                if (initialsElement) {
                    initialsElement.textContent = initials;
                }
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateKPICard(type, value, suffix = '') {
    // Use more specific selectors to target only KPI cards, not the welcome message
    // Find the KPI stats grid container first (the one with 4 columns)
    const kpiGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    if (!kpiGrid) return;
    
    const cards = {
        'activeJobs': { index: 0 },
        'newApplicants': { index: 1 },
        'interviews': { index: 2 },
        'aiMatch': { index: 3 }
    };
    
    const card = cards[type];
    if (card) {
        // Only select .text-3xl elements within the KPI grid, not the header
        const elements = kpiGrid.querySelectorAll('.text-3xl.font-bold.text-gray-900');
        if (elements[card.index]) {
            elements[card.index].textContent = value + suffix;
        }
    }
}

function renderRecentApplicants(applicants) {
    const tbody = document.querySelector('table[aria-label="Recent applicants"] tbody');
    if (!tbody) return;
    
    // Color palette for avatars
    const avatarColors = [
        'bg-teal-600', 'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 
        'bg-indigo-600', 'bg-green-600', 'bg-yellow-600', 'bg-orange-600',
        'bg-red-600', 'bg-cyan-600'
    ];
    
    tbody.innerHTML = applicants.slice(0, 4).map((applicant, index) => {
        const application = applicant.applications && applicant.applications[0];
        const job = application?.jobId || {};
        const matchScore = application?.matchScore || 0;
        const initials = `${applicant.firstName?.[0] || ''}${applicant.lastName?.[0] || ''}`.toUpperCase();
        const avatarColor = avatarColors[index % avatarColors.length];
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-sm" style="min-width: 40px; min-height: 40px; display: flex !important; visibility: visible !important; opacity: 1 !important;">
                            ${initials || '?'}
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900">${applicant.firstName} ${applicant.lastName}</div>
                            <div class="text-sm text-gray-500">${applicant.email || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-gray-900">${job.title || 'N/A'}</div>
                    <div class="text-sm text-gray-500">${applicant.experience?.[0]?.yearsOfExperience || ''} years experience</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-1 text-gray-600">
                        <i class="fas fa-map-marker-alt text-teal-600 text-xs"></i>
                        <span>${applicant.location || 'N/A'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-teal-600 font-semibold">${matchScore}%</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button class="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
                        View Profile
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderRecentJobs(jobs) {
    const tbody = document.querySelector('table[aria-label="Recent job postings"] tbody');
    if (!tbody) return;
    
    tbody.innerHTML = jobs.slice(0, 4).map(job => {
        const applicantCount = job.applications?.length || 0;
        const statusBadge = job.status === 'active' ? 'badge-green' : job.status === 'pending' ? 'badge-orange' : 'badge-gray';
        const statusText = job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Draft';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-briefcase text-blue-600"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900">${job.title}</div>
                            <div class="text-sm text-gray-500">${job.department || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-1 text-gray-600">
                        <i class="fas fa-map-marker-alt text-teal-600 text-xs"></i>
                        <span>${job.location || 'N/A'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-600">${applicantCount} applicant${applicantCount !== 1 ? 's' : ''}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${statusBadge}">${statusText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button class="text-gray-400 hover:text-gray-600" aria-label="More options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Load employer info immediately from localStorage to prevent flash
function loadEmployerInfoImmediate() {
    try {
        const employerStr = localStorage.getItem('employer');
        if (employerStr) {
            const employer = JSON.parse(employerStr);
            if (employer && employer.companyName) {
                const companyName = employer.companyName;
                const initials = companyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                
                const companyNameElement = document.getElementById('employerName');
                if (companyNameElement) {
                    companyNameElement.textContent = companyName;
                }
                
                const initialsElement = document.getElementById('employerInitials');
                if (initialsElement) {
                    initialsElement.textContent = initials;
                }
            }
        }
    } catch (error) {
        console.error('Error loading employer info immediately:', error);
    }
}

// Load employer info immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEmployerInfoImmediate);
} else {
    loadEmployerInfoImmediate();
}

// Handle logout button click
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard data
    if (window.API && window.API.employer) {
        loadDashboard();
    }
    
    const logoutLinks = document.querySelectorAll('a[href="login.html"]');
    logoutLinks.forEach(link => {
        // Check if this is the logout link (has sign-out icon or contains "Logout" text)
        const linkText = link.textContent.trim();
        const hasLogoutIcon = link.querySelector('.fa-sign-out-alt');
        
        if (hasLogoutIcon || linkText.includes('Logout')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.API && window.API.auth) {
                    window.API.auth.logout();
                } else {
                    // Fallback if API is not loaded
                    localStorage.removeItem('token');
                    localStorage.removeItem('employer');
                    window.location.href = '/login.html';
                }
            });
        }
    });
});

