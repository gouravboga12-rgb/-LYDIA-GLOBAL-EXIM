/**
 * Cloudinary Direct Upload and Storage Optimization Utility
 * Handles uploading and deleting image and video assets on Cloudinary
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

/**
 * Extracts public_id from a Cloudinary URL
 */
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let pathPart = url.substring(uploadIndex + 8);
    // Strip version prefix like v1725189234/
    pathPart = pathPart.replace(/^v\d+\//, '');
    // Strip file extension (.jpg, .png, .webp, etc.)
    const lastDotIndex = pathPart.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      pathPart = pathPart.substring(0, lastDotIndex);
    }
    return pathPart;
  } catch (e) {
    return null;
  }
}

/**
 * Upload an image or video file directly to Cloudinary with reliable fallbacks
 */
export async function uploadToCloudinary(file) {
  if (!file) return null;

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'n5l3h5gf';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'lydia_jewelry_uploads';
  const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|3gp)$/i.test(file.name || '');
  const resourceType = isVideo ? 'video' : 'image';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (res.ok && (data.secure_url || data.url)) {
      return data.secure_url || data.url;
    }

    console.warn(`Cloudinary ${resourceType} upload error, trying auto endpoint:`, data.error?.message);
    const autoRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData
    });
    const autoData = await autoRes.json();
    if (autoRes.ok && (autoData.secure_url || autoData.url)) {
      return autoData.secure_url || autoData.url;
    }

    // Fallback: Convert to Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.error('Cloudinary network error:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Deletes an image from Cloudinary to optimize storage space
 */
export async function deleteFromCloudinary(urlOrPublicId) {
  if (!urlOrPublicId) return;
  const publicId = urlOrPublicId.includes('http')
    ? extractCloudinaryPublicId(urlOrPublicId)
    : urlOrPublicId;

  if (!publicId) return;

  try {
    const token = localStorage.getItem('token');
    await fetch(`${BACKEND_URL}/admin/cloudinary/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ public_id: publicId, url: urlOrPublicId })
    });
  } catch (err) {
    console.warn('Cloudinary storage cleanup note:', err.message);
  }
}
