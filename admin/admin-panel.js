// 🎯 LA MUBI - Admin Panel System
// Panel de administración para gestión de tickets

class AdminPanel {
    constructor() {
        // Usar el cliente de Supabase desde LAMUBI_UTILS
        this.supabase = window.LAMUBI_UTILS.supabase;
        this.currentUser = null;
        this.currentSection = 'dashboard';
        
        this.init();
    }

    init() {
        // Verificar autenticación
        this.checkAuthentication();
        
        // Configurar navegación
        this.setupNavigation();
        
        // Cargar datos iniciales
        this.loadInitialData();
        
        window.LAMUBI_UTILS.debugLog('Admin Panel initialized');
    }

    // 🔐 Verificar autenticación
    checkAuthentication() {
        this.currentUser = AdminLogin.getCurrentUser();
        
        if (!this.currentUser) {
            window.LAMUBI_UTILS.debugLog('No authenticated user, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        // Actualizar UI con datos del usuario
        this.updateUserUI();
        
        // Verificar permisos
        this.checkPermissions();
    }

    // 👤 Actualizar UI del usuario
    updateUserUI() {
        document.getElementById('userName').textContent = this.currentUser.nombre;
        document.getElementById('userRole').textContent = this.formatRole(this.currentUser.rol);
    }

    // 🔐 Verificar permisos
    checkPermissions() {
        // Verificar permisos específicos para cada sección
        const sections = document.querySelectorAll('.nav-link');
        sections.forEach(link => {
            const section = link.dataset.section;
            if (!this.hasAccessToSection(section)) {
                link.style.display = 'none';
            }
        });
    }

    // 🔍 Verificar acceso a sección
    hasAccessToSection(section) {
        // Super admin tiene acceso a todo
        if (this.currentUser.rol === 'super_admin') return true;
        
        // Tickets admin tiene acceso limitado
        if (this.currentUser.rol === 'tickets_admin') {
            const allowedSections = ['dashboard', 'verification', 'tickets', 'config'];
            return allowedSections.includes(section);
        }
        
        return false;
    }

    // 📋 Formatear rol
    formatRole(role) {
        const roles = {
            'super_admin': 'Super Admin',
            'tickets_admin': 'Admin Tickets',
            'marketing_admin': 'Admin Marketing'
        };
        return roles[role] || role;
    }

    // 🧭 Configurar navegación
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });
    }

    // 📱 Mostrar sección
    showSection(sectionName) {
        // Ocultar todas las secciones
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar sección seleccionada
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Actualizar navegación
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionName) {
                link.classList.add('active');
            }
        });
        
        this.currentSection = sectionName;
        
        // Cargar datos específicos de la sección
        this.loadSectionData(sectionName);
    }

    // 📊 Cargar datos iniciales
    async loadInitialData() {
        await this.loadDashboardData();
    }

    // 📊 Cargar datos de sección específica
    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'verification':
                await this.loadPendingPurchases();
                break;
            case 'tickets':
                await this.loadAllTickets();
                break;
            case 'config':
                await this.loadConfigData();
                break;
        }
    }

    // 📊 Cargar datos del dashboard
    async loadDashboardData() {
        try {
            window.LAMUBI_UTILS.debugLog('Loading dashboard data');
            
            // Verificar conexión a Supabase primero
            if (!this.supabase) {
                throw new Error('Supabase client not initialized');
            }
            
            // Cargar estadísticas en paralelo
            const [
                usersResult,
                purchasesResult,
                pendingResult,
                tasaResult
            ] = await Promise.all([
                this.getUsersWithTickets(),
                this.getTotalPurchases(),
                this.getPendingPurchases(),
                this.getCurrentDollarRate()
            ]);
            
            // Actualizar estadísticas
            document.getElementById('totalUsers').textContent = usersResult.total;
            document.getElementById('totalPurchases').textContent = purchasesResult.total;
            document.getElementById('pendingVerification').textContent = pendingResult.total;
            document.getElementById('dollarRate').textContent = tasaResult.formatted;
            
            // Cargar actividad reciente
            await this.loadRecentActivity();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            
            // Manejar específicamente errores de red
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showError('Error de conexión con Supabase. Verifica tu conexión a internet y las credenciales.');
            } else {
                this.showError(`Error cargando datos del dashboard: ${error.message}`);
            }
        }
    }

    // 👥 Obtener usuarios con tickets
    async getUsersWithTickets() {
        const { data, error } = await this.supabase
            .from('verificaciones_pagos')
            .select('*')
            .in('estado', ['aprobado', 'usado']);
        
        if (error) throw error;
        
        return {
            total: data.length,
            users: data
        };
    }

    // 🛒 Obtener total de compras
    async getTotalPurchases() {
        const { data, error } = await this.supabase
            .from('verificaciones_pagos')
            .select('*');
        
        if (error) throw error;
        
        return {
            total: data.length,
            purchases: data
        };
    }

    // ⏳ Obtener compras pendientes
    async getPendingPurchases() {
        const { data, error } = await this.supabase
            .from('verificaciones_pagos')
            .select('*')
            .eq('estado', 'pendiente');
        
        if (error) throw error;
        
        return {
            total: data.length,
            purchases: data
        };
    }

    // 💰 Obtener tasa del dólar actual
    async getCurrentDollarRate() {
        const { data, error } = await this.supabase
            .from('configuracion_sistema')
            .select('valor')
            .eq('clave', 'tasa_dolar_bcv')
            .eq('activo', true)
            .single();
        
        if (error) {
            return {
                value: '1.234,56',
                formatted: 'Bs. 1.234,56'
            };
        }
        
        const rate = data.valor;
        return {
            value: rate,
            formatted: `Bs. ${rate}`
        };
    }

    // 📈 Cargar actividad reciente
    async loadRecentActivity() {
        try {
            const { data, error } = await this.supabase
                .from('verificaciones_pagos')
                .select('*')
                .order('fecha_pago', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            this.renderRecentActivity(data);
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
            document.getElementById('recentActivity').innerHTML = 
                '<p>Error cargando actividad reciente</p>';
        }
    }

    // 📈 Renderizar actividad reciente
    renderRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        
        if (activities.length === 0) {
            container.innerHTML = '<p>No hay actividad reciente</p>';
            return;
        }
        
        const html = activities.map(activity => `
            <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${activity.email_temporal || 'Usuario no registrado'}</strong>
                        <span style="color: var(--gray); margin-left: 0.5rem;">
                            ${activity.metodo_pago}
                        </span>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: ${this.getStatusColor(activity.estado)};">
                            ${this.formatStatus(activity.estado)}
                        </span>
                        <div style="font-size: 0.8rem; color: var(--gray);">
                            ${window.LAMUBI_UTILS.formatDateVenezuela(activity.fecha_pago)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    // � Filtrar compras pendientes
    filterPendingPurchases(searchTerm = null) {
        const searchValue = searchTerm || document.getElementById('searchPending').value.toLowerCase();
        const methodFilter = document.getElementById('filterPendingMethod').value;
        
        if (!this.allPendingPurchases) return;
        
        const filtered = this.allPendingPurchases.filter(purchase => {
            const matchesSearch = !searchValue || 
                (purchase.email_temporal && purchase.email_temporal.toLowerCase().includes(searchValue)) ||
                purchase.id.toString().includes(searchValue);
            const matchesMethod = !methodFilter || purchase.metodo_pago === methodFilter;
            
            return matchesSearch && matchesMethod;
        });
        
        this.renderPendingPurchases(filtered);
    }

    // 🔍 Filtrar todos los tickets
    filterAllTickets(searchTerm = null) {
        const searchValue = searchTerm || document.getElementById('searchTickets').value.toLowerCase();
        const stateFilter = document.getElementById('filterTicketsState').value;
        const methodFilter = document.getElementById('filterTicketsMethod').value;
        
        if (!this.allTickets) return;
        
        const filtered = this.allTickets.filter(ticket => {
            const matchesSearch = !searchValue || 
                (ticket.email_temporal && ticket.email_temporal.toLowerCase().includes(searchValue)) ||
                ticket.id.toString().includes(searchValue);
            const matchesState = !stateFilter || ticket.estado === stateFilter;
            const matchesMethod = !methodFilter || ticket.metodo_pago === methodFilter;
            
            return matchesSearch && matchesState && matchesMethod;
        });
        
        this.renderAllTickets(filtered);
    }
    async loadPendingPurchases() {
        try {
            const { data, error } = await this.supabase
                .from('verificaciones_pagos')
                .select('*')
                .eq('estado', 'pendiente')
                .order('fecha_pago', { ascending: false });
            
            if (error) throw error;
            
            this.allPendingPurchases = data;
            this.renderPendingPurchases(data);
            
        } catch (error) {
            console.error('Error loading pending purchases:', error);
            document.getElementById('pendingPurchases').innerHTML = 
                '<p>Error cargando pagos pendientes</p>';
        }
    }

    // ✅ Renderizar compras pendientes
    renderPendingPurchases(purchases) {
        const container = document.getElementById('pendingPurchases');
        
        if (purchases.length === 0) {
            container.innerHTML = '<p>No hay compras pendientes de verificación</p>';
            return;
        }
        
        const html = purchases.map(purchase => `
            <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${purchase.email_temporal || 'Usuario no registrado'}</strong>
                        <div style="color: var(--gray); font-size: 0.9rem;">
                            ${purchase.metodo_pago}
                        </div>
                        <div style="color: var(--gray); font-size: 0.8rem;">
                            ${window.LAMUBI_UTILS.formatDateVenezuela(purchase.fecha_pago)}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; margin-bottom: 0.5rem;">
                            $${purchase.monto ? purchase.monto.toFixed(2) : '0.00'}
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;" 
                                    title="Ver comprobante de pago"
                                    onclick="viewComprobante('${purchase.comprobante_url}')">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                            <button class="btn" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; background: var(--success);" 
                                    title="Aprobar este pago"
                                    onclick="approvePurchase(${purchase.id})">
                                <i class="fas fa-check"></i> Aprobar
                            </button>
                            <button class="btn" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; background: var(--danger);" 
                                    title="Rechazar este pago"
                                    onclick="rejectPurchase(${purchase.id})">
                                <i class="fas fa-times"></i> Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    // 🎫 Cargar todos los tickets
    async loadAllTickets() {
        try {
            const { data, error } = await this.supabase
                .from('verificaciones_pagos')
                .select('*')
                .order('fecha_pago', { ascending: false });
            
            if (error) throw error;
            
            this.allTickets = data;
            this.renderAllTickets(data);
            
        } catch (error) {
            console.error('Error loading all tickets:', error);
            document.getElementById('allTickets').innerHTML = 
                '<p>Error cargando tickets</p>';
        }
    }

    // 🎫 Renderizar todos los tickets
    renderAllTickets(tickets) {
        const container = document.getElementById('allTickets');
        
        if (tickets.length === 0) {
            container.innerHTML = '<p>No hay tickets registrados</p>';
            return;
        }
        
        const html = tickets.map(ticket => `
            <div style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${ticket.email_temporal || 'Usuario no registrado'}</strong>
                        <div style="color: var(--gray); font-size: 0.9rem;">
                            ${ticket.metodo_pago} • ${ticket.estado}
                        </div>
                        <div style="color: var(--gray); font-size: 0.8rem;">
                            ${window.LAMUBI_UTILS.formatDateVenezuela(ticket.fecha_pago)}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; margin-bottom: 0.5rem;">
                            $${ticket.monto ? ticket.monto.toFixed(2) : '0.00'}
                        </div>
                        <span style="color: ${this.getStatusColor(ticket.estado)};">
                            ${this.formatStatus(ticket.estado)}
                        </span>
                        ${ticket.qr_usado ? '<div style="color: var(--warning); font-size: 0.8rem;">Usado</div>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    // ⚙️ Cargar datos de configuración
    async loadConfigData() {
        try {
            const tasaResult = await this.getCurrentDollarRate();
            this.renderDollarConfig(tasaResult);
            
        } catch (error) {
            console.error('Error loading config data:', error);
            document.getElementById('dollarConfig').innerHTML = 
                '<p>Error cargando configuración</p>';
        }
    }

    // 💰 Renderizar configuración de dólar
    renderDollarConfig(tasaData) {
        const container = document.getElementById('dollarConfig');
        
        const html = `
            <div style="max-width: 400px;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                        Tasa del Dólar Actual
                    </label>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <input type="text" 
                               id="tasaDolarInput" 
                               value="${tasaData.value}" 
                               style="flex: 1; padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-family: 'Montserrat', sans-serif;">
                        <button class="btn" onclick="updateDollarRate()">
                            <i class="fas fa-save"></i> Actualizar
                        </button>
                    </div>
                </div>
                <div style="color: var(--gray); font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i>
                    Esta tasa se usará para calcular el monto en bolívares en el formulario de compra.
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // 🎨 Utilidades de UI
    getStatusColor(status) {
        const colors = {
            'aprobado': 'var(--success)',
            'pendiente': 'var(--warning)',
            'esperando_comprobante': 'var(--gray)',
            'rechazado': 'var(--danger)'
        };
        return colors[status] || 'var(--gray)';
    }

    formatStatus(status) {
        const formatted = {
            'aprobado': 'Aprobado',
            'pendiente': 'Pendiente',
            'esperando_comprobante': 'Esperando Comprobante',
            'rechazado': 'Rechazado'
        };
        return formatted[status] || status;
    }

    showError(message) {
        // Implementar toast o alert
        console.error(message);
        alert(message); // Temporal, mejorar con toast
    }

    showSuccess(message) {
        // Implementar toast o alert
        console.log(message);
        alert(message); // Temporal, mejorar con toast
    }
}

// 🎯 Funciones globales para botones
window.viewComprobante = function(url) {
    window.open(url, '_blank');
};

window.approvePurchase = async function(purchaseId) {
    try {
        const { error } = await window.LAMUBI_UTILS.supabase
            .from('verificaciones_pagos')
            .update({ 
                estado: 'aprobado',
                fecha_verificacion: window.LAMUBI_UTILS.venezuelaNow(),
                admin_id: window.adminPanel.currentUser.id
            })
            .eq('id', purchaseId);
        
        if (error) throw error;
        
        window.adminPanel.showSuccess('Compra aprobada correctamente');
        window.adminPanel.loadPendingPurchases();
        window.adminPanel.loadDashboardData();
        
    } catch (error) {
        console.error('Error approving purchase:', error);
        window.adminPanel.showError('Error aprobando compra');
    }
};

window.rejectPurchase = async function(purchaseId) {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;
    
    try {
        const { error } = await window.LAMUBI_UTILS.supabase
            .from('verificaciones_pagos')
            .update({ 
                estado: 'rechazado',
                fecha_verificacion: window.LAMUBI_UTILS.venezuelaNow(),
                admin_id: window.adminPanel.currentUser.id,
                admin_notas: reason
            })
            .eq('id', purchaseId);
        
        if (error) throw error;
        
        window.adminPanel.showSuccess('Compra rechazada correctamente');
        window.adminPanel.loadPendingPurchases();
        window.adminPanel.loadDashboardData();
        
    } catch (error) {
        console.error('Error rejecting purchase:', error);
        window.adminPanel.showError('Error rechazando compra');
    }
};

window.updateDollarRate = async function() {
    const newRate = document.getElementById('tasaDolarInput').value.trim();
    if (!newRate) {
        window.adminPanel.showError('La tasa no puede estar vacía');
        return;
    }
    
    try {
        const { error } = await window.LAMUBI_UTILS.supabase
            .from('configuracion_sistema')
            .update({ 
                valor: newRate,
                fecha_actualizacion: window.LAMUBI_UTILS.venezuelaNow(),
                actualizado_por: window.adminPanel.currentUser.id
            })
            .eq('clave', 'tasa_dolar_bcv');
        
        if (error) throw error;
        
        window.adminPanel.showSuccess('Tasa del dólar actualizada correctamente');
        window.adminPanel.loadDashboardData();
        
    } catch (error) {
        console.error('Error updating dollar rate:', error);
        window.adminPanel.showError('Error actualizando tasa del dólar');
    }
};

// Funciones para recarga
window.loadDashboardData = () => window.adminPanel.loadDashboardData();
window.loadPendingPurchases = () => window.adminPanel.loadPendingPurchases();
window.loadAllTickets = () => window.adminPanel.loadAllTickets();

// 🎯 Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
    
    window.LAMUBI_UTILS.debugLog('Admin Panel system loaded');
});
