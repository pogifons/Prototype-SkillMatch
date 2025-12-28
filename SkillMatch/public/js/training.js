const newTrainingBtn = document.getElementById('newTrainingBtn');
const trainingModal = document.getElementById('trainingModal');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');

if (newTrainingBtn) {
    newTrainingBtn.addEventListener('click', () => {
        trainingModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    });
}

function closeModal() {
    trainingModal.classList.remove('open');
    document.body.style.overflow = '';
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
if (trainingModal) {
    trainingModal.addEventListener('click', (e) => {
        if (e.target === trainingModal) closeModal();
    });
}

// Load training programs from database
async function loadTrainingPrograms() {
    try {
        console.log('Loading training programs...');
        if (!window.API || !window.API.training) {
            console.error('API not available');
            return;
        }
        
        const trainings = await window.API.training.getAll();
        console.log('Training programs loaded:', trainings);
        renderTrainingPrograms(trainings);
        updateTrainingStats(trainings);
    } catch (error) {
        console.error('Error loading training programs:', error);
        const container = document.querySelector('.grid');
        if (container) {
            const errorMsg = error.message || 'Error loading training programs. Please try again.';
            container.innerHTML = `<div class="col-span-full text-center text-red-500 py-8">${errorMsg}</div>`;
        }
    }
}

function renderTrainingPrograms(trainings) {
    // Find the training programs grid container (2 columns)
    const container = document.querySelector('main .grid.grid-cols-1.md\\:grid-cols-2');
    if (!container) return;
    
    if (trainings.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No training programs yet. Click "Add Training" to create one.</div>';
        return;
    }
    
    // Color palette for headers based on category
    const getHeaderColor = (category) => {
        const categoryLower = (category || '').toLowerCase();
        if (categoryLower.includes('tesda')) return 'bg-teal-600';
        if (categoryLower.includes('owwa')) return 'bg-blue-600';
        if (categoryLower.includes('technology') || categoryLower.includes('tech')) return 'bg-purple-600';
        if (categoryLower.includes('design')) return 'bg-pink-600';
        return 'bg-teal-600'; // default
    };
    
    // Icon mapping for categories
    const getCategoryIcon = (category) => {
        const categoryLower = (category || '').toLowerCase();
        if (categoryLower.includes('tesda')) return 'fas fa-certificate';
        if (categoryLower.includes('owwa')) return 'fas fa-globe';
        if (categoryLower.includes('technology') || categoryLower.includes('tech')) return 'fas fa-code';
        if (categoryLower.includes('design')) return 'fas fa-palette';
        return 'fas fa-graduation-cap'; // default
    };
    
    container.innerHTML = trainings.map((training, index) => {
        const enrolleeCount = training.enrollees?.length || 0;
        const statusBadge = training.status === 'active' ? 'badge-green' :
                           training.status === 'completed' ? 'badge-blue' :
                           training.status === 'cancelled' ? 'badge-red' : 'badge-gray';
        const statusText = training.status?.charAt(0).toUpperCase() + training.status?.slice(1) || 'Draft';
        const startDate = new Date(training.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const endDate = new Date(training.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const headerColor = getHeaderColor(training.category);
        const categoryIcon = getCategoryIcon(training.category);
        
        // Generate enrollee avatars (first 2, then +count)
        const enrolleeAvatars = training.enrollees?.slice(0, 2).map((enrollee, idx) => {
            const initials = `${enrollee.firstName?.[0] || ''}${enrollee.lastName?.[0] || ''}`.toUpperCase();
            const avatarColors = ['bg-purple-600', 'bg-blue-600', 'bg-teal-600', 'bg-pink-600'];
            const color = avatarColors[idx % avatarColors.length];
            return `<div class="w-8 h-8 ${color} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold">${initials || '?'}</div>`;
        }).join('') || '';
        const remainingCount = enrolleeCount > 2 ? enrolleeCount - 2 : 0;
        
        return `
            <div class="bg-white border border-gray-200 rounded-card overflow-hidden hover:shadow-lg transition-shadow">
                <div class="${headerColor} p-4 text-white">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <i class="${categoryIcon} text-xl"></i>
                            <span class="text-sm font-semibold">${training.category || 'Training Program'}</span>
                        </div>
                        <span class="badge ${statusBadge}">${statusText}</span>
                    </div>
                    <h3 class="font-semibold text-lg">${training.title}</h3>
                </div>
                <div class="p-6">
                    <p class="text-sm text-gray-600 mb-4">${training.description || 'No description available.'}</p>
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-calendar text-teal-600"></i>
                            <span>${startDate} - ${endDate}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-clock text-teal-600"></i>
                            <span>${training.duration || 0} Hours</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-map-marker-alt text-teal-600"></i>
                            <span>${training.locationType || 'N/A'}${training.location ? ` - ${training.location}` : ''}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div class="flex items-center gap-2">
                            ${enrolleeCount > 0 ? `
                            <div class="flex -space-x-2">
                                ${enrolleeAvatars}
                                ${remainingCount > 0 ? `<div class="w-8 h-8 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold">+${remainingCount}</div>` : ''}
                            </div>
                            ` : ''}
                            <span class="text-sm text-gray-600"><strong>${enrolleeCount}</strong> enrolled</span>
                        </div>
                        <button class="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">View Details</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTrainingStats(trainings) {
    const activePrograms = trainings.filter(t => t.status === 'active').length;
    const totalEnrollees = trainings.reduce((sum, t) => sum + (t.enrollees?.length || 0), 0);
    const totalCertifications = trainings.reduce((sum, t) => sum + (t.certificationsIssued || 0), 0);
    
    // Update stats if elements exist
    const statsElements = document.querySelectorAll('.stat-value');
    if (statsElements.length >= 3) {
        statsElements[0].textContent = activePrograms;
        statsElements[1].textContent = totalEnrollees;
        statsElements[2].textContent = totalCertifications;
    }
}

function editTraining(trainingId) {
    // TODO: Implement edit functionality
    console.log('Edit training:', trainingId);
}

async function deleteTraining(trainingId) {
    if (!confirm('Are you sure you want to delete this training program?')) {
        return;
    }
    
    try {
        await window.API.training.delete(trainingId);
        loadTrainingPrograms(); // Reload the list
    } catch (error) {
        alert('Error deleting training program: ' + error.message);
    }
}

// Handle training form submission
async function handleTrainingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    const trainingData = {
        title: form.querySelector('input[placeholder*="Title"]')?.value || '',
        category: form.querySelector('select[name="category"]')?.value || '',
        description: form.querySelector('textarea')?.value || '',
        duration: parseInt(form.querySelector('input[type="number"]')?.value || '0'),
        startDate: form.querySelector('input[type="date"][name="startDate"]')?.value || '',
        endDate: form.querySelector('input[type="date"][name="endDate"]')?.value || '',
        locationType: form.querySelector('select[name="locationType"]')?.value || 'Online',
        location: form.querySelector('input[placeholder*="Location"]')?.value || '',
        provider: form.querySelector('input[placeholder*="Provider"]')?.value || '',
        status: 'active'
    };
    
    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        await window.API.training.create(trainingData);
        
        // Close modal and reload training programs
        closeModal();
        form.reset();
        loadTrainingPrograms();
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    } catch (error) {
        alert('Error creating training program: ' + error.message);
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
    }
}

// Handle logout button click
document.addEventListener('DOMContentLoaded', () => {
    // Load training programs when page loads
    if (window.API && window.API.training) {
        loadTrainingPrograms();
    }
    
    // Handle training form submission
    const trainingForm = document.querySelector('#trainingModal form');
    if (trainingForm) {
        trainingForm.addEventListener('submit', handleTrainingSubmit);
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

