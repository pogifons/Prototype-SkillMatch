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

// Track whether we're creating a new job or editing an existing one (global scope)
let currentJobId = null;

// Wait for DOM to be ready before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
    const postJobBtn = document.getElementById('postJobBtn');
    const jobModal = document.getElementById('jobModal');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const skillsInput = document.getElementById('skillsInput');
    const skillInput = skillsInput ? skillsInput.querySelector('input') : null;
    const aiSuggestions = document.getElementById('aiSuggestions');
    const jobForm = document.querySelector('#jobModal form');
    const jobModalTitle = document.querySelector('#jobModal h2');

    if (!postJobBtn || !jobModal) {
        console.error('Required elements not found in DOM');
        return;
    }

    // Get the submit buttons
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const postJobSubmitBtn = document.getElementById('postJobSubmitBtn');

    function openJobModalForCreate() {
        currentJobId = null;
        if (jobForm) {
            jobForm.reset();
        }
        // Clear existing skill tags (except the input)
        document.querySelectorAll('#skillsInput .skill-tag').forEach(tag => {
            if (!tag.querySelector('input')) tag.remove();
        });
        if (jobModalTitle) {
            jobModalTitle.textContent = 'Create New Job Posting';
        }
        jobModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    postJobBtn.addEventListener('click', openJobModalForCreate);

    function closeModal() {
        jobModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    jobModal.addEventListener('click', (e) => {
        if (e.target === jobModal) closeModal();
    });

    if (skillInput) {
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
    }

    document.querySelectorAll('.skill-tag button').forEach(btn => {
        btn.addEventListener('click', () => btn.parentElement.remove());
    });

    if (aiSuggestions) {
        aiSuggestions.querySelectorAll('span').forEach(tag => {
            tag.addEventListener('click', () => {
                const skillTag = document.createElement('span');
                skillTag.className = 'skill-tag';
                skillTag.innerHTML = `${tag.textContent} <button type="button">&times;</button>`;
                if (skillsInput) {
                    skillsInput.insertBefore(skillTag, skillInput || skillsInput.lastChild);
                }
                tag.remove();
                skillTag.querySelector('button').addEventListener('click', () => skillTag.remove());
            });
        });
    }

    // Handle Save as Draft button
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Save as Draft clicked');
            const formData = new FormData(jobForm);
            const skills = Array.from(document.querySelectorAll('#skillsInput .skill-tag')).map(tag => tag.textContent.trim().replace('×', '').trim());
            const data = Object.fromEntries(formData);
            data.requiredSkills = skills;
            data.status = 'draft';
            console.log('Draft data:', data);
            closeModal();
        });
    }

    // Handle Post Job button
    if (postJobSubmitBtn) {
        postJobSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Post Job clicked');
            if (jobForm) {
                jobForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Handle job form submission
    if (jobForm) {
        jobForm.addEventListener('submit', handleJobSubmit);
    }
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
    
    // Handle null/undefined jobs (demo mode)
    if (!jobs || jobs.length === 0) {
        console.log('No jobs from API - showing placeholders');
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
        const jobsHTML = jobs.map(job => {
            const applicantCount = job.applications?.length || 0;
            const statusBadge = job.status === 'active' ? 'badge-green' : 
                               job.status === 'pending' ? 'badge-orange' : 
                               job.status === 'closed' ? 'badge-gray' : 'badge-yellow';
            const statusText = job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Draft';
            const employmentType = job.employmentType?.charAt(0).toUpperCase() + job.employmentType?.slice(1) || 'Full-time';
            const skills = job.requiredSkills?.slice(0, 3) || [];
            
            return `
                <div class="bg-white border border-gray-200 rounded-card p-6 hover:shadow-lg transition-shadow cursor-pointer job-card" data-job-id="${job._id}">
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
                    </div>
                </div>
            `;
        }).join('');
        gridContainer.innerHTML = jobsHTML;
        
        // Attach click handlers after rendering
        attachJobCardClickHandlers();
    }
}

function updateJobStats(jobs) {
    // Handle null/undefined jobs (demo mode)
    if (!jobs || !Array.isArray(jobs)) {
        console.log('No jobs data to update stats');
        return;
    }
    
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

async function editJob(jobId) {
    try {
        if (!window.API || !window.API.jobs) {
            console.error('API not available');
            return;
        }

        const job = await window.API.jobs.getById(jobId);
        currentJobId = jobId;

        if (jobModalTitle) {
            jobModalTitle.textContent = 'Edit Job Posting';
        }

        if (jobForm) {
            // Map existing fields
            const titleInput = jobForm.querySelector('input[placeholder*="Job Title"], input[placeholder*="e.g., Senior"]');
            const selects = Array.from(jobForm.querySelectorAll('select'));
            const departmentSelect = selects[0];
            const employmentSelect = selects[1];
            const locationSelect = selects[2];
            const experienceSelect = selects[4] || selects[3];
            const salaryInput = jobForm.querySelector('input[placeholder*="Salary"], input[placeholder*="₱"]');
            const descriptionTextarea = jobForm.querySelector('textarea[placeholder*="Describe"], textarea[placeholder*="Job Description"]');
            const deadlineInput = jobForm.querySelector('input[type="date"]');
            const benefitsTextarea = jobForm.querySelector('textarea[placeholder*="Benefits"], textarea[placeholder*="List the benefits"]');

            if (titleInput) titleInput.value = job.title || '';
            if (departmentSelect) departmentSelect.value = job.department || '';
            if (employmentSelect) employmentSelect.value = job.employmentType || 'fulltime';
            if (locationSelect) locationSelect.value = job.location || '';
            if (salaryInput) salaryInput.value = job.salaryRange || '';
            if (descriptionTextarea) descriptionTextarea.value = job.description || '';
            if (experienceSelect) experienceSelect.value = job.experienceLevel || '';
            if (deadlineInput && job.applicationDeadline) {
                const d = new Date(job.applicationDeadline);
                // format as yyyy-mm-dd
                const iso = d.toISOString().split('T')[0];
                deadlineInput.value = iso;
            }
            if (benefitsTextarea) benefitsTextarea.value = job.benefits || '';

            // Clear and repopulate skills
            document.querySelectorAll('#skillsInput .skill-tag').forEach(tag => {
                if (!tag.querySelector('input')) tag.remove();
            });
            (job.requiredSkills || []).forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'skill-tag';
                tag.innerHTML = `${skill} <button type="button">&times;</button>`;
                skillsInput.insertBefore(tag, skillInput);
                tag.querySelector('button').addEventListener('click', () => tag.remove());
            });
        }

        jobModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading job for edit:', error);
        alert('Error loading job for edit: ' + (error.message || 'Unknown error'));
    }
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
        status: currentJobId ? (jobData.status || 'active') : 'draft'
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
        
        if (currentJobId) {
            await window.API.jobs.update(currentJobId, jobData);
        } else {
            await window.API.jobs.create(jobData);
        }
        
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

// Job Details Modal Functions
const jobDetailsModal = document.getElementById('jobDetailsModal');
const jobDetailsClose = document.getElementById('jobDetailsClose');
const jobDetailsCloseBtn = document.getElementById('jobDetailsCloseBtn');
const jobDetailsEditBtn = document.getElementById('jobDetailsEditBtn');
const jobDetailsPostBtn = document.getElementById('jobDetailsPostBtn');

function openJobDetailsModal(jobId) {
    // Fetch full job details
    window.API.jobs.getById(jobId)
        .then(job => {
            displayJobDetails(job);
            jobDetailsModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        })
        .catch(error => {
            console.error('Error fetching job details:', error);
            alert('Error loading job details: ' + error.message);
        });
}

function closeJobDetailsModal() {
    jobDetailsModal.classList.remove('open');
    document.body.style.overflow = '';
}

function displayJobDetails(job) {
    const content = document.getElementById('jobDetailsContent');
    const title = document.getElementById('jobDetailsTitle');
    
    if (!content || !title) return;
    
    title.textContent = job.title || 'Job Details';
    
    const statusBadge = job.status === 'active' ? 'badge-green' : 
                       job.status === 'pending' ? 'badge-orange' : 
                       job.status === 'closed' ? 'badge-gray' : 'badge-yellow';
    const statusText = job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || 'Draft';
    const employmentType = job.employmentType?.charAt(0).toUpperCase() + job.employmentType?.slice(1) || 'Full-time';
    const experienceLevel = job.experienceLevel?.charAt(0).toUpperCase() + job.experienceLevel?.slice(1) || 'Not specified';
    const applicantCount = job.applications?.length || 0;
    const createdDate = new Date(job.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const updatedDate = new Date(job.updatedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const deadlineDate = job.applicationDeadline ? 
        new Date(job.applicationDeadline).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : 'Not specified';
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Header Section -->
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <h3 class="font-serif text-2xl font-bold text-navy">${job.title || 'Untitled Job'}</h3>
                        <span class="badge ${statusBadge}">${statusText}</span>
                    </div>
                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-building text-teal-600"></i>
                            <span>${job.department || 'N/A'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-teal-600"></i>
                            <span>${job.location || 'N/A'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-clock text-teal-600"></i>
                            <span>${employmentType}</span>
                        </div>
                        ${job.salaryRange ? `
                            <div class="flex items-center gap-2">
                                <i class="fas fa-money-bill-wave text-teal-600"></i>
                                <span>${job.salaryRange}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Stats Section -->
            <div class="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div class="text-center">
                    <div class="text-2xl font-bold text-navy">${applicantCount}</div>
                    <div class="text-sm text-gray-600">Applicant${applicantCount !== 1 ? 's' : ''}</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-navy">${job.views || 0}</div>
                    <div class="text-sm text-gray-600">View${(job.views || 0) !== 1 ? 's' : ''}</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-navy">${experienceLevel}</div>
                    <div class="text-sm text-gray-600">Experience Level</div>
                </div>
            </div>
            
            <!-- Description Section -->
            <div>
                <h4 class="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fas fa-file-alt text-teal-600"></i>
                    Job Description
                </h4>
                <div class="prose max-w-none">
                    <p class="text-gray-700 whitespace-pre-wrap">${job.description || 'No description provided.'}</p>
                </div>
            </div>
            
            <!-- Required Skills Section -->
            ${job.requiredSkills && job.requiredSkills.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <i class="fas fa-tools text-teal-600"></i>
                        Required Skills
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${job.requiredSkills.map(skill => `
                            <span class="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg text-sm font-medium">
                                ${skill}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Benefits Section -->
            ${job.benefits ? `
                <div>
                    <h4 class="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
                        <i class="fas fa-gift text-teal-600"></i>
                        Benefits & Perks
                    </h4>
                    <div class="prose max-w-none">
                        <p class="text-gray-700 whitespace-pre-wrap">${job.benefits}</p>
                    </div>
                </div>
            ` : ''}
            
            <!-- Additional Information -->
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                    <h5 class="text-sm font-semibold text-gray-700 mb-1">Application Deadline</h5>
                    <p class="text-sm text-gray-600">${deadlineDate}</p>
                </div>
                <div>
                    <h5 class="text-sm font-semibold text-gray-700 mb-1">Experience Level</h5>
                    <p class="text-sm text-gray-600">${experienceLevel}</p>
                </div>
                <div>
                    <h5 class="text-sm font-semibold text-gray-700 mb-1">Posted On</h5>
                    <p class="text-sm text-gray-600">${createdDate}</p>
                </div>
                <div>
                    <h5 class="text-sm font-semibold text-gray-700 mb-1">Last Updated</h5>
                    <p class="text-sm text-gray-600">${updatedDate}</p>
                </div>
            </div>
        </div>
    `;
    
    // Set edit button handler
    jobDetailsEditBtn.onclick = () => {
        closeJobDetailsModal();
        editJob(job._id);
    };

    // Configure Post Draft button (only for draft jobs)
    if (jobDetailsPostBtn) {
        if (job.status === 'draft') {
            jobDetailsPostBtn.classList.remove('hidden');
            jobDetailsPostBtn.onclick = async () => {
                if (!window.API || !window.API.jobs) return;
                try {
                    await window.API.jobs.update(job._id, { status: 'active' });
                    closeJobDetailsModal();
                    loadJobs();
                } catch (error) {
                    console.error('Error posting draft job:', error);
                    alert('Error posting draft job: ' + (error.message || 'Unknown error'));
                }
            };
        } else {
            jobDetailsPostBtn.classList.add('hidden');
            jobDetailsPostBtn.onclick = null;
        }
    }
    
    // Set delete button handler
    const jobDetailsDeleteBtn = document.getElementById('jobDetailsDeleteBtn');
    if (jobDetailsDeleteBtn) {
        jobDetailsDeleteBtn.onclick = async () => {
            if (confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
                try {
                    await deleteJob(job._id);
                    closeJobDetailsModal();
                } catch (error) {
                    alert('Error deleting job: ' + error.message);
                }
            }
        };
    }
}

// Event listeners for job details modal
if (jobDetailsClose) {
    jobDetailsClose.addEventListener('click', closeJobDetailsModal);
}
if (jobDetailsCloseBtn) {
    jobDetailsCloseBtn.addEventListener('click', closeJobDetailsModal);
}
if (jobDetailsModal) {
    jobDetailsModal.addEventListener('click', (e) => {
        if (e.target === jobDetailsModal) closeJobDetailsModal();
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && jobDetailsModal.classList.contains('open')) {
            closeJobDetailsModal();
        }
    });
}

// Add click handlers to job cards after rendering
function attachJobCardClickHandlers() {
    document.querySelectorAll('.job-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking on edit/delete buttons
            if (e.target.closest('button') || e.target.closest('.fa-pen') || e.target.closest('.fa-trash')) {
                return;
            }
            const jobId = card.getAttribute('data-job-id');
            if (jobId) {
                openJobDetailsModal(jobId);
            }
        });
    });
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

