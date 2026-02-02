// 📱 IOS CAMERA HELPER - SOLUCIÓN ESPECÍFICA PARA IPHONE
// 🎅 Basado en investigación exhaustiva de Safari iOS

class IOSCameraHelper {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    // Crear video element con atributos requeridos para iOS
    createVideoElement() {
        const video = document.createElement('video');
        video.id = 'ios-camera-video';
        video.autoplay = true;
        video.playsinline = true;
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        // Atributos específicos para iOS
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-player-fullscreen', 'true');
        
        return video;
    }

    // Iniciar cámara con método compatible con iOS
    async startCamera(containerId) {
        try {
            console.log('📱 Iniciando cámara iOS...');
            
            if (!this.isIOS) {
                console.log('📱 No es iOS, usando método estándar');
                return this.startCameraStandard(containerId);
            }

            // Método específico para iOS
            return this.startCameraIOS(containerId);
            
        } catch (error) {
            console.error('❌ Error iniciando cámara iOS:', error);
            throw error;
        }
    }

    // Método optimizado para iOS
    async startCameraIOS(containerId) {
        try {
            console.log('📱 Usando método optimizado para iOS...');
            
            // 1. Crear video element con atributos iOS
            this.videoElement = this.createVideoElement();
            
            // 2. Limpiar container y agregar video
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            container.appendChild(this.videoElement);
            
            // 3. Constraints específicas para iOS
            const constraints = {
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: false
            };
            
            console.log('📱 Requesting stream with constraints:', constraints);
            
            // 4. Obtener stream
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // 5. Asignar stream al video
            this.videoElement.srcObject = this.stream;
            
            // 6. Forzar play (iOS necesita esto)
            await this.videoElement.play();
            
            console.log('✅ Cámara iOS iniciada correctamente');
            return this.stream;
            
        } catch (error) {
            console.error('❌ Error método iOS:', error);
            
            // Fallback: intentar con constraints más simples
            return this.startCameraFallback(containerId);
        }
    }

    // Fallback con constraints simples
    async startCameraFallback(containerId) {
        try {
            console.log('🔄 Intentando fallback con constraints simples...');
            
            const constraints = {
                video: {
                    facingMode: "environment"
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            
            console.log('✅ Fallback iOS exitoso');
            return this.stream;
            
        } catch (error) {
            console.error('❌ Error fallback iOS:', error);
            throw new Error('No se pudo iniciar la cámara en iOS');
        }
    }

    // Método estándar para otros dispositivos
    async startCameraStandard(containerId) {
        try {
            console.log('💻 Usando método estándar...');
            
            // Para Android/Desktop, usar Html5Qrcode
            const html5QrCode = new Html5Qrcode(containerId);
            
            const result = await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    console.log('🎫 QR detectado:', decodedText);
                    this.stopCamera();
                    if (this.onQRDetected) {
                        this.onQRDetected(decodedText);
                    }
                },
                (errorMessage) => {
                    // Silenciar errores continuos
                }
            );
            
            this.html5QrCode = html5QrCode;
            return result;
            
        } catch (error) {
            console.error('❌ Error método estándar:', error);
            throw error;
        }
    }

    // Detener cámara
    stopCamera() {
        try {
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }
            
            if (this.html5QrCode) {
                this.html5QrCode.stop();
                this.html5QrCode = null;
            }
            
            console.log('✅ Cámara detenida');
            
        } catch (error) {
            console.error('❌ Error deteniendo cámara:', error);
        }
    }

    // Callback para QR detectado
    setQRCallback(callback) {
        this.onQRDetected = callback;
    }

    // Verificar compatibilidad
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    // Obtener diagnóstico
    static async getDiagnostic() {
        const diagnostic = {
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
            isSupported: IOSCameraHelper.isSupported(),
            userAgent: navigator.userAgent,
            protocol: window.location.protocol,
            hostname: window.location.hostname
        };

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            diagnostic.videoDevices = devices.filter(device => device.kind === 'videoinput');
            diagnostic.videoDeviceCount = diagnostic.videoDevices.length;
        } catch (error) {
            diagnostic.deviceError = error.message;
        }

        return diagnostic;
    }
}

// Exportar
window.IOSCameraHelper = IOSCameraHelper;
