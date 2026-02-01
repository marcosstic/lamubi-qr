// 📱 LA MUBI - Supabase Storage System
// Upload y compresión de imágenes para comprobantes

class SupabaseStorage {
    constructor() {
        this.config = window.LAMUBI_CONFIG.STORAGE;
        this.supabase = window.supabase;
    }

    // 📤 Upload de imagen con compresión
    async uploadImage(file, ticketId) {
        try {
            window.LAMUBI_UTILS.debugLog('Starting image upload', { 
                fileName: file.name, 
                fileSize: file.size,
                ticketId 
            });

            // Validar archivo
            this.validateFile(file);

            // Comprimir imagen
            const compressedFile = await this.compressImage(file);
            window.LAMUBI_UTILS.debugLog('Image compressed', { 
                originalSize: file.size,
                compressedSize: compressedFile.size
            });

            // Generar nombre único
            const fileName = this.generateFileName(file, ticketId);

            // Subir a Supabase
            const { data, error } = await this.supabase.storage
                .from(this.config.BUCKET)
                .upload(fileName, compressedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Obtener URL pública
            const publicUrl = this.getPublicUrl(fileName);

            window.LAMUBI_UTILS.debugLog('Upload successful', { 
                fileName, 
                publicUrl 
            });

            return {
                success: true,
                fileName,
                publicUrl,
                originalSize: file.size,
                compressedSize: compressedFile.size
            };

        } catch (error) {
            console.error('❌ Error uploading image:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ✅ Validar archivo
    validateFile(file) {
        // Validar tipo
        if (!this.config.ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`Tipo de archivo no permitido. Usa: ${this.config.ALLOWED_TYPES.join(', ')}`);
        }

        // Validar tamaño
        if (file.size > this.config.MAX_SIZE) {
            throw new Error(`Archivo demasiado grande. Máximo: ${this.formatFileSize(this.config.MAX_SIZE)}`);
        }

        return true;
    }

    // 🗜️ Comprimir imagen
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calcular nuevas dimensiones
                    const { width, height } = this.calculateDimensions(
                        img.width, 
                        img.height
                    );

                    canvas.width = width;
                    canvas.height = height;

                    // Dibujar imagen comprimida
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convertir a blob con calidad ajustada
                    canvas.toBlob((blob) => {
                        // Si sigue siendo muy grande, reducir calidad
                        if (blob.size > this.config.COMPRESSION.TARGET_SIZE) {
                            this.compressWithLowerQuality(canvas, blob, resolve, reject);
                        } else {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        }
                    }, 'image/jpeg', this.config.COMPRESSION.QUALITY);
                };

                img.onerror = () => reject(new Error('Error loading image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsDataURL(file);
        });
    }

    // 📐 Calcular dimensiones manteniendo aspect ratio
    calculateDimensions(originalWidth, originalHeight) {
        const { MAX_WIDTH, MAX_HEIGHT } = this.config.COMPRESSION;
        
        let width = originalWidth;
        let height = originalHeight;

        // Reducir si excede máximo
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const aspectRatio = width / height;

            if (width > height) {
                width = MAX_WIDTH;
                height = width / aspectRatio;
            } else {
                height = MAX_HEIGHT;
                width = height * aspectRatio;
            }
        }

        return { width, height };
    }

    // 🔽 Comprimir con menor calidad
    async compressWithLowerQuality(canvas, currentBlob, resolve, reject) {
        let quality = this.config.COMPRESSION.QUALITY;
        const minQuality = 0.1;
        const step = 0.1;

        const tryCompress = () => {
            if (quality <= minQuality) {
                // Si no se puede reducir más, devolver el blob actual
                resolve(new File([currentBlob], 'compressed.jpg', {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                }));
                return;
            }

            canvas.toBlob((blob) => {
                if (blob.size <= this.config.COMPRESSION.TARGET_SIZE) {
                    resolve(new File([blob], 'compressed.jpg', {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                } else {
                    quality -= step;
                    tryCompress();
                }
            }, 'image/jpeg', quality);
        };

        tryCompress();
    }

    // 📝 Generar nombre único
    generateFileName(file, ticketId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const extension = file.name.split('.').pop();
        
        return `comprobantes/${ticketId}_${timestamp}_${random}.${extension}`;
    }

    // 🔗 Obtener URL pública
    getPublicUrl(fileName) {
        const { data } = this.supabase.storage
            .from(this.config.BUCKET)
            .getPublicUrl(fileName);
        
        return data.publicUrl;
    }

    // 🗑️ Eliminar archivo
    async deleteFile(fileName) {
        try {
            const { error } = await this.supabase.storage
                .from(this.config.BUCKET)
                .remove([fileName]);

            if (error) throw error;

            window.LAMUBI_UTILS.debugLog('File deleted successfully', { fileName });
            return { success: true };

        } catch (error) {
            console.error('❌ Error deleting file:', error);
            return { success: false, error: error.message };
        }
    }

    // 📊 Obtener información de archivo
    async getFileInfo(fileName) {
        try {
            const { data, error } = await this.supabase.storage
                .from(this.config.BUCKET)
                .list('', {
                    limit: 100,
                    offset: 0,
                    search: fileName
                });

            if (error) throw error;

            const fileInfo = data.find(file => file.name === fileName);
            
            return {
                success: true,
                fileInfo: fileInfo || null
            };

        } catch (error) {
            console.error('❌ Error getting file info:', error);
            return { success: false, error: error.message };
        }
    }

    // 📋 Formatear tamaño de archivo
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 📊 Obtener estadísticas del bucket
    async getBucketStats() {
        try {
            const { data, error } = await this.supabase.storage
                .from(this.config.BUCKET)
                .list('', {
                    limit: 1000,
                    offset: 0
                });

            if (error) throw error;

            const stats = {
                totalFiles: data.length,
                totalSize: data.reduce((acc, file) => acc + file.metadata.size, 0),
                fileTypes: {}
            };

            // Agrupar por tipo de archivo
            data.forEach(file => {
                const extension = file.name.split('.').pop().toLowerCase();
                stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;
            });

            return {
                success: true,
                stats
            };

        } catch (error) {
            console.error('❌ Error getting bucket stats:', error);
            return { success: false, error: error.message };
        }
    }
}

// 🎯 Instancia global
const supabaseStorage = new SupabaseStorage();

// 🎯 Exportar para uso global
window.SupabaseStorage = supabaseStorage;

window.LAMUBI_UTILS.debugLog('Supabase Storage system loaded');
