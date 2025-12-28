function switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        loginTab.classList.remove('text-gray-600');
        registerTab.classList.remove('active');
        registerTab.classList.add('text-gray-600');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerTab.classList.add('active');
        registerTab.classList.remove('text-gray-600');
        loginTab.classList.remove('active');
        loginTab.classList.add('text-gray-600');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

function togglePassword(id) {
    const input = document.getElementById(id);
    const toggle = document.getElementById(id + 'Toggle');
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#loginForm form');
    const registerForm = document.querySelector('#registerForm form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('#loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

            try {
                const response = await window.API.auth.login(email, password);
                
                if (response.token) {
                    // Store employer info
                    localStorage.setItem('employer', JSON.stringify(response.employer));
                    
                    // Redirect to employer dashboard
                    window.location.href = '/employer.html';
                }
            } catch (error) {
                alert('Login failed: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const companyName = registerForm.querySelector('input[placeholder="Your company name"]').value;
            const industry = registerForm.querySelector('input[placeholder="e.g., Technology"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('#registerPassword').value;
            const address = registerForm.querySelector('input[placeholder="e.g., Quezon City, Metro Manila"]').value;
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

            try {
                const response = await window.API.auth.register({
                    companyName,
                    industry,
                    email,
                    password,
                    address
                });
                
                if (response.token) {
                    // Store employer info
                    localStorage.setItem('employer', JSON.stringify(response.employer));
                    
                    alert('Account created successfully! Your account is pending verification.');
                    // Redirect to employer dashboard
                    window.location.href = '/employer.html';
                }
            } catch (error) {
                alert('Registration failed: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Check if user is already logged in
    if (localStorage.getItem('token')) {
        // User is logged in, redirect to dashboard
        window.location.href = '/employer.html';
    }
});

