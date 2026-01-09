const postJobBtn = document.getElementById('postJobBtn');
const jobModal = document.getElementById('jobModal');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');
const skillsInput = document.getElementById('skillsInput');
const skillInput = skillsInput.querySelector('input');
const aiSuggestions = document.getElementById('aiSuggestions');

postJobBtn.addEventListener('click', () => {
    jobModal.classList.add('open');
    document.body.style.overflow = 'hidden';
});

function closeModal() {
    jobModal.classList.remove('open');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
jobModal.addEventListener('click', (e) => {
    if (e.target === jobModal) closeModal();
});

skillInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = skillInput.value.trim();
        if (value) {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.innerHTML = `${value} <button type="button">&times;</button>`;
            skillsInput.insertBefore(tag, skillInput);
            skillInput.value = '';
            tag.querySelector('button').addEventListener('click', () => tag.remove());
        }
    }
});

document.querySelectorAll('.skill-tag button').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.remove());
});

aiSuggestions.querySelectorAll('span').forEach(tag => {
    tag.addEventListener('click', () => {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `${tag.textContent} <button type="button">&times;</button>`;
        skillsInput.insertBefore(skillTag, skillsInput);
        tag.remove();
        skillTag.querySelector('button').addEventListener('click', () => skillTag.remove());
    });
});

// Load jobs from database
async function loadJobs() {
    try {
        console.log('Loading jobs...');
        if (!window.API || !window.API.jobs) {
            console.error('API not available');
            return;
        }
        
        const jobs = await window.API.jobs.getAll();
        console.log('Jobs loaded:', jobs);
        renderJobs(jobs);
        updateJobStats(jobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        const gridContainer = document.querySelector('.grid');
        const tbody = document.querySelector('table tbody');
        
        const errorMsg = error.message || 'Error loading jobs. Please try again.';
        if (gridContainer) {
            gridContainer.innerHTML = `<div class="col-span-full text-center text-red-500 py-8">${errorMsg}</div>`;
        } else if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">${errorMsg}</td></tr>`;
        }
    }
}

function renderJobs(jobs) {
    // Try to find container - could be table tbody or grid container
    const tbody = document.querySelector('table tbody');
    // Find the jobs grid container (more specific selector)
    const gridContainer = document.querySelector('main .grid.grid-cols-1') || 
                         document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2') ||
                         document.querySelector('main .grid');
    const container = tbody || gridContainer;
    
    if (!container) {
        console.error('Could not find jobs container');
        return;
    }
    
    console.log('Rendering jobs to container:', container);
    
    if (jobs.length === 0) {
        console.log('No jobs to display');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No job postings yet. Click "Post New Job" to create one.</td></tr>';
        } else if (gridContainer) {
            gridContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No job postings yet. Click "Post New Job" to create one.</div>';
        }
        return;
    }
    
    console.log(`Rendering ${jobs.length} jobs`);
    
    if (tbody) {
        // Table format
        tbody.innerHTML = jobs.map(job => {
            const applicantCount = job.applications?.length || 0;
            const statusBadge = job.status === 'active' ? 'badge-green' : 
                               job.status === 'pending' ? 'badge-orange' : 
                               job.status === 'closed' ? 'badge-gray' : 'badge-yellow';
            const statusText = job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Draft';
            const createdDate = new Date(job.createdAt).toLocaleDateString();
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="font-semibold text-gray-900">${job.title}</div>
                        <div class="text-sm text-gray-500">${job.department || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-1 text-gray-600">
                            <i class="fas fa-map-marker-alt text-teal-600 text-xs"></i>
                            <span>${job.location || 'N/A'}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${createdDate}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-600">${applicantCount}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="badge ${statusBadge}">${statusText}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="editJob('${job._id}')" class="text-teal-600 hover:text-teal-900 mr-4">Edit</button>
                        <button onclick="deleteJob('${job._id}')" class="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    } else if (gridContainer) {
        // Card format
        gridContainer.innerHTML = jobs.map(job => {
            const applicantCount = job.applications?.length || 0;
            const statusBadge = job.status === 'active' ? 'badge-green' : 
                               job.status === 'pending' ? 'badge-orange' : 
                               job.status === 'closed' ? 'badge-gray' : 'badge-yellow';
            const statusText = job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Draft';
            const employmentType = job.employmentType?.charAt(0).toUpperCase() + job.employmentType?.slice(1) || 'Full-time';
            const skills = job.requiredSkills?.slice(0, 3) || [];
            
            return `
                <div class="bg-white border border-gray-200 rounded-card p-6 hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-briefcase text-blue-600 text-xl"></i>
                        </div>
                        <span class="badge ${statusBadge}">${statusText}</span>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-900 mb-3">${job.title}</h3>
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-building text-teal-600"></i>
                            <span>${job.department || ''}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-map-marker-alt text-teal-600"></i>
                            <span>${job.location || 'N/A'}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-clock text-teal-600"></i>
                            <span>${employmentType}</span>
                        </div>
                    </div>
                    ${skills.length > 0 ? `
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${skills.map(skill => `<span class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">${skill}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-600"><strong>${applicantCount}</strong> applicant${applicantCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="editJob('${job._id}')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded" title="Edit">
                                <i class="fas fa-pen text-sm"></i>
                            </button>
                            <button onclick="deleteJob('${job._id}')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 rounded" title="Delete">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function updateJobStats(jobs) {
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalJobs = jobs.length;
    const totalApplicants = jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
    
    // Update stats if elements exist
    const statsElements = document.querySelectorAll('.stat-value');
    if (statsElements.length >= 3) {
        statsElements[0].textContent = activeJobs;
        statsElements[1].textContent = totalJobs;
        statsElements[2].textContent = totalApplicants;
    }
}

function editJob(jobId) {
    // TODO: Implement edit functionality
    console.log('Edit job:', jobId);
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job posting?')) {
        return;
    }
    
    try {
        await window.API.jobs.delete(jobId);
        loadJobs(); // Reload the list
    } catch (error) {
        alert('Error deleting job: ' + error.message);
    }
}

// Handle job form submission
async function handleJobSubmit(e) {
    e.preventDefault();
    const form = e.target.closest('form') || document.querySelector('#jobModal form');
    if (!form) return;
    
    // Get skills from skill tags
    const skillTags = document.querySelectorAll('#skillsInput .skill-tag');
    const skills = Array.from(skillTags).map(tag => {
        const text = tag.textContent.trim();
        return text.replace('×', '').trim();
    }).filter(skill => skill.length > 0);
    
    // Get form values
    const titleInput = form.querySelector('input[placeholder*="Job Title"], input[placeholder*="e.g., Senior"]');
    const departmentSelect = form.querySelector('select');
    const employmentSelect = Array.from(form.querySelectorAll('select')).find(s => s.options[0]?.textContent.includes('Full-time'));
    const locationSelect = Array.from(form.querySelectorAll('select')).find(s => s.options[0]?.textContent.includes('Quezon City'));
    const salaryInput = form.querySelector('input[placeholder*="Salary"], input[placeholder*="₱"]');
    const descriptionTextarea = form.querySelector('textarea[placeholder*="Describe"], textarea[placeholder*="Job Description"]');
    const experienceSelect = Array.from(form.querySelectorAll('select')).find(s => s.options[0]?.textContent.includes('Entry Level'));
    const deadlineInput = form.querySelector('input[type="date"]');
    const benefitsTextarea = form.querySelector('textarea[placeholder*="Benefits"], textarea[placeholder*="List the benefits"]');
    
    const jobData = {
        title: titleInput?.value || '',
        department: departmentSelect?.value || '',
        employmentType: employmentSelect?.value || 'fulltime',
        location: locationSelect?.value || '',
        salaryRange: salaryInput?.value || '',
        description: descriptionTextarea?.value || '',
        requiredSkills: skills,
        experienceLevel: experienceSelect?.value || 'mid',
        applicationDeadline: deadlineInput?.value || '',
        benefits: benefitsTextarea?.value || '',
        status: 'draft'
    };
    
    // Validate required fields
    if (!jobData.title || !jobData.department || !jobData.location) {
        alert('Please fill in all required fields (Title, Department, Location)');
        return;
    }
    
    try {
        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button:not([type="button"])');
        const originalText = submitBtn?.innerHTML || 'Create Job';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        }
        
        await window.API.jobs.create(jobData);
        
        // Close modal and reload jobs
        closeModal();
        form.reset();
        // Clear skill tags
        document.querySelectorAll('#skillsInput .skill-tag').forEach(tag => {
            if (!tag.querySelector('input')) tag.remove();
        });
        loadJobs();
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        alert('Error creating job: ' + (error.message || 'Unknown error'));
        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button:not([type="button"])');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }
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
    
    // Load jobs when page loads
    if (window.API && window.API.jobs) {
        loadJobs();
    }
    
    // Handle job form submission
    const jobForm = document.querySelector('#jobModal form');
    const postJobBtn = document.querySelector('#jobModal button.bg-teal-600');
    
    if (jobForm) {
        jobForm.addEventListener('submit', handleJobSubmit);
    }
    
    if (postJobBtn) {
        postJobBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (jobForm) {
                handleJobSubmit(e);
            }
        });
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

