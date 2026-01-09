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

