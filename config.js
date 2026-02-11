// 🎯 LA MUBI - Configuración Principal
// Sistema de Tickets QR Digital

// 🗄️ Supabase Configuration
const CONFIG = {
    SUPABASE: {
        URL: 'https://jayzsshngmbwvwdmizis.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpheXpzc2huZ21id3Z3ZG1pemlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODI1NzEsImV4cCI6MjA4NTU1ODU3MX0.n47Rzi-nnK-OFR1XFdtjfM1MA2_cvY6XIPgdvCxVWrs'
    },
    
    // 📱 Storage Configuration
    STORAGE: {
        BUCKET: 'lamubi-qr-comprobantes',
        MAX_SIZE: 5 * 1024 * 1024, // 5MB (confirmado con bucket)
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'], // Confirmado con bucket
        COMPRESSION: {
            MAX_WIDTH: 800,
            MAX_HEIGHT: 600,
            QUALITY: 0.7,
            TARGET_SIZE: 200 * 1024 // 200KB
        }
    },
    
    // 🎫 Tickets Configuration
    TICKETS: {
        PRECIO_USD: 5.00,
        METODOS_PAGO: ['pago-movil', 'zelle', 'efectivo', 'qr'],
        EVENTO: {
            NOMBRE: 'LA MUBI 2024',
            FECHA: '2024-02-15',
            HORA: '20:00',
            UBICACION: 'Caracas, Venezuela'
        }
    },
    
    // 🎨 UI Configuration
    UI: {
        ANIMATIONS: {
            DURATION: 300,
            EASING: 'ease'
        },
        TOAST: {
            DURATION: 5000,
            POSITION: 'top-right'
        },
        LOADING: {
            MIN_DURATION: 1000,
            MAX_DURATION: 5000
        }
    },
    
    // 🔐 Admin Configuration
    ADMIN: {
        ROLES: {
            SUPER_ADMIN: 'super_admin',
            TICKETS_ADMIN: 'tickets_admin',
            MARKETING_ADMIN: 'marketing_admin'
        },
        PERMISOS: {
            VERIFICAR_COMPRAS: 'verificar_compras',
            CONFIGURAR_TASA: 'configurar_tasa',
            GENERAR_QR: 'generar_qr',
            VER_ESTADISTICAS: 'ver_estadisticas'
        }
    },
    
    // 🌐 API Configuration
    API: {
        TIMEOUT: 10000,
        RETRIES: 3,
        RETRY_DELAY: 1000
    }
};

// 🕐 Venezuela Timezone Functions
const venezuelaNow = () => {
    const now = new Date();
    // Venezuela timezone (UTC-4)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const venezuelaTime = new Date(utc - (4 * 3600000));
    return venezuelaTime.toISOString();
};

// � Venezuela Now String - Formato correcto usando formatDateVenezuela
const venezuelaNowString = () => {
    return formatDateVenezuela(new Date());
};

// � Format Venezuela Currency
const formatBolivares = (amount) => {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

// 📱 Format Date Venezuela
const formatDateVenezuela = (date) => {
    return new Date(date).toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

// 🎫 Generate Unique Ticket ID
const generateTicketId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `LAMUBI_${timestamp}_${random}`;
};

// 🔐 Validate Email
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// 📱 Validate Phone (Venezuela)
const validatePhone = (phone) => {
    // Accept formats: 0414-1234567, 04141234567, +584141234567
    const re = /^(\+58)?\s?(0414|0424|0412|0416|0426)\s?-?\s?\d{7}$/;
    return re.test(phone);
};

// 🔍 Debug Mode
const DEBUG = true;
const debugLog = (message, data = null) => {
    if (DEBUG) {
        console.log(`🎯 LA MUBI DEBUG: ${message}`, data);
    }
};

// 🚀 Initialize Supabase Client
let supabaseClient;
try {
    // Importar Supabase directamente desde el objeto global si está disponible
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
        debugLog('Supabase client initialized successfully');
    } else {
        // Intentar crear cliente directamente
        console.error('❌ Supabase library not loaded');
        supabaseClient = null;
    }
} catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
    supabaseClient = null;
}

// 🎯 Export Configuration
window.LAMUBI_CONFIG = CONFIG;
window.LAMUBI_UTILS = {
    venezuelaNow,
    venezuelaNowString,
    formatBolivares,
    formatDateVenezuela,
    generateTicketId,
    validateEmail,
    validatePhone,
    debugLog,
    supabase: supabaseClient // Incluir cliente en utils para acceso global
};

// También exportar el cliente directamente para compatibilidad
window.supabaseClient = supabaseClient;

// 🚩 VERIFICACIÓN CRÍTICA
console.log("🎯 LA MUBI DEBUG: Supabase client guardado en LAMUBI_UTILS");
console.log("🔍 LAMUBI_UTILS.supabase:", window.LAMUBI_UTILS.supabase);
console.log("🔍 window.supabaseClient:", window.supabaseClient);

debugLog('Configuration loaded successfully', CONFIG);
