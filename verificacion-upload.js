// 🎯 LA MUBI - Validación y Upload de Comprobantes
// Sistema mejorado para verificación de imágenes

class VerificacionUpload {
    constructor() {
        this.maxSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
        this.compressionQuality = 0.7;
        this.maxWidth = 800;
        this.maxHeight = 600;
    }

    // 🔍 Validar archivo antes de subir
    validarArchivo(file) {
        const errors = [];
        
        // Validar tipo
        if (!this.allowedTypes.includes(file.type)) {
            errors.push(`Tipo de archivo no permitido: ${file.type}. Usa: JPG, PNG, WebP, HEIC`);
        }
        
        // Validar tamaño
        if (file.size > this.maxSize) {
            errors.push(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: 5MB`);
        }
        
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            errors.push('El archivo debe ser una imagen válida');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 🗜️ Comprimir imagen
    async comprimirImagen(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Crear canvas para redimensionar
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calcular nuevas dimensiones
                    let { width, height } = this.calcularDimensiones(img.width, img.height);
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Dibujar imagen redimensionada
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convertir a blob con compresión
                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log(`🗜️ Imagen comprimida: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB`);
                            resolve(blob);
                        } else {
                            reject(new Error('Error al comprimir imagen'));
                        }
                    }, 'image/jpeg', this.compressionQuality);
                };
                
                img.onerror = () => reject(new Error('Error al cargar imagen'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsDataURL(file);
        });
    }

    // 📏 Calcular dimensiones manteniendo aspect ratio
    calcularDimensiones(originalWidth, originalHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };
        
        // Reducir si excede el máximo
        if (width > this.maxWidth || height > this.maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
                width = this.maxWidth;
                height = width / aspectRatio;
            } else {
                height = this.maxHeight;
                width = height * aspectRatio;
            }
        }
        
        return { width, height };
    }

    // 📤 Subir archivo a Supabase Storage
    async subirComprobante(file, paymentMethod, referencia) {
        try {
            // Validar archivo
            const validation = this.validarArchivo(file);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('. '));
            }
            
            // Comprimir imagen
            const compressedFile = await this.comprimirImagen(file);
            
            // Generar nombre único
            const fileName = `${paymentMethod}_${referencia}_${Date.now()}.jpg`;
            
            console.log('🚀 Iniciando upload a Supabase Storage...');
            console.log('📁 Bucket: lamubi-comprobantes');
            console.log('📄 Archivo:', fileName);
            
            // Subir a Supabase Storage con retry
            let uploadResult;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    console.log(`📤 Intento ${retryCount + 1}/${maxRetries}`);
                    
                    uploadResult = await window.LAMUBI_UTILS.supabase.storage
                        .from('lamubi-qr-comprobantes')
                        .upload(fileName, compressedFile, {
                            cacheControl: '3600',
                            upsert: false
                        });
                    
                    console.log('✅ Upload exitoso:', uploadResult);
                    break;
                    
                } catch (uploadError) {
                    console.error(`❌ Error en intento ${retryCount + 1}:`, uploadError);
                    retryCount++;
                    
                    if (retryCount >= maxRetries) {
                        throw new Error(`Error después de ${maxRetries} intentos: ${uploadError.message}`);
                    }
                    
                    // Esperar antes de reintentar
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
            
            if (uploadResult.error) throw uploadResult.error;
            
            // Obtener URL pública
            const { data: { publicUrl } } = window.LAMUBI_UTILS.supabase.storage
                .from('lamubi-qr-comprobantes')
                .getPublicUrl(fileName);
            
            console.log('📤 Comprobante subido exitosamente:', publicUrl);
            
            return {
                success: true,
                url: publicUrl,
                fileName: fileName,
                originalSize: file.size,
                compressedSize: compressedFile.size
            };
            
        } catch (error) {
            console.error('❌ Error subiendo comprobante:', error);
            
            // Error específico de Firefox
            if (error.message.includes('onMessage listener')) {
                console.error('🔥 Error detectado de Firefox - Intentando solución alternativa...');
                // Intentar upload con fetch directo como fallback
                return await this.subirComprobanteFallback(file, paymentMethod, referencia);
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🔄 Fallback para Firefox - Upload con fetch directo
    async subirComprobanteFallback(file, paymentMethod, referencia) {
        try {
            console.log('🔄 Usando fallback fetch directo...');
            
            const compressedFile = await this.comprimirImagen(file);
            const fileName = `${paymentMethod}_${referencia}_${Date.now()}.jpg`;
            
            const formData = new FormData();
            formData.append('file', compressedFile);
            
            const response = await fetch(
                `https://jayzsshngmbwvwdmizis.supabase.co/storage/v1/object/lamubi-qr-comprobantes/${fileName}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.LAMUBI_UTILS.SUPABASE.ANON_KEY}`,
                        'x-upsert': 'false'
                    },
                    body: compressedFile
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const publicUrl = `https://jayzsshngmbwvwdmizis.supabase.co/storage/v1/object/public/lamubi-qr-comprobantes/${fileName}`;
            
            console.log('✅ Fallback exitoso:', publicUrl);
            
            return {
                success: true,
                url: publicUrl,
                fileName: fileName,
                originalSize: file.size,
                compressedSize: compressedFile.size
            };
            
        } catch (error) {
            console.error('❌ Error en fallback:', error);
            return {
                success: false,
                error: `Fallback fallido: ${error.message}`
            };
        }
    }

    // 🎯 Configurar upload para un input específico
    configurarUpload(inputId, labelId, fileNameId) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        const fileName = document.getElementById(fileNameId);
        
        if (!input || !label || !fileName) {
            console.error(`❌ Elementos no encontrados: ${inputId}, ${labelId}, ${fileNameId}`);
            return;
        }
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            
            if (!file) {
                fileName.textContent = '';
                label.classList.remove('has-file');
                return;
            }
            
            // Validar archivo
            const validation = this.validarArchivo(file);
            
            if (!validation.isValid) {
                alert(validation.errors.join('\n'));
                e.target.value = '';
                fileName.textContent = '';
                label.classList.remove('has-file');
                return;
            }
            
            // Mostrar información del archivo
            const fileSize = (file.size / 1024).toFixed(2);
            fileName.textContent = `${file.name} (${fileSize}KB)`;
            label.classList.add('has-file');
            
            console.log(`✅ Archivo seleccionado: ${file.name} (${fileSize}KB)`);
        });
    }
}

// 🎯 Inicializar sistema de upload
const verificacionUpload = new VerificacionUpload();

// Exportar para uso global
window.VERIFICACION_UPLOAD = verificacionUpload;

// 🎯 Configurar uploads cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Configurar upload para pago móvil
    verificacionUpload.configurarUpload('comprobante-pago-movil', 'label-pago-movil', 'file-name-pago-movil');
    
    // Configurar upload para Zelle
    verificacionUpload.configurarUpload('comprobante-zelle', 'label-zelle', 'file-name-zelle');
    
    console.log('🎯 Sistema de upload configurado');
});
