// VALIDACIÓN DE CAMPOS - DÍA 2
// Sistema de validación en tiempo real para LA MUBI

class ValidacionCampos {
    constructor() {
        // Cache para monto esperado
        this.cacheMontoEsperado = {
            valor: 0,
            timestamp: 0,
            ttl: 30000 // 30 segundos de cache
        };
        
        this.estandares = {
            pagoMovil: {
                referencia: {
                    regex: /^[0-9]{8,12}$/,
                    mensaje: 'Debe tener 8-12 dígitos numéricos',
                    ejemplo: 'Ej: 1234567890'
                },
                monto: {
                    regex: /^[0-9.,]*$/,
                    mensaje: '',
                    ejemplo: 'Ej: 2.500,00'
                },
                comprobante: {
                    tipos: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
                    maxSize: 5 * 1024 * 1024, // 5MB
                    mensaje: 'JPG, PNG, WebP, HEIC - Máx 5MB'
                }
            },
            zelle: {
                confirmacion: {
                    regex: /^ZEL[A-Z0-9]{6,10}$/,
                    mensaje: 'Debe empezar con ZEL y tener 6-10 caracteres alfanuméricos',
                    ejemplo: 'Ej: ZEL123456'
                },
                email: {
                    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    mensaje: 'Email válido requerido',
                    ejemplo: 'Ej: usuario@dominio.com'
                },
                fecha: {
                    regex: /^\d{4}-\d{2}-\d{2}$/,
                    mensaje: 'Formato de fecha requerido',
                    ejemplo: 'Ej: 2025-01-29'
                },
                comprobante: {
                    tipos: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
                    maxSize: 5 * 1024 * 1024,
                    mensaje: 'JPG, PNG, WebP, HEIC - Máx 5MB'
                }
            }
        };
        
        this.colores = {
            primario: '#bb1175',
            secundario: '#f43cb8',
            acento: '#f361e5',
            exito: '#11bb75',
            advertencia: '#f59e0b',
            error: '#ef4444'
        };
    }

    // Validar campo específico
    validarCampo(campoId, metodoPago) {
        const campo = document.getElementById(campoId);
        if (!campo) return false;

        const valor = campo.value.trim();
        const tipoCampo = this.obtenerTipoCampo(campoId);
        const estandar = this.estandares[metodoPago][tipoCampo];

        if (!estandar) return true; // Si no hay estándar, es válido

        // Validación según tipo
        let esValido = false;
        let mensajeError = '';

        if (campo.type === 'file') {
            esValido = this.validarArchivo(campo, estandar);
            mensajeError = estandar.mensaje;
        } else {
            esValido = estandar.regex.test(valor);
            mensajeError = estandar.mensaje;
        }

        // Validación especial para monto - DESACTIVADO formateo
        if (campoId === 'monto-pago' && esValido && valor) {
            // NO formatear el monto - mantener como entero
            // const montoFormateado = this.formatearMontoVenezolano(valor);
            
            // Actualizar valor limpio si es diferente
            if (valor !== campo.value) {
                // Guardar posición del cursor
                const start = campo.selectionStart;
                const end = campo.selectionEnd;
                
                // Actualizar valor
                campo.value = valor;
                
                // Restaurar posición del cursor
                campo.setSelectionRange(start, end);
            }
            
            // Validar exactitud del monto
            this.validarExactitudMonto(valor).then(resultadoValidacion => {
                esValido = resultadoValidacion.esExacto;
                if (!resultadoValidacion.esExacto) {
                    mensajeError = resultadoValidacion.mensaje;
                }
                this.actualizarUI(campo, esValido, mensajeError, estandar.ejemplo);
            }).catch(error => {
                console.error('❌ Error en validación asíncrona:', error);
                this.actualizarUI(campo, false, 'Error al validar monto', estandar.ejemplo);
            });
        }

        // Actualizar UI
        this.actualizarUI(campo, esValido, mensajeError, estandar.ejemplo);

        return esValido;
    }

    // Validar exactitud del monto vs esperado
    async validarExactitudMonto(montoFormateado) {
        // Forzar actualización del cache para obtener tasa actual
        await this.actualizarCacheMontoEsperado();
        
        // Obtener monto esperado actualizado
        let montoEsperado = 0;
        
        // Intentar obtener del cache actualizado
        if (this.cacheMontoEsperado.valor > 0) {
            montoEsperado = this.cacheMontoEsperado.valor;
        } else {
            // Si no hay cache, intentar obtener de forma síncrona
            if (window.ultimoResultadoPago && window.ultimoResultadoPago.montoBolivares) {
                const montoEsperadoStr = window.ultimoResultadoPago.montoBolivares.replace(/[^0-9.,]/g, '');
                montoEsperado = parseFloat(montoEsperadoStr.replace(/\./g, '').replace(/,/g, '.'));
            } else {
                // Valor por defecto basado en tasa real
                montoEsperado = 6173;
            }
        }
        
        // Formatear monto esperado para comparación y mostrar
        const montoEsperadoFormateado = this.formatearNumeroVenezolano(montoEsperado);
        
        // Convertir ambos a números para comparación exacta
        const montoUsuarioNum = parseFloat(montoFormateado.replace(/\./g, '').replace(/,/g, '.'));
        const montoEsperadoNum = parseFloat(montoEsperadoFormateado.replace(/\./g, '').replace(/,/g, '.'));
        
        console.log('🎯 Validación exactitud:', {
            montoFormateado,
            montoEsperadoFormateado,
            montoUsuarioNum,
            montoEsperadoNum,
            esExacto: montoUsuarioNum === montoEsperadoNum,
            cacheTimestamp: this.cacheMontoEsperado.timestamp
        });
        
        // Validación exacta (sin tolerancia)
        const esExacto = montoUsuarioNum === montoEsperadoNum;
        
        return {
            esExacto,
            mensaje: esExacto ? '' : `Monto incorrecto. Debe ser exactamente: Bs. ${montoEsperadoFormateado}`,
            montoEsperado: montoEsperadoFormateado
        };
    }

    // Forzar actualización del cache con tasa actual
    async actualizarCacheMontoEsperado() {
        try {
            // Siempre obtener tasa fresca de Supabase
            let tasaDolar = 1234.56; // Valor real
            
            if (window.LAMUBI_UTILS && window.LAMUBI_UTILS.supabase) {
                const { data, error } = await window.LAMUBI_UTILS.supabase
                    .from('configuracion_sistema')
                    .select('valor')
                    .eq('clave', 'tasa_dolar_bcv')
                    .eq('activo', true)
                    .single();
                
                if (!error && data) {
                    // Limpiar formato venezolano: 1.234,56 → 1234.56
                    const tasaLimpia = data.valor.toString()
                        .replace(/\./g, '')  // Quitar puntos de miles
                        .replace(',', '.');  // Cambiar coma decimal por punto
                    tasaDolar = parseFloat(tasaLimpia);
                    console.log('📈 Tasa dólar procesada correctamente:', tasaDolar);
                }
            }
            
            // Leer evento_id del formData
            const formData = JSON.parse(localStorage.getItem('lamubi-form-data'));
            const eventoId = formData?.eventoId || 1;

            // Lógica híbrida de precio
            let ticketPriceUsd;
            if (eventoId === 1) {
                // Evento General: usar configuracion_sistema
                ticketPriceUsd = window.LAMUBI_UTILS?.getTicketPriceUSD
                    ? await window.LAMUBI_UTILS.getTicketPriceUSD()
                    : (window.LAMUBI_CONFIG?.TICKETS?.PRECIO_USD ?? 5.00);
            } else {
                // Otros eventos (Pool Night): consultar tabla eventos
                if (window.LAMUBI_UTILS?.supabase) {
                    const { data, error } = await window.LAMUBI_UTILS.supabase
                        .from('eventos')
                        .select('precio_usd')
                        .eq('id', eventoId)
                        .single();
                    if (data && !error) {
                        ticketPriceUsd = data.precio_usd;
                    } else {
                        ticketPriceUsd = 5.00; // Fallback
                    }
                } else {
                    ticketPriceUsd = 5.00; // Fallback
                }
            }

            const clampInt = (value, min, max) => {
                const n = parseInt(value, 10);
                if (!Number.isFinite(n)) return min;
                return Math.min(max, Math.max(min, n));
            };

            const loadPurchaseContext = () => {
                try {
                    const raw = localStorage.getItem('lamubi-purchase');
                    if (!raw) return { cantidadEntradas: 1, hombres: 0, mujeres: 0 };
                    const parsed = JSON.parse(raw);
                    return {
                        cantidadEntradas: clampInt(parsed.cantidadEntradas ?? 1, 1, 10),
                        hombres: clampInt(parsed.hombres ?? 0, 0, 10),
                        mujeres: clampInt(parsed.mujeres ?? 0, 0, 10)
                    };
                } catch {
                    return { cantidadEntradas: 1, hombres: 0, mujeres: 0 };
                }
            };

            let totalUsd = ticketPriceUsd;
            if (window.LAMUBI_UTILS?.getFeatureFlag) {
                const multi = await window.LAMUBI_UTILS.getFeatureFlag('multi_tickets_enabled', false);
                if (multi) {
                    const ctx = loadPurchaseContext();
                    const cantidadEntradas = clampInt(ctx.cantidadEntradas ?? 1, 1, 10);
                    totalUsd = ticketPriceUsd * cantidadEntradas;
                }
            }

            // Calcular monto esperado (precio USD * tasa) y redondear a entero
            const montoEsperado = Math.round(totalUsd * tasaDolar);
            console.log('💰 Monto esperado actualizado y redondeado:', montoEsperado);
            
            // Actualizar cache inmediatamente
            this.cacheMontoEsperado = {
                valor: montoEsperado,
                timestamp: Date.now(),
                ttl: 30000
            };
            
            return montoEsperado;
            
        } catch (error) {
            console.error('❌ Error calculando monto esperado:', error);
            return {
                esValido: false,
                mensaje: 'Error al calcular monto esperado',
                montoUsuario: 0,
                montoEsperado: 0,
                diferencia: 0,
                montoFormateado: ''
            };
        }

        // Obtener monto esperado dinámicamente
        let montoEsperado = 0;
        
        // Intentar obtener de window.ultimoResultadoPago primero
        if (window.ultimoResultadoPago && window.ultimoResultadoPago.montoBolivares) {
            const montoEsperadoStr = window.ultimoResultadoPago.montoBolivares.replace(/[^0-9.,]/g, '');
            montoEsperado = parseFloat(montoEsperadoStr.replace(/\./g, '').replace(/,/g, '.'));
            console.log('📊 Usando monto de window.ultimoResultadoPago:', montoEsperado);
        } else {
            // Si no está disponible, calcular dinámicamente
            montoEsperado = await this.calcularMontoEsperadoDinamico();
            console.log('📊 Calculando monto esperado dinámicamente:', montoEsperado);
        }

        // Si todavía no hay monto esperado, usar valor por defecto
        if (montoEsperado === 0) {
            montoEsperado = 6173; // Valor real (5 * 1234.56)
            console.log('📊 Usando monto por defecto:', montoEsperado);
        }

        console.log('📊 Comparación final:', {
            montoUsuario,
            montoEsperado,
            montoFormateado,
            diferencia: Math.abs(montoUsuario - montoEsperado)
        });

        // Validar con tolerancia del 5%
        const tolerancia = montoEsperado * 0.05; // 5% de tolerancia
        const diferencia = Math.abs(montoUsuario - montoEsperado);
        const esValido = diferencia <= tolerancia;

        let mensaje = '';
        if (!esValido) {
            if (montoUsuario < montoEsperado - tolerancia) {
                mensaje = `Monto muy bajo. Esperado: Bs. ${this.formatearNumeroVenezolano(montoEsperado)}`;
            } else {
                mensaje = `Monto muy alto. Esperado: Bs. ${this.formatearNumeroVenezolano(montoEsperado)}`;
            }
        }

        return {
            esValido,
            mensaje,
            montoUsuario,
            montoEsperado,
            diferencia,
            montoFormateado,
            mostrarDiferencia: !esValido // Solo mostrar diferencia si es inválido
        };
    }

    // Calcular monto esperado dinámicamente
    async calcularMontoEsperadoDinamico() {
        try {
            // Verificar cache primero
            const ahora = Date.now();
            if (this.cacheMontoEsperado.valor > 0 && 
                (ahora - this.cacheMontoEsperado.timestamp) < this.cacheMontoEsperado.ttl) {
                console.log('📊 Usando monto cacheado:', this.cacheMontoEsperado.valor);
                return this.cacheMontoEsperado.valor;
            }
            
            // Obtener tasa dólar actual
            let tasaDolar = 1234.56; // Valor real
            
            // Intentar obtener de Supabase
            if (window.LAMUBI_UTILS && window.LAMUBI_UTILS.supabase) {
                const { data, error } = await window.LAMUBI_UTILS.supabase
                    .from('configuracion_sistema')
                    .select('valor')
                    .eq('clave', 'tasa_dolar_bcv')
                    .eq('activo', true)
                    .single();
                
                if (!error && data) {
                    // Limpiar formato venezolano: 1.234,56 → 1234.56
                    const tasaLimpia = data.valor.toString()
                        .replace(/\./g, '')  // Quitar puntos de miles
                        .replace(',', '.');  // Cambiar coma decimal por punto
                    tasaDolar = parseFloat(tasaLimpia);
                    console.log('📈 Tasa dólar procesada correctamente:', tasaDolar);
                }
            }
            
            // Leer evento_id del formData
            const formData = JSON.parse(localStorage.getItem('lamubi-form-data'));
            const eventoId = formData?.eventoId || 1;

            // Lógica híbrida de precio
            let ticketPriceUsd;
            if (eventoId === 1) {
                // Evento General: usar configuracion_sistema
                ticketPriceUsd = window.LAMUBI_UTILS?.getTicketPriceUSD
                    ? await window.LAMUBI_UTILS.getTicketPriceUSD()
                    : (window.LAMUBI_CONFIG?.TICKETS?.PRECIO_USD ?? 5.00);
            } else {
                // Otros eventos (Pool Night): consultar tabla eventos
                if (window.LAMUBI_UTILS?.supabase) {
                    const { data, error } = await window.LAMUBI_UTILS.supabase
                        .from('eventos')
                        .select('precio_usd')
                        .eq('id', eventoId)
                        .single();
                    if (data && !error) {
                        ticketPriceUsd = data.precio_usd;
                    } else {
                        ticketPriceUsd = 5.00; // Fallback
                    }
                } else {
                    ticketPriceUsd = 5.00; // Fallback
                }
            }

            const clampInt = (value, min, max) => {
                const n = parseInt(value, 10);
                if (!Number.isFinite(n)) return min;
                return Math.min(max, Math.max(min, n));
            };

            const loadPurchaseContext = () => {
                try {
                    const raw = localStorage.getItem('lamubi-purchase');
                    if (!raw) return { cantidadEntradas: 1, hombres: 0, mujeres: 0 };
                    const parsed = JSON.parse(raw);
                    return {
                        cantidadEntradas: clampInt(parsed.cantidadEntradas ?? 1, 1, 10),
                        hombres: clampInt(parsed.hombres ?? 0, 0, 10),
                        mujeres: clampInt(parsed.mujeres ?? 0, 0, 10)
                    };
                } catch {
                    return { cantidadEntradas: 1, hombres: 0, mujeres: 0 };
                }
            };

            let totalUsd = ticketPriceUsd;
            if (window.LAMUBI_UTILS?.getFeatureFlag) {
                const multi = await window.LAMUBI_UTILS.getFeatureFlag('multi_tickets_enabled', false);
                if (multi) {
                    const ctx = loadPurchaseContext();
                    const cantidadEntradas = clampInt(ctx.cantidadEntradas ?? 1, 1, 10);
                    totalUsd = ticketPriceUsd * cantidadEntradas;
                }
            }

            // Calcular monto esperado (precio USD * tasa) y redondear a entero
            const montoEsperado = Math.round(totalUsd * tasaDolar);
            console.log('💰 Monto esperado calculado y redondeado:', montoEsperado);
            
            // Actualizar cache
            this.cacheMontoEsperado = {
                valor: montoEsperado,
                timestamp: ahora,
                ttl: 30000
            };
            
            return montoEsperado;
            
        } catch (error) {
            console.error('❌ Error calculando monto esperado:', error);
            return 6173; // Valor real
        }
    }

    // Formatear monto estilo venezolano - DESACTIVADO para mantener enteros
    formatearMontoVenezolano(valor) {
        // Solo limpiar y devolver como entero sin formato
        let limpio = valor.replace(/[^0-9]/g, '');
        
        // Si está vacío, retornar vacío
        if (!limpio) return '';
        
        // Devolver como número entero sin formato
        return limpio;
    }

    // Formatear número a estilo venezolano
    formatearNumeroVenezolano(numero) {
        const entera = Math.floor(numero).toString();
        const decimal = Math.round((numero - Math.floor(numero)) * 100).toString().padStart(2, '0');
        
        // Agregar puntos cada 3 dígitos
        const enteraFormateada = entera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        
        return `${enteraFormateada},${decimal}`;
    }

    // Mostrar diferencia del monto
    mostrarDiferenciaMonto(resultado) {
        const diferenciaDiv = document.getElementById('monto-diferencia');
        const valorDiferenciaSpan = document.getElementById('valor-diferencia');
        
        if (!diferenciaDiv || !valorDiferenciaSpan) return;

        // Solo mostrar diferencia si es inválido y hay un monto esperado válido
        if (resultado.montoEsperado > 0 && resultado.mostrarDiferencia) {
            diferenciaDiv.style.display = 'block';
            
            const diferenciaFormateada = Math.abs(resultado.diferencia).toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            const porcentajeDiferencia = ((resultado.diferencia / resultado.montoEsperado) * 100).toFixed(1);
            
            valorDiferenciaSpan.textContent = `Bs. ${diferenciaFormateada} (${porcentajeDiferencia}%) - ⚠️ Fuera de tolerancia (5%)`;
            valorDiferenciaSpan.style.color = 'var(--warning)';
        } else {
            // Ocultar diferencia si es válido o no hay monto esperado
            diferenciaDiv.style.display = 'none';
        }
    }

    // Validar archivo
    validarArchivo(campo, estandar) {
        const archivo = campo.files[0];
        if (!archivo) return false;

        // Validar tipo
        const tipoValido = estandar.tipos.includes(archivo.type);
        if (!tipoValido) return false;

        // Validar tamaño
        const tamañoValido = archivo.size <= estandar.maxSize;
        if (!tamañoValido) return false;

        return true;
    }

    // Obtener tipo de campo para validación
    obtenerTipoCampo(campoId) {
        const mapping = {
            'referencia': 'referencia',
            'monto-pago': 'monto',
            'comprobante-pago-movil': 'comprobante',
            'confirmacion-zelle': 'confirmacion',
            'email-remitente': 'email',
            'fecha-zelle': 'fecha',
            'comprobante-zelle': 'comprobante'
        };
        return mapping[campoId] || campoId;
    }

    // Actualizar UI según validación
    actualizarUI(campo, esValido, mensajeError, ejemplo) {
        const formGroup = campo.closest('.form-group');
        const errorDiv = formGroup.querySelector('.error-message');
        const successDiv = formGroup.querySelector('.success-message');
        
        // Limpiar estados anteriores
        formGroup.classList.remove('error', 'valid');
        
        if (campo.value.trim() === '') {
            // Campo vacío - estado neutro
            if (errorDiv) errorDiv.style.display = 'none';
            if (successDiv) successDiv.style.display = 'none';
            campo.style.borderColor = 'rgba(244, 60, 184, 0.3)';
            campo.style.boxShadow = '';
        } else if (esValido) {
            // Válido
            formGroup.classList.add('valid');
            if (errorDiv) errorDiv.style.display = 'none';
            if (successDiv) successDiv.style.display = 'block';
            campo.style.borderColor = this.colores.exito;
            campo.style.boxShadow = `0 0 10px ${this.colores.exito}40`;
        } else {
            // Error - mostrar solo mensajeError sin ejemplo
            formGroup.classList.add('error');
            if (errorDiv) {
                errorDiv.textContent = mensajeError;
                errorDiv.style.display = 'block';
            }
            if (successDiv) successDiv.style.display = 'none';
            campo.style.borderColor = this.colores.error;
            campo.style.boxShadow = `0 0 10px ${this.colores.error}40`;
        }
    }

    // Generar timestamp automático para Venezuela
    generarTimestampVenezuela() {
        const ahora = new Date();
        const opciones = {
            timeZone: 'America/Caracas',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        const timestamp = ahora.toLocaleString('es-VE', opciones);
        console.log('🕐 Timestamp generado:', timestamp);
        return timestamp;
    }

    // Configurar timestamp automático al enviar formulario
    configurarTimestampAutomatico() {
        const formulario = document.getElementById('verification-form');
        if (!formulario) return;

        // Asignar timestamp inmediato al seleccionar método
        this.asignarTimestampSegunMetodo();

        formulario.addEventListener('submit', (e) => {
            // Asignar timestamps ANTES de la validación
            console.log('🕐 Asignando timestamps automáticos...');
            this.asignarTimestampSegunMetodo();
        });
    }

    // Asignar timestamp según método seleccionado
    asignarTimestampSegunMetodo() {
        // Obtener método seleccionado del localStorage
        const formData = JSON.parse(localStorage.getItem('lamubi-form-data'));
        if (!formData || !formData.paymentMethod) return;

        const metodo = formData.paymentMethod;
        console.log(`🕐 Asignando timestamp para método: ${metodo}`);

        if (metodo === 'pago-movil') {
            const fechaPagoCampo = document.getElementById('fecha-pago');
            if (fechaPagoCampo && fechaPagoCampo.type === 'hidden') {
                fechaPagoCampo.value = this.generarTimestampVenezuela();
                console.log('✅ Timestamp asignado al campo fecha-pago:', fechaPagoCampo.value);
            }
        } else if (metodo === 'zelle') {
            const fechaZelleCampo = document.getElementById('fecha-zelle');
            if (fechaZelleCampo && fechaZelleCampo.type === 'hidden') {
                fechaZelleCampo.value = this.generarTimestampVenezuela();
                console.log('✅ Timestamp asignado al campo fecha-zelle:', fechaZelleCampo.value);
            }
        }
    }

    // Obtener campos por método de pago
    obtenerCamposPorMetodo(metodoPago) {
        const campos = {
            pagoMovil: ['referencia', 'monto-pago', 'comprobante-pago-movil'],
            zelle: ['confirmacion-zelle', 'email-remitente', 'comprobante-zelle']
        };
        
        return campos[metodoPago] || [];
    }

    // Inicializar validación
    inicializar() {
        console.log('🎯 Inicializando validación de campos...');
        
        // Configurar timestamp automático
        this.configurarTimestampAutomatico();
        
        // Configurar validación en tiempo real
        this.configurarValidacionTiempoReal();
        
        console.log('✅ Validación de campos inicializada');
    }

    // Configurar validación en tiempo real
    configurarValidacionTiempoReal() {
        console.log('🎯 Configurando validación en tiempo real...');
        
        // Pago Móvil
        this.configurarCampo('referencia', 'pagoMovil');
        this.configurarCampo('monto-pago', 'pagoMovil');
        this.configurarCampo('comprobante-pago-movil', 'pagoMovil');
        
        // Zelle
        this.configurarCampo('confirmacion-zelle', 'zelle');
        this.configurarCampo('email-remitente', 'zelle');
        this.configurarCampo('comprobante-zelle', 'zelle');
    }

    // Configurar campo individual
    configurarCampo(campoId, metodoPago) {
        const campo = document.getElementById(campoId);
        if (!campo) {
            console.warn(`⚠️ Campo no encontrado: ${campoId}`);
            return;
        }

        // Validación al perder foco
        campo.addEventListener('blur', () => {
            this.validarCampo(campoId, metodoPago);
        });

        // Validación especial para archivos
        if (campo.type === 'file') {
            campo.addEventListener('change', () => {
                this.validarCampo(campoId, metodoPago);
                this.actualizarLabelArchivo(campo);
            });
        }
    }

    // Ajustar posición del cursor después del formateo
    ajustarPosicionCursor(posicionOriginal, valorOriginal, valorFormateado) {
        // Si el valor se acortó, ajustar posición
        if (valorFormateado.length < valorOriginal.length) {
            return Math.max(0, posicionOriginal - (valorOriginal.length - valorFormateado.length));
        }
        // Si el valor se alargó, mantener posición original
        return Math.min(valorFormateado.length, posicionOriginal);
    }

    // Actualizar label de archivo
    actualizarLabelArchivo(campo) {
        const label = document.querySelector(`label[for="${campo.id}"]`);
        const fileNameDiv = document.getElementById(`file-name-${campo.id.split('-').pop()}`);
        
        if (campo.files[0]) {
            const archivo = campo.files[0];
            const tamaño = (archivo.size / 1024 / 1024).toFixed(2);
            
            if (fileNameDiv) {
                fileNameDiv.textContent = `✅ ${archivo.name} (${tamaño}MB)`;
                fileNameDiv.style.color = this.colores.exito;
            }
            
            if (label) {
                label.classList.add('has-file');
                label.style.borderColor = this.colores.exito;
                label.style.backgroundColor = `${this.colores.exito}10`;
            }
        } else {
            if (fileNameDiv) {
                fileNameDiv.textContent = '';
            }
            
            if (label) {
                label.classList.remove('has-file');
                label.style.borderColor = '';
                label.style.backgroundColor = '';
            }
        }
    }

    // Validar formulario completo
    validarFormulario(metodoPago) {
        console.log(`🔍 Validando formulario completo: ${metodoPago}`);
        
        const campos = this.obtenerCamposPorMetodo(metodoPago);
        let todosValidos = true;
        
        campos.forEach(campoId => {
            const esValido = this.validarCampo(campoId, metodoPago);
            if (!esValido) {
                todosValidos = false;
            }
        });
        
        console.log(`✅ Resultado validación ${metodoPago}: ${todosValidos ? 'VÁLIDO' : 'INVÁLIDO'}`);
        return todosValidos;
    }

    // Obtener campos por método de pago
    obtenerCamposPorMetodo(metodoPago) {
        const campos = {
            pagoMovil: ['referencia', 'monto-pago', 'comprobante-pago-movil'],
            zelle: ['confirmacion-zelle', 'email-remitente', 'fecha-zelle', 'comprobante-zelle']
        };
        
        return campos[metodoPago] || [];
    }
}

// Instancia global
window.VALIDACION_CAMPOS = new ValidacionCampos();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Iniciando sistema de validación...');
    
    // Pequeña espera para asegurar que todo esté cargado
    setTimeout(() => {
        window.VALIDACION_CAMPOS.inicializar();
        console.log('✅ Sistema de validación iniciado correctamente');
    }, 1000);
});
