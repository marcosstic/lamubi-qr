// 🎫 MUBI SCANNER - WRAPPER SIMPLIFICADO
// 📅 Fecha: 2026-02-02
// 🎯 Objetivo: Simplificar escaneo QR para LA MUBI
// 🔧 Stack: Html5Qrcode + Manejo automático de errores

class MubiScanner {
    constructor(elementId, onResult) {
        this.scanner = null;
        this.elementId = elementId;
        this.onResult = onResult;
        this.isScanning = false;
        
        // Configuración optimizada para móviles
        this.config = { 
            fps: 15, // Más FPS para mejor detección
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
    }

    async start() {
        try {
            console.log('🎯 Iniciando MubiScanner...');
            
            if (this.isScanning) {
                console.log('⚠️ El escáner ya está activo');
                return { success: false, error: 'Escáner ya activo' };
            }

            // 1. Verificación automática de HTTPS
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                throw new Error("La cámara requiere HTTPS. Usa localhost o una conexión segura.");
            }

            // 2. Verificar API disponible
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API no disponible en este navegador");
            }

            // 3. Inicializar scanner
            this.scanner = new Html5Qrcode(this.elementId);

            // 4. Estrategia de cámara optimizada para móviles
            const cameraConfig = await this.getBestCameraConfig();
            
            // 5. Iniciar escaneo
            await this.scanner.start(
                cameraConfig,
                this.config,
                (decodedText) => {
                    console.log('🎫 QR detectado:', decodedText);
                    this.stop(); // Detener al encontrar éxito
                    this.onResult(decodedText);
                },
                (errorMessage) => {
                    // Silenciar errores continuos
                    // console.log('⚠️ Error de escaneo:', errorMessage);
                }
            );

            this.isScanning = true;
            console.log('✅ MubiScanner iniciado correctamente');
            return { success: true };

        } catch (error) {
            console.error('❌ Error MubiScanner:', error);
            return { success: false, error: error.message };
        }
    }

    async getBestCameraConfig() {
        try {
            // Detectar si es móvil
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            console.log('📱 Dispositivo detectado:', isMobile ? (isIOS ? 'iOS' : 'Android') : 'Desktop');

            // Para móviles: intentar cámara trasera primero
            if (isMobile) {
                try {
                    // Intentar obtener cámaras disponibles
                    const cameras = await Html5Qrcode.getCameras();
                    
                    // Buscar cámara trasera
                    const backCamera = cameras.find(camera => 
                        camera.label && (
                            camera.label.toLowerCase().includes('back') ||
                            camera.label.toLowerCase().includes('trasera') ||
                            camera.label.toLowerCase().includes('environment')
                        )
                    );
                    
                    if (backCamera) {
                        console.log('📹 Usando cámara trasera:', backCamera.label);
                        return { deviceId: { exact: backCamera.id } };
                    }
                    
                    // Si no hay trasera, usar la primera disponible
                    if (cameras.length > 0) {
                        console.log('📹 Usando primera cámara disponible:', cameras[0].label);
                        return { deviceId: { exact: cameras[0].id } };
                    }
                } catch (error) {
                    console.log('⚠️ No se pudieron detectar cámaras, usando fallback');
                }
                
                // Fallback para móviles
                if (isIOS) {
                    console.log('📱 iOS: usando facingMode environment');
                    return { facingMode: "environment" };
                } else {
                    console.log('📱 Android: usando facingMode environment');
                    return { facingMode: "environment" };
                }
            }
            
            // Para desktop: cualquier cámara
            console.log('💻 Desktop: cámara por defecto');
            return undefined;
            
        } catch (error) {
            console.log('⚠️ Error detectando cámara, usando por defecto:', error);
            return undefined;
        }
    }

    stop() {
        try {
            if (this.scanner && this.isScanning) {
                this.scanner.stop();
                this.scanner.clear();
                this.isScanning = false;
                console.log('✅ MubiScanner detenido');
            }
        } catch (error) {
            console.error('❌ Error deteniendo MubiScanner:', error);
        }
    }

    // Método para verificar disponibilidad
    static async isAvailable() {
        try {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        } catch {
            return false;
        }
    }

    // Método para obtener diagnóstico
    static async getDiagnostic() {
        const diagnostic = {
            userAgent: navigator.userAgent,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
            isAndroid: /Android/i.test(navigator.userAgent),
            isHTTPS: window.location.protocol === 'https:',
            isLocalhost: window.location.hostname === 'localhost',
            cameraAPI: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            html5QrcodeAvailable: typeof Html5Qrcode !== 'undefined'
        };

        try {
            const cameras = await Html5Qrcode.getCameras();
            diagnostic.cameras = cameras;
            diagnostic.cameraCount = cameras.length;
        } catch (error) {
            diagnostic.cameras = [];
            diagnostic.cameraCount = 0;
            diagnostic.cameraError = error.message;
        }

        return diagnostic;
    }
}

// Exportar para uso global
window.MubiScanner = MubiScanner;
