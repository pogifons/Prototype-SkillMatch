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
            <tr class="hover:bg-gray-50 applicant-row" data-applicant-id="${applicant._id}">
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
                <td class="px-6 py-4 whitespace-nowrap" onclick="event.stopPropagation()">
                    <button onclick="viewApplicant('${applicant._id}')" class="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
                        View Profile
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Attach click handlers after rendering
    attachApplicantRowClickHandlers();
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

// Applicant Details Modal Functions
const applicantDetailsModal = document.getElementById('applicantDetailsModal');
const applicantDetailsClose = document.getElementById('applicantDetailsClose');
const applicantDetailsCloseBtn = document.getElementById('applicantDetailsCloseBtn');

function openApplicantDetailsModal(applicantId) {
    // Fetch full applicant details
    window.API.applicants.getById(applicantId)
        .then(applicant => {
            displayApplicantDetails(applicant);
            applicantDetailsModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        })
        .catch(error => {
            console.error('Error fetching applicant details:', error);
            alert('Error loading applicant details: ' + error.message);
        });
}

function closeApplicantDetailsModal() {
    applicantDetailsModal.classList.remove('open');
    document.body.style.overflow = '';
}

function displayApplicantDetails(applicant) {
    const content = document.getElementById('applicantDetailsContent');
    const title = document.getElementById('applicantDetailsTitle');
    
    if (!content || !title) return;
    
    const fullName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim();
    title.textContent = fullName || 'Applicant Details';
    
    const initials = `${applicant.firstName?.[0] || ''}${applicant.lastName?.[0] || ''}`.toUpperCase();
    const avatarColors = ['bg-teal-600', 'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-green-600'];
    const avatarColor = avatarColors[Math.abs(fullName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % avatarColors.length];
    
    const application = applicant.applications && applicant.applications[0];
    const job = application?.jobId || {};
    const matchScore = application?.matchScore || 0;
    const status = application?.status || 'new';
    const appliedDate = application?.appliedAt ? 
        new Date(application.appliedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : 'N/A';
    
    const statusBadge = status === 'new' ? 'badge-blue' :
                       status === 'shortlisted' ? 'badge-green' :
                       status === 'interview' ? 'badge-yellow' :
                       status === 'hired' ? 'badge-green' :
                       status === 'rejected' ? 'badge-red' : 'badge-gray';
    const statusText = status?.charAt(0).toUpperCase() + status?.slice(1) || 'New';
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Header Section -->
            <div class="flex items-start gap-6 pb-6 border-b border-gray-200">
                <div class="w-20 h-20 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    ${initials || '?'}
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="font-serif text-2xl font-bold text-navy">${fullName}</h3>
                        <span class="badge ${statusBadge}">${statusText}</span>
                    </div>
                    <div class="space-y-1 text-sm text-gray-600">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-envelope text-teal-600"></i>
                            <span>${applicant.email || 'N/A'}</span>
                        </div>
                        ${applicant.phone ? `
                            <div class="flex items-center gap-2">
                                <i class="fas fa-phone text-teal-600"></i>
                                <span>${applicant.phone}</span>
                            </div>
                        ` : ''}
                        ${applicant.location ? `
                            <div class="flex items-center gap-2">
                                <i class="fas fa-map-marker-alt text-teal-600"></i>
                                <span>${applicant.location}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Application Info Section -->
            <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                    <h5 class="text-sm font-semibold text-gray-700 mb-1">Applied Position</h5>
                    <p class="text-sm text-gray-900">${job.title || 'N/A'}</p>
                </div>
                <div>
                    <h5 class="text-sm font-semibold text-gray-700 mb-1">Match Score</h5>
                    <p class="text-sm text-gray-900 font-semibold text-teal-600">${matchScore}%</p>
                </div>
                <div>
                    <h5 class="text-sm font-semibold text-gray-700 mb-1">Applied Date</h5>
                    <p class="text-sm text-gray-900">${appliedDate}</p>
                </div>
                <div>
                    <h5 class="text-sm font-semibold text-gray-700 mb-1">Application Status</h5>
                    <span class="badge ${statusBadge}">${statusText}</span>
                </div>
            </div>
            
            <!-- Skills Section -->
            ${applicant.skills && applicant.skills.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <i class="fas fa-tools text-teal-600"></i>
                        Skills
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${applicant.skills.map(skill => `
                            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="font-medium text-gray-900">${skill.skill || 'N/A'}</span>
                                    <span class="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded">
                                        ${skill.level ? skill.level.charAt(0).toUpperCase() + skill.level.slice(1) : 'N/A'}
                                    </span>
                                </div>
                                ${skill.yearsOfExperience ? `
                                    <div class="text-xs text-gray-600">
                                        ${skill.yearsOfExperience} year${skill.yearsOfExperience !== 1 ? 's' : ''} of experience
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Experience Section -->
            ${applicant.experience && applicant.experience.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <i class="fas fa-briefcase text-teal-600"></i>
                        Work Experience
                    </h4>
                    <div class="space-y-4">
                        ${applicant.experience.map(exp => {
                            const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'N/A';
                            const endDate = exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present';
                            return `
                                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div class="flex items-start justify-between mb-2">
                                        <div>
                                            <h5 class="font-semibold text-gray-900">${exp.position || 'N/A'}</h5>
                                            <p class="text-sm text-gray-600">${exp.company || 'N/A'}</p>
                                        </div>
                                        <span class="text-xs text-gray-500 whitespace-nowrap ml-4">${startDate} - ${endDate}</span>
                                    </div>
                                    ${exp.description ? `
                                        <p class="text-sm text-gray-700 mt-2">${exp.description}</p>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Education Section -->
            ${applicant.education && applicant.education.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <i class="fas fa-graduation-cap text-teal-600"></i>
                        Education
                    </h4>
                    <div class="space-y-3">
                        ${applicant.education.map(edu => `
                            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h5 class="font-semibold text-gray-900">${edu.degree || 'N/A'}</h5>
                                <p class="text-sm text-gray-600">${edu.institution || 'N/A'}</p>
                                ${edu.year ? `<p class="text-xs text-gray-500 mt-1">${edu.year}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Certifications Section -->
            ${applicant.certifications && applicant.certifications.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <i class="fas fa-certificate text-teal-600"></i>
                        Certifications
                    </h4>
                    <div class="space-y-3">
                        ${applicant.certifications.map(cert => {
                            const certDate = cert.date ? new Date(cert.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A';
                            const expiryDate = cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'No expiry';
                            return `
                                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div class="flex items-start justify-between">
                                        <div>
                                            <h5 class="font-semibold text-gray-900">${cert.name || 'N/A'}</h5>
                                            <p class="text-sm text-gray-600">${cert.issuer || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div class="text-xs text-gray-500 mt-2">
                                        <span>Issued: ${certDate}</span>
                                        ${cert.expiryDate ? ` | Expires: ${expiryDate}` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Event listeners for applicant details modal
if (applicantDetailsClose) {
    applicantDetailsClose.addEventListener('click', closeApplicantDetailsModal);
}
if (applicantDetailsCloseBtn) {
    applicantDetailsCloseBtn.addEventListener('click', closeApplicantDetailsModal);
}
if (applicantDetailsModal) {
    applicantDetailsModal.addEventListener('click', (e) => {
        if (e.target === applicantDetailsModal) closeApplicantDetailsModal();
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && applicantDetailsModal.classList.contains('open')) {
            closeApplicantDetailsModal();
        }
    });
}

// Add click handlers to applicant rows after rendering
function attachApplicantRowClickHandlers() {
    document.querySelectorAll('.applicant-row').forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't open modal if clicking on buttons
            if (e.target.closest('button')) {
                return;
            }
            const applicantId = row.getAttribute('data-applicant-id');
            if (applicantId) {
                openApplicantDetailsModal(applicantId);
            }
        });
    });
}

function viewApplicant(applicantId) {
    openApplicantDetailsModal(applicantId);
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

