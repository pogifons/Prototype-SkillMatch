// Settings Page JavaScript

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'text-teal-600', 'border-teal-600');
                btn.classList.add('text-gray-500');
            });
            
            // Add active class to clicked button
            this.classList.add('active', 'text-teal-600', 'border-teal-600');
            this.classList.remove('text-gray-500');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show target tab content
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });
    
    // Load employer profile data & settings
    loadProfileData();
    loadTeamData();
    loadNotificationPreferences();
    
    // Setup form handlers
    setupFormHandlers();
});

// Load profile data from localStorage
function loadProfileData() {
    try {
        const employerStr = localStorage.getItem('employer');
        if (employerStr) {
            const employer = JSON.parse(employerStr);
            
            // Populate form fields
            if (employer.companyName) {
                document.getElementById('companyName').value = employer.companyName || '';
            }
            if (employer.email) {
                document.getElementById('email').value = employer.email || '';
            }
            if (employer.phone) {
                document.getElementById('phone').value = employer.phone || '';
            }
            if (employer.website) {
                document.getElementById('website').value = employer.website || '';
            }
            if (employer.address) {
                document.getElementById('address').value = employer.address || '';
            }
            if (employer.description) {
                document.getElementById('description').value = employer.description || '';
            }
        }
    } catch (e) {
        console.error('Error loading profile data:', e);
    }
}

// Setup form submission handlers
function setupFormHandlers() {
    // Profile form handler
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                companyName: document.getElementById('companyName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                website: document.getElementById('website').value,
                address: document.getElementById('address').value,
                description: document.getElementById('description').value
            };
            
            try {
                // Update profile via API
                const updatedEmployer = await window.API.employer.updateProfile(formData);
                
                // Update localStorage
                localStorage.setItem('employer', JSON.stringify(updatedEmployer));
                
                // Update the employer name and initials in sidebar
                const companyName = formData.companyName;
                const initials = companyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                
                const nameEl = document.getElementById('employerName');
                const initialsEl = document.getElementById('employerInitials');
                if (nameEl) nameEl.textContent = companyName;
                if (initialsEl) initialsEl.textContent = initials;
                
                // Show success message
                showNotification('Profile updated successfully!', 'success');
                
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('Failed to update profile: ' + (error.message || 'Please try again.'), 'error');
            }
        });
    }
    
    // Password form handler
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate passwords match
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match.', 'error');
                return;
            }
            
            // Validate password length
            if (newPassword.length < 8) {
                showNotification('Password must be at least 8 characters long.', 'error');
                return;
            }
            
            try {
                // Change password via API
                await window.API.employer.changePassword(currentPassword, newPassword);
                
                showNotification('Password updated successfully!', 'success');
                resetPasswordForm();
                
            } catch (error) {
                console.error('Error updating password:', error);
                showNotification('Failed to update password: ' + (error.message || 'Please try again.'), 'error');
            }
        });
    }

    // Team form handler
    const teamForm = document.getElementById('teamForm');
    if (teamForm) {
        teamForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('teamEmail').value.trim();
            const role = document.getElementById('teamRole').value || 'recruiter';

            if (!email) {
                showNotification('Please enter an email for the HR user.', 'error');
                return;
            }

            try {
                await window.API.employer.addTeamMember(email, role);
                document.getElementById('teamEmail').value = '';
                document.getElementById('teamRole').value = 'recruiter';
                await loadTeamData();
                showNotification('Team member added successfully.', 'success');
            } catch (error) {
                console.error('Error adding team member:', error);
                showNotification('Failed to add team member: ' + (error.message || 'Please try again.'), 'error');
            }
        });
    }

    // Notifications form handler
    const notificationsForm = document.getElementById('notificationsForm');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const preferences = {
                emailNotifications: document.getElementById('emailNotifications').checked,
                newApplicantAlert: document.getElementById('newApplicantAlert').checked,
                interviewReminders: document.getElementById('interviewReminders').checked,
                weeklyReports: document.getElementById('weeklyReports').checked
            };

            try {
                await window.API.employer.updateNotifications(preferences);
                showNotification('Notification preferences saved.', 'success');
            } catch (error) {
                console.error('Error updating notifications:', error);
                showNotification('Failed to save preferences: ' + (error.message || 'Please try again.'), 'error');
            }
        });
    }
}

// Load team members
async function loadTeamData() {
    if (!window.API || !window.API.employer || !window.API.employer.getTeam) return;

    const container = document.getElementById('teamList');
    if (!container) return;

    try {
        const res = await window.API.employer.getTeam();
        const team = res.teamMembers || [];

        if (team.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500">No HR users added yet.</p>';
            return;
        }

        container.innerHTML = team.map(member => {
            const roleLabel = member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Recruiter';
            return `
                <div class="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                        <div class="font-medium text-gray-900">${member.email}</div>
                        <div class="text-xs text-gray-500">Role: ${roleLabel}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <select data-team-role="${member.email}" class="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal-500">
                            <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="recruiter" ${member.role === 'recruiter' ? 'selected' : ''}>Recruiter</option>
                            <option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                        </select>
                        <button data-team-remove="${member.email}" class="px-2 py-1 border border-red-300 text-red-600 rounded text-xs hover:bg-red-50">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Wire role change
        container.querySelectorAll('select[data-team-role]').forEach(select => {
            select.addEventListener('change', async () => {
                const email = select.getAttribute('data-team-role');
                const role = select.value;
                try {
                    await window.API.employer.updateTeamMemberRole(email, role);
                    showNotification('Team member role updated.', 'success');
                } catch (error) {
                    console.error('Error updating role:', error);
                    showNotification('Failed to update role: ' + (error.message || 'Please try again.'), 'error');
                }
            });
        });

        // Wire remove
        container.querySelectorAll('button[data-team-remove]').forEach(button => {
            button.addEventListener('click', async () => {
                const email = button.getAttribute('data-team-remove');
                if (!confirm(`Remove ${email} from HR users?`)) return;
                try {
                    await window.API.employer.removeTeamMember(email);
                    await loadTeamData();
                    showNotification('Team member removed.', 'success');
                } catch (error) {
                    console.error('Error removing team member:', error);
                    showNotification('Failed to remove team member: ' + (error.message || 'Please try again.'), 'error');
                }
            });
        });
    } catch (error) {
        console.error('Error loading team data:', error);
    }
}

// Load notification preferences
async function loadNotificationPreferences() {
    if (!window.API || !window.API.employer || !window.API.employer.getNotifications) return;

    try {
        const res = await window.API.employer.getNotifications();
        const prefs = res.notificationPreferences || {};

        const emailNotifications = document.getElementById('emailNotifications');
        const newApplicantAlert = document.getElementById('newApplicantAlert');
        const interviewReminders = document.getElementById('interviewReminders');
        const weeklyReports = document.getElementById('weeklyReports');

        if (emailNotifications) emailNotifications.checked = prefs.emailNotifications ?? true;
        if (newApplicantAlert) newApplicantAlert.checked = prefs.newApplicantAlert ?? true;
        if (interviewReminders) interviewReminders.checked = prefs.interviewReminders ?? true;
        if (weeklyReports) weeklyReports.checked = prefs.weeklyReports ?? false;
    } catch (error) {
        console.error('Error loading notification preferences:', error);
    }
}

// Reset profile form
function resetForm() {
    loadProfileData();
}

// Reset password form
function resetPasswordForm() {
    document.getElementById('passwordForm').reset();
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'
    }`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

