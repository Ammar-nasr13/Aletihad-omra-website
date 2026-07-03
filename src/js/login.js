document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const errorMsg = document.getElementById('errorMsg');
    const loginBtn = document.getElementById('loginBtn');

    // Redirect to admin.html if already logged in with a valid session
    const session = localStorage.getItem('admin_session');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            if (sessionData.loggedIn && (Date.now() - sessionData.timestamp < 2 * 60 * 60 * 1000)) {
                window.location.replace('admin');
                return;
            }
        } catch (e) {
            localStorage.removeItem('admin_session');
        }
    }

    // Toggle Password Visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // Toggle eye icon class
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
            
            // Toggle title
            togglePassword.setAttribute('title', isPassword ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور');
        });
    }

    // Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // Simple validation
            if (!username || !password) {
                showError('يرجى ملء جميع الحقول المطلوبة.');
                return;
            }

            // Set loading state
            setLoading(true);
            hideError();

            try {
                // Call DB service (checks Appwrite, falls back to local storage)
                const result = await DB.loginAdmin(username, password);

                if (result.success) {
                    // Set session data with active timestamp
                    localStorage.setItem('admin_session', JSON.stringify({
                        loggedIn: true,
                        username: username,
                        timestamp: Date.now()
                    }));
                    
                    // Redirect to dashboard
                    window.location.replace('admin');
                } else {
                    showError(result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
                    setLoading(false);
                }
            } catch (err) {
                console.error('Login error:', err);
                showError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
                setLoading(false);
            }
        });
    }

    function setLoading(isLoading) {
        if (!loginBtn) return;
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري التحقق...</span>';
            usernameInput.disabled = true;
            passwordInput.disabled = true;
        } else {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>تسجيل الدخول</span>';
            usernameInput.disabled = false;
            passwordInput.disabled = false;
        }
    }

    function showError(message) {
        if (!errorMsg) return;
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }

    function hideError() {
        if (!errorMsg) return;
        errorMsg.style.display = 'none';
    }
});
