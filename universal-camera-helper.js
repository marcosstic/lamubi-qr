// 🌐 UNIVERSAL CAMERA HELPER - DETECCIÓN AUTOMÁTICA DE DISPOSITIVO
// 📅 Fecha: 2026-02-02
// 🎯 Objetivo: Manejo de cámara cross-platform (iOS + Android + Desktop)

class UniversalCameraHelper {
    constructor() {
        this.cameraHelper = null;
        this.videoElement = null;
        this.stream = null;
        this.onVideoReady = null;
        this.deviceType = this.detectDevice();
    }

    // Detectar tipo de dispositivo
    detectDevice() {
        const userAgent = navigator.userAgent;
        
        if (/iPad|iPhone|iPod/.test(userAgent)) {
            return 'ios';
        } else if (/Android/.test(userAgent)) {
            return 'android';
        } else {
            return 'desktop';
        }
    }

    // Iniciar cámara universal
    async startCamera(containerId) {
        try {
            console.log(`🌐 Iniciando cámara para dispositivo: ${this.deviceType}`);
            
            // Seleccionar helper específico
            switch (this.deviceType) {
                case 'ios':
                    return await this.startIOSCamera(containerId);
                case 'android':
                    return await this.startAndroidCamera(containerId);
                case 'desktop':
                    return await this.startDesktopCamera(containerId);
                default:
                    throw new Error('Dispositivo no soportado');
            }
            
        } catch (error) {
            console.error('❌ Error iniciando cámara universal:', error);
            throw error;
        }
    }

    // Iniciar cámara iOS
    async startIOSCamera(containerId) {
        try {
            console.log('📱 Usando IOS Camera Helper...');
            
            if (typeof IOSCameraHelper === 'undefined') {
                throw new Error('IOSCameraHelper no disponible');
            }
            
            this.cameraHelper = new IOSCameraHelper();
            this.cameraHelper.onVideoReady = (videoElement) => {
                this.videoElement = videoElement;
                if (this.onVideoReady) {
                    this.onVideoReady(videoElement);
                }
            };
            
            this.stream = await this.cameraHelper.startCamera(containerId);
            return this.stream;
            
        } catch (error) {
            console.error('❌ Error con iOS Camera Helper:', error);
            throw error;
        }
    }

    // Iniciar cámara Android
    async startAndroidCamera(containerId) {
        try {
            console.log('🤖 Usando Android Camera Helper...');
            
            if (typeof AndroidCameraHelper === 'undefined') {
                console.error('❌ AndroidCameraHelper no disponible');
                throw new Error('AndroidCameraHelper no disponible');
            }
            
            console.log('🤖 Creando instancia de AndroidCameraHelper...');
            this.cameraHelper = new AndroidCameraHelper();
            this.cameraHelper.onVideoReady = (videoElement) => {
                console.log('🤖 AndroidCameraHelper.onVideoReady ejecutado');
                this.videoElement = videoElement;
                if (this.onVideoReady) {
                    console.log('🤖 Ejecutando onVideoReady callback...');
                    this.onVideoReady(videoElement);
                } else {
                    console.log('⚠️ onVideoReady callback no definido en UniversalCameraHelper');
                }
            };
            
            console.log('🤖 Iniciando cámara Android...');
            this.stream = await this.cameraHelper.startCamera(containerId);
            console.log('✅ Cámara Android iniciada en UniversalCameraHelper');
            return this.stream;
            
        } catch (error) {
            console.error('❌ Error con Android Camera Helper:', error);
            console.error('❌ Error stack:', error.stack);
            throw error;
        }
    }

    // Iniciar cámara Desktop
    async startDesktopCamera(containerId) {
        try {
            console.log('💻 Usando cámara Desktop (getUserMedia estándar)...');
            
            // Crear video element
            this.videoElement = document.createElement('video');
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            this.videoElement.style.width = '100%';
            this.videoElement.style.height = '100%';
            this.videoElement.style.objectFit = 'cover';
            
            // Agregar al container
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            container.appendChild(this.videoElement);
            
            // Constraints para desktop
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            
            console.log('✅ Cámara Desktop iniciada');
            
            if (this.onVideoReady) {
                this.onVideoReady(this.videoElement);
            }
            
            return this.stream;
            
        } catch (error) {
            console.error('❌ Error iniciando cámara Desktop:', error);
            throw error;
        }
    }

    // Detener cámara
    stopCamera() {
        try {
            console.log('⏹️ Deteniendo cámara universal...');
            
            if (this.cameraHelper && this.cameraHelper.stopCamera) {
                this.cameraHelper.stopCamera();
                this.cameraHelper = null;
            } else if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            if (this.videoElement) {
                this.videoElement.srcObject = null;
                this.videoElement = null;
            }
            
            console.log('✅ Cámara universal detenida');
            
        } catch (error) {
            console.error('❌ Error deteniendo cámara universal:', error);
        }
    }

    // Obtener diagnóstico universal
    static async getDiagnostic() {
        const diagnostic = {
            userAgent: navigator.userAgent,
            deviceType: new UniversalCameraHelper().detectDevice(),
            cameraAPI: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            protocol: window.location.protocol,
            hostname: window.location.hostname
        };

        // Verificar soporte específico
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            diagnostic.videoDevices = videoDevices.length;
        } catch (error) {
            diagnostic.deviceError = error.message;
        }

        return diagnostic;
    }
}

// Exportar
window.UniversalCameraHelper = UniversalCameraHelper;
