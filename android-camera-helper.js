// 🎯 ANDROID CAMERA HELPER - ESPECÍFICO PARA ANDROID
// 📅 Fecha: 2026-02-02
// 🎯 Objetivo: Manejo de cámara optimizado para Android

class AndroidCameraHelper {
    constructor() {
        this.videoElement = null;
        this.stream = null;
        this.onVideoReady = null;
        this.isAndroid = /Android/.test(navigator.userAgent);
    }

    // Iniciar cámara Android
    async startCamera(containerId) {
        try {
            console.log('🤖 Iniciando cámara Android...');
            
            if (!this.isAndroid) {
                throw new Error('Este helper es específico para Android');
            }

            console.log('🤖 Verificando container:', containerId);
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} no encontrado`);
            }

            // 1. Crear video element
            console.log('🤖 Creando video element...');
            this.videoElement = this.createVideoElement();
            
            // 2. Limpiar container y agregar video
            console.log('🤖 Agregando video al container...');
            container.innerHTML = '';
            container.appendChild(this.videoElement);
            
            // 3. Constraints optimizadas para Android
            const constraints = {
                video: {
                    // Android prefiere facingMode explícito
                    facingMode: "environment",
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            };
            
            console.log('🤖 Requesting stream with constraints:', constraints);
            
            // 4. Obtener stream con getUserMedia estándar
            console.log('🤖 Llamando a getUserMedia...');
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Stream obtenido:', this.stream);
            
            // 5. Asignar stream al video
            console.log('🤖 Asignando stream al video...');
            this.videoElement.srcObject = this.stream;
            
            // 6. Esperar a que el video esté listo
            console.log('🤖 Iniciando reproducción del video...');
            await this.videoElement.play();
            console.log('✅ Video reproduciéndose correctamente');
            
            console.log('✅ Cámara Android iniciada correctamente');
            console.log('🤖 Video element:', this.videoElement);
            console.log('🤖 Stream:', this.stream);
            console.log('🤖 Video readyState:', this.videoElement.readyState);
            console.log('🤖 Video paused:', this.videoElement.paused);
            
            // 7. Notificar que el video está listo
            if (this.onVideoReady) {
                console.log('🤖 Ejecutando onVideoReady callback...');
                this.onVideoReady(this.videoElement);
            } else {
                console.log('⚠️ onVideoReady callback no definido');
            }
            
            return this.stream;
            
        } catch (error) {
            console.error('❌ Error iniciando cámara Android:', error);
            console.error('❌ Error stack:', error.stack);
            
            // Fallback: intentar con constraints más simples
            return this.startCameraFallback(containerId);
        }
    }

    // Fallback para Android
    async startCameraFallback(containerId) {
        try {
            console.log('🔄 Intentando fallback Android...');
            
            // Constraints más simples
            const constraints = {
                video: {
                    facingMode: "environment"
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            
            console.log('✅ Fallback Android exitoso');
            
            if (this.onVideoReady) {
                this.onVideoReady(this.videoElement);
            }
            
            return this.stream;
            
        } catch (error) {
            console.error('❌ Error en fallback Android:', error);
            throw new Error('No se pudo iniciar la cámara Android: ' + error.message);
        }
    }

    // Crear video element optimizado para Android
    createVideoElement() {
        const video = document.createElement('video');
        
        // Atributos para Android
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        return video;
    }

    // Detener cámara
    stopCamera() {
        try {
            console.log('⏹️ Deteniendo cámara Android...');
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            if (this.videoElement) {
                this.videoElement.srcObject = null;
                this.videoElement = null;
            }
            
            console.log('✅ Cámara Android detenida');
            
        } catch (error) {
            console.error('❌ Error deteniendo cámara Android:', error);
        }
    }

    // Verificar soporte Android
    static async isSupported() {
        try {
            // Verificar Android
            const isAndroid = /Android/.test(navigator.userAgent);
            if (!isAndroid) {
                return { supported: false, reason: 'No es dispositivo Android' };
            }

            // Verificar Camera API
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return { supported: false, reason: 'Camera API no disponible' };
            }

            // Verificar si hay cámaras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length === 0) {
                return { supported: false, reason: 'No se detectaron cámaras' };
            }

            return { supported: true, videoDevices: videoDevices.length };

        } catch (error) {
            return { supported: false, reason: error.message };
        }
    }

    // Obtener diagnóstico Android
    static async getDiagnostic() {
        const diagnostic = {
            userAgent: navigator.userAgent,
            isAndroid: /Android/.test(navigator.userAgent),
            cameraAPI: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            protocol: window.location.protocol,
            hostname: window.location.hostname
        };

        try {
            const support = await this.isSupported();
            diagnostic.supported = support.supported;
            diagnostic.supportReason = support.reason;
            diagnostic.videoDevices = support.videoDevices || 0;
        } catch (error) {
            diagnostic.supportError = error.message;
        }

        return diagnostic;
    }
}

// Exportar
window.AndroidCameraHelper = AndroidCameraHelper;
