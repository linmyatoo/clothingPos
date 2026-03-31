/**
 * Client-side image compression and format conversion utility.
 *
 * Handles:
 * - HEIC/HEIF files (from iPhones & some Android cameras)
 * - Large images (5MB+ down to ~200-400KB)
 * - Conversion to WebP with JPEG fallback
 * - Preserves aspect ratio while capping dimensions
 */

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.80;

/**
 * Compress and convert an image File to a smaller WebP (or JPEG fallback) File.
 *
 * @param {File} file - The original image file (can be JPEG, PNG, HEIC, etc.)
 * @param {object} [options]
 * @param {number} [options.maxWidth=1200]
 * @param {number} [options.maxHeight=1200]
 * @param {number} [options.quality=0.80] - 0-1, compression quality
 * @param {number} [options.maxSizeKB=800] - Target max file size in KB
 * @returns {Promise<File>} A compressed File object ready for FormData upload
 */
export async function compressImage(file, options = {}) {
    const {
        maxWidth = MAX_WIDTH,
        maxHeight = MAX_HEIGHT,
        quality = QUALITY,
        maxSizeKB = 800,
    } = options;

    // If the file is already small enough and in a web-friendly format, skip compression
    const webFriendly = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (file.size <= maxSizeKB * 1024 && webFriendly.includes(file.type)) {
        return file;
    }

    // Convert HEIC/HEIF to JPEG first if needed (most non-Apple browsers can't decode HEIC)
    let processedFile = file;
    const isHeic = /\.(heic|heif)$/i.test(file.name) ||
        file.type === 'image/heic' || file.type === 'image/heif';

    if (isHeic) {
        try {
            const heic2any = (await import('heic2any')).default;
            const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
            // heic2any may return an array of blobs for multi-frame HEIC; take the first
            const resultBlob = Array.isArray(blob) ? blob[0] : blob;
            processedFile = new File([resultBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (heicErr) {
            console.warn('heic2any conversion failed, trying native decode:', heicErr);
            // Fall through — maybe the browser can handle it natively
        }
    }

    // Load the image into a bitmap
    let bitmap;
    try {
        // Try createImageBitmap first — handles most formats including HEIC on modern browsers
        bitmap = await createImageBitmap(processedFile);
    } catch {
        try {
            // Fallback: load via <img> + object URL (works on more browsers for standard formats)
            bitmap = await loadImageFallback(processedFile);
        } catch {
            // If HEIC and nothing worked in the browser, return the original file.
            // The backend's sharp (libvips) has much better HEIC support and will
            // handle the conversion server-side.
            if (isHeic) {
                console.info('HEIC cannot be processed in this browser. Uploading original for server-side conversion.');
                return file;
            }
            throw new Error(`Cannot load image: ${file.name}. Format may not be supported by this browser.`);
        }
    }

    // Calculate scaled dimensions
    let { width, height } = bitmap;
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    // Draw onto canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Try WebP first, fall back to JPEG if browser doesn't support WebP encoding
    let blob = await canvasToBlob(canvas, 'image/webp', quality);
    let ext = 'webp';
    let mimeType = 'image/webp';

    // Check if browser actually produced WebP (some older browsers silently fall back to PNG)
    if (!blob || blob.type !== 'image/webp') {
        blob = await canvasToBlob(canvas, 'image/jpeg', quality);
        ext = 'jpg';
        mimeType = 'image/jpeg';
    }

    // If still too large, reduce quality iteratively
    let currentQuality = quality;
    while (blob && blob.size > maxSizeKB * 1024 && currentQuality > 0.3) {
        currentQuality -= 0.1;
        blob = await canvasToBlob(canvas, mimeType, currentQuality);
    }

    // Build a File object with a clean filename
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    const newFile = new File([blob], `${baseName}.${ext}`, { type: mimeType });

    // Clean up
    if (typeof bitmap.close === 'function') bitmap.close();

    return newFile;
}

/**
 * Fallback image loader using <img> element + object URL.
 * Returns an object with { width, height } and can be drawn on canvas.
 */
function loadImageFallback(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error(`Cannot load image: ${file.name}. Format may not be supported by this browser.`));
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Promise wrapper for canvas.toBlob
 */
function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => resolve(blob),
            type,
            quality
        );
    });
}
