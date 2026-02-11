// 🔐 LA MUBI - Admin Login System
// Autenticación con base de datos para panel tickets

class AdminLogin {
    constructor() {
        // Usar el cliente de Supabase desde LAMUBI_UTILS
        this.supabase = window.LAMUBI_UTILS.supabase;
        this.form = document.getElementById('loginForm');
        this.loginBtn = document.getElementById('loginBtn');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        
        this.init();
    }

    init() {
        // Verificar autenticación
        this.checkExistingSession();
        
        // Solo configurar event listeners si estamos en la página de login
        if (this.form) {
            // Event listeners
            this.form.addEventListener('submit', (e) => this.handleLogin(e));
            
            // Validación en tiempo real
            this.emailInput.addEventListener('blur', () => this.validateEmail());
            this.passwordInput.addEventListener('input', () => this.clearMessages());
        }
        
        window.LAMUBI_UTILS.debugLog('Admin Login initialized');
    }

    // 🔐 Verificar sesión existente
    async checkExistingSession() {
        const currentUser = localStorage.getItem('lamubi_admin_user');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                window.LAMUBI_UTILS.debugLog('Existing session found', user);
                
                // Verificar que el usuario todavía exista y esté activo
                const { data, error } = await this.supabase
                    .from('administradores')
                    .select('*')
                    .eq('id', user.id)
                    .eq('activo', true)
                    .single();
                
                if (data && !error) {
                    // Solo redirigir si estamos en la página de login
                    if (window.location.pathname.endsWith('login.html')) {
                        window.LAMUBI_UTILS.debugLog('Redirecting to dashboard', { 
                            role: data.rol, 
                            url: 'index.html' 
                        });
                        window.location.href = 'index.html';
                        return; // 🚨 IMPORTANTE: Detener ejecución aquí
                    } else {
                        // Ya estamos en el dashboard, no redirigir
                        window.LAMUBI_UTILS.debugLog('Already in dashboard, no redirect needed');
                        return;
                    }
                } else {
                    // Limpiar sesión inválida
                    localStorage.removeItem('lamubi_admin_user');
                    window.LAMUBI_UTILS.debugLog('Invalid session cleared');
                }
            } catch (error) {
                localStorage.removeItem('lamubi_admin_user');
            }
        }
    }

    // 🔐 Manejar login
    async handleLogin(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        
        if (!this.validateForm(email, password)) {
            return;
        }
        
        this.setLoading(true);
        this.clearMessages();
        
        try {
            window.LAMUBI_UTILS.debugLog('Attempting login', { email });
            
            // Buscar administrador en base de datos
            const { data, error } = await this.supabase
                .from('administradores')
                .select('*')
                .eq('correo', email)
                .eq('password', password) // En producción, usar hash
                .eq('activo', true)
                .single();
            
            if (error) {
                throw new Error('Credenciales incorrectas');
            }
            
            if (!data) {
                throw new Error('Usuario no encontrado o inactivo');
            }
            
            // Actualizar último acceso
            await this.updateLastAccess(data.id);
            
            // Guardar sesión
            this.saveSession(data);
            
            // Mostrar éxito
            this.showSuccess(`¡Bienvenido ${data.nombre}!`);
            
            // Redirigir
            setTimeout(() => {
                this.redirectToDashboard(data);
            }, 1500);
            
        } catch (error) {
            window.LAMUBI_UTILS.debugLog('Login error', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    // ✅ Validar formulario
    validateForm(email, password) {
        if (!email) {
            this.showError('El correo es requerido');
            return false;
        }
        
        if (!window.LAMUBI_UTILS.validateEmail(email)) {
            this.showError('Correo inválido');
            return false;
        }
        
        if (!password) {
            this.showError('La contraseña es requerida');
            return false;
        }
        
        if (password.length < 6) {
            this.showError('La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        
        return true;
    }

    // 📧 Validar email
    validateEmail() {
        const email = this.emailInput.value.trim();
        if (email && !window.LAMUBI_UTILS.validateEmail(email)) {
            this.showError('Correo inválido');
            return false;
        }
        this.clearMessages();
        return true;
    }

    // 🔄 Actualizar último acceso
    async updateLastAccess(adminId) {
        try {
            await this.supabase
                .from('administradores')
                .update({ 
                    ultimo_acceso: window.LAMUBI_UTILS.venezuelaNowString(),
                    metadata: {
                        last_login_ip: await this.getUserIP(),
                        last_login_browser: navigator.userAgent
                    }
                })
                .eq('id', adminId);
        } catch (error) {
            window.LAMUBI_UTILS.debugLog('Error updating last access', error);
        }
    }

    // 💾 Guardar sesión
    saveSession(admin) {
        const sessionData = {
            id: admin.id,
            nombre: admin.nombre,
            correo: admin.correo,
            rol: admin.rol,
            permisos: admin.permisos,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('lamubi_admin_user', JSON.stringify(sessionData));
        window.LAMUBI_UTILS.debugLog('Session saved', sessionData);
    }

    // 🔄 Redirigir al dashboard
    redirectToDashboard(admin) {
        // Redirigir según rol
        let redirectUrl = 'index.html';
        
        if (admin.rol === 'marketing_admin') {
            // Si es marketing admin, podría ir a su panel específico
            redirectUrl = '../marketing-admin/index.html';
        }
        
        window.LAMUBI_UTILS.debugLog('Redirecting to dashboard', { 
            role: admin.rol, 
            url: redirectUrl 
        });
        
        window.location.href = redirectUrl;
    }

    // 🎭 UI States
    setLoading(isLoading) {
        this.loginBtn.disabled = isLoading;
        this.loading.classList.toggle('active', isLoading);
        
        if (isLoading) {
            document.getElementById('btnText').textContent = 'Verificando...';
        } else {
            document.getElementById('btnText').textContent = 'Iniciar Sesión';
        }
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        this.errorMessage.classList.add('active');
        this.successMessage.classList.remove('active');
    }

    showSuccess(message) {
        document.getElementById('successText').textContent = message;
        this.successMessage.classList.add('active');
        this.errorMessage.classList.remove('active');
    }

    clearMessages() {
        this.errorMessage.classList.remove('active');
        this.successMessage.classList.remove('active');
    }

    // 🌐 Obtener IP del usuario
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // 🔒 Logout (para uso global)
    static logout() {
        localStorage.removeItem('lamubi_admin_user');
        window.location.href = 'login.html';
    }

    // 👤 Obtener usuario actual (para uso global)
    static getCurrentUser() {
        const userData = localStorage.getItem('lamubi_admin_user');
        return userData ? JSON.parse(userData) : null;
    }

    // 🔐 Verificar permisos (para uso global)
    static hasPermission(permission) {
        const user = AdminLogin.getCurrentUser();
        if (!user) return false;
        
        // Super admin tiene todos los permisos
        if (user.rol === 'super_admin') return true;
        
        // Verificar permisos específicos
        return user.permisos && user.permisos[permission] === true;
    }
}

// 🎯 Inicializar cuando el DOM esté listo
function initializeAdminLogin() {
    // Verificar que LAMUBI_UTILS esté disponible
    if (typeof window.LAMUBI_UTILS === 'undefined') {
        console.error('❌ LAMUBI_UTILS no está disponible. No se puede inicializar AdminLogin.');
        return;
    }
    
    // Verificar que supabase esté disponible
    if (typeof window.LAMUBI_UTILS === 'undefined' || typeof window.LAMUBI_UTILS.supabase === 'undefined') {
        console.error('❌ Supabase no está disponible. No se puede inicializar AdminLogin.');
        return;
    }
    
    window.adminLogin = new AdminLogin();
    
    // Hacer métodos disponibles globalmente
    window.AdminLogin = AdminLogin;
    
    window.LAMUBI_UTILS.debugLog('Admin Login system loaded');
}

// Inicializar de forma segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminLogin);
} else {
    initializeAdminLogin();
}

// 🚀 Exportar para uso en otras páginas
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminLogin;
}
