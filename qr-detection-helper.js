// 🎯 QR DETECTION HELPER - WRAPPER PARA QR-SCANNER
// 📅 Fecha: 2026-02-02
// 🎯 Objetivo: Integrar QR-Scanner con video stream existente

class QRDetectionHelper {
    constructor() {
        this.qrScanner = null;
        this.isScanning = false;
        this.onQRDetected = null;
        this.videoElement = null;
    }

    // Inicializar detección QR con video element existente
    async initialize(videoElement, onQRDetected) {
        try {
            console.log('🎯 Inicializando QR Detection Helper...');
            
            this.videoElement = videoElement;
            this.onQRDetected = onQRDetected;

            // Verificar que QR-Scanner esté disponible
            if (typeof QrScanner === 'undefined') {
                throw new Error('QR-Scanner library no está disponible');
            }

            // Verificar que el video element tenga stream
            if (!videoElement.srcObject) {
                throw new Error('Video element no tiene stream activo');
            }

            console.log('✅ QR Detection Helper inicializado');
            return true;

        } catch (error) {
            console.error('❌ Error inicializando QR Detection Helper:', error);
            throw error;
        }
    }

    // Iniciar detección QR
    async startScanning() {
        try {
            console.log('🎯 Iniciando detección QR...');
            if (typeof window.addConsoleLog === 'function') {
                window.addConsoleLog('🎯 Iniciando detección QR...');
            }
            
            console.log('📹 Video element:', this.videoElement);
            console.log('📹 Video srcObject:', this.videoElement?.srcObject);
            console.log('📹 Video readyState:', this.videoElement?.readyState);
            console.log('📹 Video playing:', !this.videoElement?.paused);

            if (this.isScanning) {
                console.log('⚠️ La detección QR ya está activa');
                if (typeof window.addConsoleLog === 'function') {
                    window.addConsoleLog('⚠️ La detección QR ya está activa', 'warn');
                }
                return;
            }

            if (!this.videoElement || !this.videoElement.srcObject) {
                throw new Error('Video element no disponible o sin stream');
            }

            // Verificar QR-Scanner disponible
            console.log('🔍 QR-Scanner disponible:', typeof QrScanner !== 'undefined');
            console.log('🔍 QR-Scanner versión:', QrScanner ? 'loaded' : 'not loaded');

            // Agregar listener para debugging
            console.log('🎯 Agregando listener para debugging...');
            let frameCount = 0;
            let lastQRCheck = 0;
            const debugInterval = setInterval(() => {
                if (this.qrScanner && this.isScanning) {
                    frameCount++;
                    if (frameCount % 60 === 0) { // Cada 60 frames (~1 segundo)
                        console.log(`📹 QR Scanner activo - Frame: ${frameCount}`);
                        console.log('🎯 qrScanner._active:', this.qrScanner._active);
                        console.log('🎯 qrScanner._isScanning:', this.qrScanner._isScanning);
                        
                        if (typeof window.addConsoleLog === 'function') {
                            window.addConsoleLog(`📹 QR Scanner activo - Frame: ${frameCount}`);
                        }
                        
                        // Verificar si el video está realmente reproduciendo
                        if (this.videoElement) {
                            console.log('📹 Video estado:', {
                                readyState: this.videoElement.readyState,
                                videoWidth: this.videoElement.videoWidth,
                                videoHeight: this.videoElement.videoHeight,
                                paused: this.videoElement.paused,
                                ended: this.videoElement.ended
                            });
                        }
                    }
                    
                    // Cada 5 segundos, verificar si hay actividad de QR
                    if (frameCount % 300 === 0 && frameCount > lastQRCheck) {
                        console.log('🔍 Verificación de QR activity - No QR detectado aún');
                        if (typeof window.addConsoleLog === 'function') {
                            window.addConsoleLog('🔍 Verificación de QR activity - No QR detectado aún', 'warn');
                        }
                        lastQRCheck = frameCount;
                    }
                } else {
                    clearInterval(debugInterval);
                }
            }, 16); // ~60 FPS

            // Crear instancia de QR-Scanner
            console.log('🎯 Creando instancia QR-Scanner...');
            this.qrScanner = new QrScanner(
                this.videoElement,
                (result) => {
                    console.log(`🎫 QR DETECTADO en frame ${frameCount}!`);
                    if (typeof window.addConsoleLog === 'function') {
                        window.addConsoleLog(`🎫 QR DETECTADO en frame ${frameCount}!`, 'success');
                    }
                    this.handleQRDetected(result);
                },
                {
                    // Opciones optimizadas para móviles
                    highlightScanRegion: false,
                    highlightCodeOutline: false,
                    // Desactivar efectos visuales para mejor rendimiento
                }
            );

            console.log('✅ QR-Scanner instance created');
            console.log('🎯 QR-Scanner instance:', this.qrScanner);
            if (typeof window.addConsoleLog === 'function') {
                window.addConsoleLog('✅ QR-Scanner instance created');
            }

            // Iniciar escaneo
            console.log('🚀 Iniciando QR-Scanner.start()...');
            await this.qrScanner.start();
            
            this.isScanning = true;

            console.log('✅ Detección QR iniciada correctamente');
            console.log('🎯 isScanning:', this.isScanning);
            console.log('🎯 qrScanner state:', this.qrScanner._isScanning);
            
            if (typeof window.addConsoleLog === 'function') {
                window.addConsoleLog('✅ Detección QR iniciada correctamente');
            }
            
            this.updateStatus('🎯 Detección QR activa', 'success');

        } catch (error) {
            console.error('❌ Error iniciando detección QR:', error);
            console.error('❌ Error stack:', error.stack);
            if (typeof window.addConsoleLog === 'function') {
                window.addConsoleLog('❌ Error iniciando detección QR: ' + error.message, 'error');
            }
            this.updateStatus('Error iniciando detección QR: ' + error.message, 'error');
            throw error;
        }
    }

    // Detener detección QR
    stopScanning() {
        try {
            console.log('⏹️ Deteniendo detección QR...');

            if (this.qrScanner && this.isScanning) {
                this.qrScanner.stop();
                this.qrScanner = null;
            }

            this.isScanning = false;
            console.log('✅ Detección QR detenida');
            this.updateStatus('Detección QR detenida', 'warning');

        } catch (error) {
            console.error('❌ Error deteniendo detección QR:', error);
        }
    }

    async restartScanning() {
        try {
            console.log('🔄 Reiniciando detección QR...');

            if (this.qrScanner) {
                try {
                    const maybePromise = this.qrScanner.stop();
                    if (maybePromise && typeof maybePromise.then === 'function') {
                        await maybePromise;
                    }
                } catch (e) {
                    console.warn('⚠️ Error al detener qrScanner durante restart:', e);
                }
            }

            this.qrScanner = null;
            this.isScanning = false;

            await this.startScanning();
        } catch (error) {
            console.error('❌ Error reiniciando detección QR:', error);
            throw error;
        }
    }

    // Manejar QR detectado
    handleQRDetected(result) {
        try {
            console.log('🎫 QR DETECTADO CALLBACK EJECUTADO!');
            console.log('🎫 Result data:', result);
            console.log('🎫 Result data type:', typeof result);
            console.log('🎫 Result.data:', result.data);
            console.log('🎫 Result.data type:', typeof result.data);
            
            // Actualizar UI
            this.updateStatus('🎫 QR detectado: ' + result.data, 'success');

            // Llamar callback
            if (this.onQRDetected) {
                console.log('🎯 Llamando onQRDetected callback...');
                this.onQRDetected(result.data);
                console.log('✅ onQRDetected callback completado');
            } else {
                console.log('❌ onQRDetected callback no definido');
            }

        } catch (error) {
            console.error('❌ Error manejando QR detectado:', error);
            console.error('❌ Error stack:', error.stack);
        }
    }

    // Verificar disponibilidad
    static async isSupported() {
        try {
            // Verificar QR-Scanner
            if (typeof QrScanner === 'undefined') {
                return { supported: false, reason: 'QR-Scanner library no disponible' };
            }

            // Verificar cámara API
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

    // Obtener diagnóstico
    static async getDiagnostic() {
        const diagnostic = {
            userAgent: navigator.userAgent,
            qrScannerAvailable: typeof QrScanner !== 'undefined',
            cameraAPI: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
            isAndroid: /Android/.test(navigator.userAgent),
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

    // Actualizar estado en UI
    updateStatus(message, type = 'info') {
        try {
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = message;
                statusElement.className = `status ${type}`;
                statusElement.style.display = 'block';
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
        }
    }

    // Limpiar recursos
    destroy() {
        this.stopScanning();
        this.videoElement = null;
        this.onQRDetected = null;
    }
}

// Exportar
window.QRDetectionHelper = QRDetectionHelper;
