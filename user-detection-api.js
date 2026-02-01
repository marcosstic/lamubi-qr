// 🔍 LA MUBI - API Detección Inteligente de Usuarios
// Sistema para detectar usuarios registrados y mostrar solo campos faltantes

class UserDetectionAPI {
    constructor() {
        this.supabase = window.supabase;
        this.cache = new Map(); // Cache para evitar búsquedas repetidas
    }

    // 🔍 Buscar usuario por email
    async detectarUsuario(email) {
        try {
            window.LAMUBI_UTILS.debugLog('Detecting user', { email });

            // Validar email
            if (!window.LAMUBI_UTILS.validateEmail(email)) {
                throw new Error('Email inválido');
            }

            // Verificar cache
            if (this.cache.has(email)) {
                window.LAMUBI_UTILS.debugLog('User found in cache', { email });
                return this.cache.get(email);
            }

            // Buscar en base de datos
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('*')
                .eq('correo', email)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error; // Error real, no "not found"
            }

            const resultado = data ? {
                encontrado: true,
                usuario: data,
                camposFaltantes: this.detectarCamposFaltantes(data),
                mensaje: this.generarMensajeBienvenida(data)
            } : {
                encontrado: false,
                mensaje: 'Nuevo usuario - Registro completo requerido'
            };

            // Guardar en cache
            this.cache.set(email, resultado);

            window.LAMUBI_UTILS.debugLog('User detection result', resultado);
            return resultado;

        } catch (error) {
            console.error('❌ Error detecting user:', error);
            return {
                encontrado: false,
                error: error.message,
                mensaje: 'Error verificando usuario. Intenta nuevamente.'
            };
        }
    }

    // 🔍 Detectar campos faltantes
    detectarCamposFaltantes(usuario) {
        const camposRequeridos = [
            { key: 'telefono', label: 'Teléfono', required: true },
            { key: 'genero', label: 'Género', required: true },
            { key: 'cedula', label: 'Cédula', required: true },
            { key: 'edad', label: 'Edad', required: true }
        ];

        const faltantes = camposRequeridos.filter(campo => {
            const valor = usuario[campo.key];
            return !valor || valor === '' || valor === null;
        });

        return faltantes;
    }

    // 📝 Generar mensaje de bienvenida
    generarMensajeBienvenida(usuario) {
        const camposFaltantes = this.detectarCamposFaltantes(usuario);
        
        if (camposFaltantes.length === 0) {
            return `¡Hola ${usuario.nombre}! Tus datos están completos. Puedes continuar con la compra.`;
        } else {
            const camposLista = camposFaltantes.map(c => c.label).join(', ');
            return `¡Hola ${usuario.nombre}! Solo falta completar: ${camposLista}`;
        }
    }

    // 👤 Crear nuevo usuario
    async crearUsuario(datosUsuario) {
        try {
            window.LAMUBI_UTILS.debugLog('Creating new user', datosUsuario);

            // Validar datos requeridos
            const datosRequeridos = ['nombre', 'correo', 'telefono', 'genero', 'cedula', 'edad'];
            for (const campo of datosRequeridos) {
                if (!datosUsuario[campo]) {
                    throw new Error(`El campo ${campo} es requerido`);
                }
            }

            // Validar email único
            const emailExistente = await this.detectarUsuario(datosUsuario.correo);
            if (emailExistente.encontrado) {
                throw new Error('Este correo ya está registrado');
            }

            // Preparar datos para inserción
            const nuevoUsuario = {
                nombre: datosUsuario.nombre.trim(),
                correo: datosUsuario.correo.trim().toLowerCase(),
                telefono: datosUsuario.telefono.trim(),
                genero: datosUsuario.genero,
                cedula: datosUsuario.cedula.trim(),
                edad: parseInt(datosUsuario.edad),
                fuente: 'tickets_web',
                status: 'lead',
                fecha_registro: window.LAMUBI_UTILS.venezuelaNow(),
                ultima_actualizacion: window.LAMUBI_UTILS.venezuelaNow(),
                etiquetas: ['interes_tickets'],
                metadata: {
                    registro_origen: 'formulario_tickets',
                    ip: await this.getUserIP(),
                    user_agent: navigator.userAgent
                }
            };

            // Insertar en base de datos
            const { data, error } = await this.supabase
                .from('usuarios')
                .insert([nuevoUsuario])
                .select()
                .single();

            if (error) throw error;

            // Limpiar cache
            this.cache.delete(datosUsuario.correo);

            window.LAMUBI_UTILS.debugLog('User created successfully', data);
            return {
                success: true,
                usuario: data,
                mensaje: `¡Bienvenido ${data.nombre}! Tu registro ha sido completado.`
            };

        } catch (error) {
            console.error('❌ Error creating user:', error);
            return {
                success: false,
                error: error.message,
                mensaje: 'Error creando usuario. Intenta nuevamente.'
            };
        }
    }

    // 📝 Actualizar usuario existente
    async actualizarUsuario(usuarioId, datosActualizacion) {
        try {
            window.LAMUBI_UTILS.debugLog('Updating user', { usuarioId, datosActualizacion });

            // Preparar datos de actualización
            const datosUpdate = {
                ...datosActualizacion,
                ultima_actualizacion: window.LAMUBI_UTILS.venezuelaNow(),
                metadata: {
                    ...datosActualizacion.metadata,
                    ultima_actualizacion_origen: 'formulario_tickets'
                }
            };

            // Actualizar en base de datos
            const { data, error } = await this.supabase
                .from('usuarios')
                .update(datosUpdate)
                .eq('id', usuarioId)
                .select()
                .single();

            if (error) throw error;

            // Limpiar cache si se actualizó email
            if (datosActualizacion.correo) {
                this.cache.delete(datosActualizacion.correo);
            }

            window.LAMUBI_UTILS.debugLog('User updated successfully', data);
            return {
                success: true,
                usuario: data,
                mensaje: 'Datos actualizados correctamente.'
            };

        } catch (error) {
            console.error('❌ Error updating user:', error);
            return {
                success: false,
                error: error.message,
                mensaje: 'Error actualizando datos. Intenta nuevamente.'
            };
        }
    }

    // 📊 Obtener IP del usuario
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error getting IP:', error);
            return 'unknown';
        }
    }

    // 🔍 Validar cédula venezolana
    validarCedula(cedula) {
        // Acepta formatos: V-12345678, 12345678, E-12345678
        const cedulaRegex = /^[VE]-?\d{7,8}$/;
        return cedulaRegex.test(cedula.replace(/\s/g, ''));
    }

    // 🔍 Validar edad
    validarEdad(edad) {
        const edadNum = parseInt(edad);
        return edadNum >= 18 && edadNum <= 100;
    }

    // 📊 Obtener estadísticas de detección
    getDetectionStats() {
        return {
            cacheSize: this.cache.size,
            cachedEmails: Array.from(this.cache.keys()),
            detectionCount: this.detectionCount || 0
        };
    }

    // 🗑️ Limpiar cache
    limpiarCache() {
        this.cache.clear();
        window.LAMUBI_UTILS.debugLog('User detection cache cleared');
    }
}

// 🎯 Instancia global
const userDetectionAPI = new UserDetectionAPI();

// 🎯 Exportar para uso global
window.UserDetectionAPI = userDetectionAPI;

window.LAMUBI_UTILS.debugLog('User Detection API loaded');
