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
            
            // Subir a Supabase Storage
            const { data, error } = await window.LAMUBI_UTILS.supabase.storage
                .from('lamubi-comprobantes')
                .upload(fileName, compressedFile, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Obtener URL pública
            const { data: { publicUrl } } = window.LAMUBI_UTILS.supabase.storage
                .from('lamubi-comprobantes')
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
            return {
                success: false,
                error: error.message
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
