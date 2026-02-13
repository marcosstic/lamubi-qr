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
                .order('fecha_actualizacion', { ascending: false })
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
            <div class="activity-item" style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${activity.email_temporal || 'Usuario no registrado'}</strong>
                        <span class="method-text" style="color: var(--gray); margin-left: 0.5rem;">
                            ${activity.metodo_pago}
                        </span>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: ${this.getStatusColor(activity.estado)};">
                            ${this.formatStatus(activity.estado)}
                        </span>
                        <div class="time-info" style="font-size: 0.8rem; color: var(--gray);">
                            🕐 Compra: ${window.LAMUBI_UTILS.formatDateVenezuela(activity.fecha_pago)}
                            ${activity.fecha_verificacion ? 
                                `<br>✅ ${activity.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}: ${window.LAMUBI_UTILS.formatDateVenezuela(activity.fecha_verificacion)}` 
                                : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    // 🔧 Obtener timestamp Venezuela actual
    getVenezuelaTimestamp() {
        return new Date().toISOString();
    }

    // 🔍 Filtrar compras pendientes
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
            <div class="ticket-item" style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div class="badge-container" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <strong>${ticket.email_temporal || 'Usuario no registrado'}</strong>
                            <span class="ticket-badge">
                                <i class="fas fa-ticket-alt" style="font-size: 0.7rem;"></i>
                                #${ticket.id}
                            </span>
                        </div>
                        <div style="color: var(--gray); font-size: 0.9rem;">
                            ${ticket.metodo_pago} • ${ticket.estado}
                        </div>
                        <div style="color: var(--gray); font-size: 0.8rem;">
                            🕐 Compra: ${window.LAMUBI_UTILS.formatDateVenezuela(ticket.fecha_pago)}
                            ${ticket.fecha_verificacion ? `<br>✅ ${ticket.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}: ${window.LAMUBI_UTILS.formatDateVenezuela(ticket.fecha_verificacion)}` : ''}
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
            const [tasaResult, priceResult] = await Promise.all([
                this.getCurrentDollarRate(),
                this.getCurrentTicketPriceUSD()
            ]);
            this.renderDollarConfig(tasaResult);
            this.renderTicketPriceConfig(priceResult);
            
        } catch (error) {
            console.error('Error loading config data:', error);
            document.getElementById('dollarConfig').innerHTML = 
                '<p>Error cargando configuración</p>';
        }
    }

    // 🎫 Obtener precio actual del ticket en USD
    async getCurrentTicketPriceUSD() {
        const fallback = window.LAMUBI_CONFIG?.TICKETS?.PRECIO_USD ?? 5.00;

        const { data, error } = await this.supabase
            .from('configuracion_sistema')
            .select('valor')
            .eq('clave', 'ticket_precio_usd_actual')
            .eq('activo', true)
            .single();

        if (error || !data) {
            return { value: fallback };
        }

        const parsed = parseFloat(data.valor.toString().replace(',', '.'));
        const value = Number.isFinite(parsed) ? parsed : fallback;
        return { value };
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

    // � Renderizar configuración de precio del ticket
    renderTicketPriceConfig(priceData) {
        const container = document.getElementById('ticketPriceConfig');
        if (!container) return;

        const price = priceData?.value ?? (window.LAMUBI_CONFIG?.TICKETS?.PRECIO_USD ?? 5.00);
        const formatted = `$${price.toFixed(2)}`;

        const isSuperAdmin = this.currentUser?.rol === window.LAMUBI_CONFIG?.ADMIN?.ROLES?.SUPER_ADMIN;

        if (!isSuperAdmin) {
            container.innerHTML = `
                <div style="max-width: 500px;">
                    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.5rem;">
                        <div style="font-weight: 700;">Precio actual:</div>
                        <div style="font-weight: 800; color: var(--success); font-size: 1.1rem;">${formatted}</div>
                    </div>
                    <div style="color: var(--gray); font-size: 0.9rem;">
                        <i class="fas fa-lock"></i>
                        Solo un super admin puede cambiar el precio.
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="max-width: 500px;">
                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.75rem;">
                    <div style="font-weight: 700;">Precio actual:</div>
                    <div style="font-weight: 800; color: var(--success); font-size: 1.1rem;">${formatted}</div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Cambiar precio (USD)</label>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <input type="number" id="ticketPriceUsdInput" min="0" step="0.01" value="${price}"
                               style="flex: 1; padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-family: 'Montserrat', sans-serif;">
                        <button class="btn" onclick="updateTicketPriceUSD()"><i class="fas fa-save"></i> Actualizar</button>
                    </div>
                </div>
                <div style="color: var(--gray); font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i>
                    Este precio se usará para calcular el monto en bolívares según la tasa actual.
                </div>
            </div>
        `;
    }

    // �🎨 Utilidades de UI
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

// 📊 Exportar tickets aprobados a Excel
window.exportApprovedTicketsToExcel = async function() {
    try {
        // Mostrar loading
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class=\'fas fa-spinner fa-spin\'></i> Exportando...';
        button.disabled = true;
        
        // Consultar tickets aprobados ordenados por fecha_creacion
        const { data, error } = await window.LAMUBI_UTILS.supabase
            .from('verificaciones_pagos')
            .select('*')
            .eq('estado', 'aprobado')
            .order('fecha_creacion', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            alert('No hay tickets aprobados para exportar');
            button.innerHTML = originalText;
            button.disabled = false;
            return;
        }
        
        // Preparar datos para Excel
        const excelData = data.map(ticket => ({
            'ID': ticket.id,
            'Email': ticket.email_temporal || 'N/A',
            'Método Pago': ticket.metodo_pago,
            'Monto': ticket.monto || 0,
            'Tasa Dólar': ticket.tasa_dolar || 0,
            'Referencia': ticket.referencia || 'N/A',
            'Estado': ticket.estado,
            'Fecha Creación': window.LAMUBI_UTILS.formatDateVenezuela(ticket.fecha_creacion),
            'Fecha Pago': window.LAMUBI_UTILS.formatDateVenezuela(ticket.fecha_pago),
            'Fecha Verificación': ticket.fecha_verificacion ? window.LAMUBI_UTILS.formatDateVenezuela(ticket.fecha_verificacion) : 'N/A',
            'QR Usado': ticket.qr_usado ? 'Sí' : 'No',
            'Fecha Uso': ticket.fecha_uso ? window.LAMUBI_UTILS.formatDateVenezuela(ticket.fecha_uso) : 'N/A',
            'Comprobante': ticket.comprobante_url ? 'Disponible' : 'No',
            'Nombre Comprobante': ticket.comprobante_nombre || 'N/A'
        }));
        
        // Crear workbook y worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tickets Aprobados');
        
        // Generar nombre de archivo con fecha
        const now = new Date();
        const fileName = `tickets_aprobados_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${now.getHours()}${now.getMinutes()}.xlsx`;
        
        // Descargar archivo
        XLSX.writeFile(wb, fileName);
        
        // Restaurar botón
        button.innerHTML = originalText;
        button.disabled = false;
        
        console.log(`✅ Excel exportado: ${fileName} con ${data.length} tickets`);
        
    } catch (error) {
        console.error('❌ Error exportando Excel:', error);
        alert('Error al exportar Excel: ' + error.message);
        
        // Restaurar botón en caso de error
        const button = document.querySelector('button[onclick*="exportApprovedTicketsToExcel"]');
        if (button) {
            button.innerHTML = '<i class="fas fa-file-excel"></i> Exportar Excel';
            button.disabled = false;
        }
    }
};
window.viewComprobante = function(url) {
    if (!url) {
        alert('No hay comprobante disponible para este pago');
        return;
    }
    window.open(url, '_blank');
};

window.approvePurchase = async function(purchaseId) {
    try {
        const { error } = await window.LAMUBI_UTILS.supabase
            .from('verificaciones_pagos')
            .update({ 
                estado: 'aprobado',
                fecha_verificacion: window.adminPanel.getVenezuelaTimestamp(),
                admin_id: window.adminPanel.currentUser.id
            })
            .eq('id', purchaseId);
        
        if (error) throw error;
        
        window.adminPanel.showSuccess('Compra aprobada correctamente');
        window.adminPanel.loadPendingPurchases();
        window.adminPanel.loadAllTickets();
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
                fecha_verificacion: window.adminPanel.getVenezuelaTimestamp(),
                admin_id: window.adminPanel.currentUser.id,
                admin_notas: reason
            })
            .eq('id', purchaseId);
        
        if (error) throw error;
        
        window.adminPanel.showSuccess('Compra rechazada correctamente');
        window.adminPanel.loadPendingPurchases();
        window.adminPanel.loadAllTickets();
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

window.updateTicketPriceUSD = async function() {
    const input = document.getElementById('ticketPriceUsdInput');
    const rawValue = input ? input.value : '';
    const value = parseFloat((rawValue ?? '').toString().replace(',', '.'));

    if (!Number.isFinite(value) || value <= 0) {
        window.adminPanel.showError('El precio debe ser un número mayor a 0');
        return;
    }

    if (window.adminPanel?.currentUser?.rol !== window.LAMUBI_CONFIG?.ADMIN?.ROLES?.SUPER_ADMIN) {
        window.adminPanel.showError('No tienes permisos para cambiar el precio');
        return;
    }

    if (!confirm(`¿Seguro que deseas cambiar el precio del ticket a $${value.toFixed(2)} USD?`)) {
        return;
    }

    try {
        const { error } = await window.LAMUBI_UTILS.supabase
            .from('configuracion_sistema')
            .upsert({
                clave: 'ticket_precio_usd_actual',
                valor: value.toFixed(2),
                activo: true,
                fecha_actualizacion: window.LAMUBI_UTILS.venezuelaNow(),
                actualizado_por: window.adminPanel.currentUser.id
            }, {
                onConflict: 'clave'
            });

        if (error) throw error;

        window.adminPanel.showSuccess('Precio actualizado correctamente');
        window.adminPanel.loadConfigData();
    } catch (error) {
        console.error('Error updating ticket price:', error);
        window.adminPanel.showError('Error actualizando el precio');
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
