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
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const forgotPasswordInfo = document.getElementById('forgotPasswordInfo');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('#loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Validate inputs
            if (!email || !password) {
                alert('Please enter both email and password');
                return;
            }

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

            try {
                const response = await window.API.auth.login(email, password);
                
                // If API returns null (not available yet), use demo mode
                if (!response) {
                    // Demo mode: accept any email/password combination
                    const demoEmployer = {
                        id: 'demo-user',
                        companyName: email.split('@')[0] || 'Your Company',
                        email: email,
                        isVerified: true
                    };
                    localStorage.setItem('employer', JSON.stringify(demoEmployer));
                    // Redirect to employer dashboard
                    window.location.href = '/employer.html';
                } else if (response && response.token) {
                    // Real API response - store token and employer info
                    if (response.employer) {
                        localStorage.setItem('employer', JSON.stringify(response.employer));
                    }
                    // Redirect to employer dashboard
                    window.location.href = '/employer.html';
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
                alert('Login failed: ' + errorMessage);
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

            // Validate inputs
            if (!companyName || !email || !password) {
                alert('Please fill in all required fields');
                return;
            }

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
                
                // If API returns null (not available yet), use demo mode
                if (!response) {
                    // Demo mode: accept registration and create account
                    const demoEmployer = {
                        id: 'demo-user-' + Date.now(),
                        companyName: companyName,
                        email: email,
                        isVerified: false
                    };
                    localStorage.setItem('employer', JSON.stringify(demoEmployer));
                    alert('Account created successfully! Your account is pending verification.');
                    // Redirect to employer dashboard
                    window.location.href = '/employer.html';
                } else if (response && response.token) {
                    // Real API response - store token and employer info
                    if (response.employer) {
                        localStorage.setItem('employer', JSON.stringify(response.employer));
                    }
                    
                    alert('Account created successfully! Your account is pending verification.');
                    // Redirect to employer dashboard
                    window.location.href = '/employer.html';
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
                alert('Registration failed: ' + errorMessage);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Forgot Password flow
    if (forgotPasswordLink && forgotPasswordModal && resetPasswordModal) {
        const cancelForgotPassword = document.getElementById('cancelForgotPassword');
        const cancelResetPassword = document.getElementById('cancelResetPassword');

        const openModal = (modal) => {
            modal.classList.remove('hidden');
        };

        const closeModal = (modal) => {
            modal.classList.add('hidden');
        };

        forgotPasswordLink.addEventListener('click', () => {
            openModal(forgotPasswordModal);
        });

        cancelForgotPassword.addEventListener('click', () => {
            closeModal(forgotPasswordModal);
        });

        cancelResetPassword.addEventListener('click', () => {
            closeModal(resetPasswordModal);
        });

        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const emailInput = document.getElementById('forgotEmail');
                const email = emailInput.value;

                try {
                    const response = await window.API.auth.requestPasswordReset(email);
                    // Show info and also surface the code for testing
                    if (response.resetCode) {
                        forgotPasswordInfo.classList.remove('hidden');
                        forgotPasswordInfo.textContent = `Reset code (for testing): ${response.resetCode}. It will expire in 15 minutes.`;
                    } else {
                        forgotPasswordInfo.classList.remove('hidden');
                        forgotPasswordInfo.textContent = response.message || 'If this email is registered, a reset code has been generated.';
                    }

                    alert('If this email is registered, a reset code has been generated.');
                    // Open reset modal so user can enter code
                    closeModal(forgotPasswordModal);
                    openModal(resetPasswordModal);
                    // Prefill email in reset form
                    const resetEmail = document.getElementById('resetEmail');
                    if (resetEmail) {
                        resetEmail.value = email;
                    }
                } catch (error) {
                    alert(error.message || 'Failed to generate reset code. Please try again.');
                }
            });
        }

        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('resetEmail').value;
                const code = document.getElementById('resetCode').value;
                const newPassword = document.getElementById('resetNewPassword').value;

                try {
                    const response = await window.API.auth.resetPassword(email, code, newPassword);
                    alert(response.message || 'Password reset successful. You can now log in with your new password.');
                    closeModal(resetPasswordModal);
                } catch (error) {
                    alert(error.message || 'Failed to reset password. Please check the code and try again.');
                }
            });
        }
    }

    // Check if user is already logged in
    if (localStorage.getItem('token')) {
        // User is logged in, redirect to dashboard
        window.location.href = '/employer.html';
    }
});

