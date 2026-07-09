import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Multer memory storage (keeps file buffer in memory)
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'edufin-avatars'
): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary not configured. Generating a mock avatar placeholder URL...');
    // Fallback: Generate a random high-fidelity vector avatar based on date seed
    const mockSeed = Math.random().toString(36).substr(2, 9);
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${mockSeed}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload stream failed:', error);
          return reject(error);
        }
        resolve(result?.secure_url || '');
      }
    );

    uploadStream.end(fileBuffer);
  });
};
