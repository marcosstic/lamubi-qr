// 🎯 LA MUBI - Tasa Dólar para Verificación
// Función para obtener tasa dólar actual

async function obtenerTasaDolar() {
    // Reintento silencioso si config.js aún no termina
    let intentos = 0;
    const maxIntentos = 10;
    
    while (!window.LAMUBI_UTILS?.supabase && intentos < maxIntentos) {
        console.log(`⏳ Esperando Supabase... intento ${intentos + 1}/${maxIntentos}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        intentos++;
    }

    const supabase = window.LAMUBI_UTILS?.supabase;

    if (!supabase) {
        console.error("⛔ Supabase no inicializado tras esperar.");
        console.log("🔍 Estado final:", {
            LAMUBI_UTILS: !!window.LAMUBI_UTILS,
            supabase: !!window.LAMUBI_UTILS?.supabase,
            supabaseClient: !!window.supabaseClient
        });
        return "500,00"; // Valor actualizado que configuraste
    }

    try {
        console.log("🎯 Consultando tasa dólar en BD...");
        
        const { data, error } = await supabase
            .from('configuracion_sistema')
            .select('valor')
            .eq('clave', 'tasa_dolar_bcv')
            .eq('activo', true)
            .single();
        
        if (error) {
            console.error("❌ Error en consulta BD:", error);
            throw error;
        }
        
        console.log("✅ Tasa dólar obtenida de BD:", data.valor);
        return data.valor;
        
    } catch (err) {
        console.error("❌ Error obteniendo tasa:", err);
        return "500,00"; // Valor actualizado que configuraste
    }
}

// Función para calcular monto en bolívares
function calcularMontoBolivares(montoUSD, tasaDolar) {
    // Convertir "1.234,56" a 1234.56
    const tasaNumerica = parseFloat(tasaDolar.replace(/\./g, '').replace(',', '.'));
    const montoBolivares = montoUSD * tasaNumerica;
    
    // Formatear como moneda venezolana
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2
    }).format(montoBolivares);
}

// Función principal para mostrar información de pago
async function mostrarInformacionPago(montoUSD = 5.00) {
    const tasaDolar = await obtenerTasaDolar();
    const montoBolivares = calcularMontoBolivares(montoUSD, tasaDolar);
    
    // Actualizar elementos en el formulario de verificación
    const tasaElement = document.getElementById('tasa-dolar-actual');
    const montoElement = document.getElementById('monto-bolivares');
    const montoSugeridoElement = document.getElementById('monto-sugerido');
    
    if (tasaElement) {
        tasaElement.textContent = `Bs. ${tasaDolar}`;
    }
    
    if (montoElement) {
        montoElement.textContent = montoBolivares;
    }
    
    if (montoSugeridoElement) {
        // Extraer solo el número sin "Bs. " para el campo sugerido
        const montoNumerico = montoBolivares.replace('Bs. ', '');
        montoSugeridoElement.textContent = montoNumerico;
        
        // Actualizar placeholder del campo de monto
        const montoInput = document.getElementById('monto-pago');
        if (montoInput) {
            montoInput.placeholder = `Ej: ${montoNumerico}`;
        }
    }
    
    return {
        tasa: tasaDolar,
        montoBolivares: montoBolivares,
        montoUSD: montoUSD
    };
}

// Exportar funciones para uso global
window.TASA_DOLAR_UTILS = {
    obtenerTasaDolar,
    calcularMontoBolivares,
    mostrarInformacionPago
};
