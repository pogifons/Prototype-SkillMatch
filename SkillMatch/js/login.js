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

