/**
 * Cloudinary Direct Upload and Storage Optimization Utility
 * Handles uploading and deleting image assets on Cloudinary
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

/**
 * Extracts public_id from a Cloudinary URL
 * Example URL: https://res.cloudinary.com/n5l3h5gf/image/upload/v1725189234/lydia_jewelry_uploads/item_abc123.jpg
 * Returns: lydia_jewelry_uploads/item_abc123
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
 * Upload an image or video file directly to Cloudinary
 */
export async function uploadToCloudinary(file) {
  if (!file) return null;

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'n5l3h5gf';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'lydia_jewelry_uploads';
  const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|3gp)$/i.test(file.name || '');
  const resourceType = isVideo ? 'video' : 'auto';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('Cloudinary upload issue, using local object URL fallback:', data.error?.message);
      return URL.createObjectURL(file);
    }

    return data.secure_url || data.url;
  } catch (err) {
    console.error('Cloudinary network error:', err);
    return URL.createObjectURL(file);
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
