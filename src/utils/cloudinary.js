/**
 * Cloudinary Direct Upload Utility for Lydia Global Exim
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'n5l3h5gf';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'lydia_jewelry_uploads';

/**
 * Upload an image file (File or Blob or Base64) to Cloudinary
 * @param {File|Blob|string} file
 * @param {string} folder Optional folder name
 * @returns {Promise<string>} Secure URL of uploaded image
 */
export async function uploadImageToCloudinary(file, folder = 'lydia_catalog') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
