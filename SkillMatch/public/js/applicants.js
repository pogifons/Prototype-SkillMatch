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

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('[id^="breakdown-"]').forEach(el => {
            if (!el.classList.contains('hidden')) {
                const id = el.id.split('-')[1];
                toggleMatchBreakdown(id);
            }
        });
    }
});

// Load applicants from database
async function loadApplicants() {
    try {
        console.log('Loading applicants...');
        if (!window.API || !window.API.applicants) {
            console.error('API not available');
            return;
        }
        
        const applicants = await window.API.applicants.getAll();
        console.log('Applicants loaded:', applicants);
        renderApplicants(applicants);
        updateApplicantStats(applicants);
    } catch (error) {
        console.error('Error loading applicants:', error);
        const tbody = document.querySelector('table tbody');
        if (tbody) {
            const errorMsg = error.message || 'Error loading applicants. Please try again.';
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">${errorMsg}</td></tr>`;
        }
    }
}

function renderApplicants(applicants) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    
    if (applicants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No applicants yet.</td></tr>';
        return;
    }
    
    // Color palette for avatars
    const avatarColors = [
        'bg-teal-600', 'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 
        'bg-indigo-600', 'bg-green-600', 'bg-yellow-600', 'bg-orange-600',
        'bg-red-600', 'bg-cyan-600'
    ];
    
    tbody.innerHTML = applicants.map((applicant, index) => {
        const application = applicant.applications && applicant.applications[0];
        const job = application?.jobId || {};
        const matchScore = application?.matchScore || 0;
        const status = application?.status || 'new';
        const initials = `${applicant.firstName?.[0] || ''}${applicant.lastName?.[0] || ''}`.toUpperCase();
        const avatarColor = avatarColors[index % avatarColors.length];
        
        const statusBadge = status === 'new' ? 'badge-blue' :
                           status === 'shortlisted' ? 'badge-green' :
                           status === 'interview' ? 'badge-yellow' :
                           status === 'hired' ? 'badge-green' :
                           status === 'rejected' ? 'badge-red' : 'badge-gray';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-sm" style="min-width: 40px; min-height: 40px; display: flex !important; visibility: visible !important;">
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
                    <div class="text-sm text-gray-500">${applicant.experience?.[0] ? `${applicant.experience[0].yearsOfExperience || ''} years experience` : ''}</div>
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
                    <span class="badge ${statusBadge}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="viewApplicant('${applicant._id}')" class="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
                        View Profile
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateApplicantStats(applicants) {
    const totalApplicants = applicants.length;
    const newApplicants = applicants.filter(a => a.applications?.[0]?.status === 'new').length;
    const shortlisted = applicants.filter(a => a.applications?.[0]?.status === 'shortlisted').length;
    
    // Update stats if elements exist
    const statsElements = document.querySelectorAll('.stat-value');
    if (statsElements.length >= 3) {
        statsElements[0].textContent = totalApplicants;
        statsElements[1].textContent = newApplicants;
        statsElements[2].textContent = shortlisted;
    }
}

function viewApplicant(applicantId) {
    // TODO: Implement view applicant functionality
    console.log('View applicant:', applicantId);
}

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

// Handle logout button click
document.addEventListener('DOMContentLoaded', () => {
    
    // Load applicants when page loads
    if (window.API && window.API.applicants) {
        loadApplicants();
    }
    
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
});

