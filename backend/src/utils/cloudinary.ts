import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import fs from 'fs';
import { logger } from './logger';

// Function to configure Cloudinary (can be called multiple times)
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    logger.info('Cloudinary configured successfully');
    return true;
  } else {
    logger.warn('Cloudinary credentials not found. Cloudinary uploads will be disabled.');
    return false;
  }
};

// Try to configure on module load
configureCloudinary();

interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
}

/**
 * Upload image to Cloudinary
 */
export const uploadImageToCloudinary = async (
  filePath: string,
  folder: string = 'lagbe-kichu/products'
): Promise<UploadResult> => {
  try {
    // Re-configure Cloudinary at runtime to ensure env vars are loaded
    if (!configureCloudinary()) {
      throw new Error('Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    console.log(`📂 Uploading to Cloudinary folder: ${folder}`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      overwrite: false, // Don't overwrite existing files
    });

    if (!result || !result.secure_url) {
      throw new Error('Cloudinary upload succeeded but returned no URL');
    }

    console.log(`✅ Cloudinary upload successful!`);
    console.log(`   📁 Folder: ${folder}`);
    console.log(`   🆔 Public ID: ${result.public_id}`);
    console.log(`   🔗 URL: ${result.secure_url}`);
    console.log(`   📦 Size: ${result.bytes} bytes`);
    console.log(`   📐 Dimensions: ${result.width}x${result.height}`);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
    };
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || JSON.stringify(error) || 'Unknown error';
    console.error('Cloudinary upload error details:', {
      message: errorMessage,
      filePath,
      hasCredentials: !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ),
    });
    throw new Error(`Cloudinary upload failed: ${errorMessage}`);
  }
};

/**
 * Upload video to Cloudinary
 */
export const uploadVideoToCloudinary = async (
  filePath: string,
  folder: string = 'lagbe-kichu/products/videos'
): Promise<UploadResult> => {
  try {
    // Re-configure Cloudinary at runtime to ensure env vars are loaded
    if (!configureCloudinary()) {
      throw new Error('Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    console.log(`📂 Uploading video to Cloudinary folder: ${folder}`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'video',
      overwrite: false, // Don't overwrite existing files
    });

    if (!result || !result.secure_url) {
      throw new Error('Cloudinary upload succeeded but returned no URL');
    }

    console.log(`✅ Cloudinary video upload successful!`);
    console.log(`   📁 Folder: ${folder}`);
    console.log(`   🆔 Public ID: ${result.public_id}`);
    console.log(`   🔗 URL: ${result.secure_url}`);
    console.log(`   📦 Size: ${result.bytes} bytes`);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
    };
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || JSON.stringify(error) || 'Unknown error';
    console.error('Cloudinary video upload error details:', {
      message: errorMessage,
      filePath,
      hasCredentials: !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ),
    });
    throw new Error(`Cloudinary upload failed: ${errorMessage}`);
  }
};

/**
 * Upload file buffer directly to Cloudinary (without saving to disk first)
 */
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  mimetype: string,
  folder: string = 'lagbe-kichu/products'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: mimetype.startsWith('video/') ? 'video' : 'image',
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
          });
        }
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(stream);
  });
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

