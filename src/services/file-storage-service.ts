import { appDataDir } from '@tauri-apps/api/path';
import { mkdir, exists, writeFile, remove, BaseDirectory } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { isDesktop } from '@/utils/platform';

class FileStorageService {
  private readonly PROFILE_DIR = 'profile-images';
  private readonly AVATAR_FILENAME = 'avatar.jpg';

  /**
   * Get the profile images directory path
   */
  async getProfileImagesDir(): Promise<string> {
    const appData = await appDataDir();
    return `${appData}/${this.PROFILE_DIR}`;
  }

  /**
   * Save profile image (resize to 256x256, compress as needed, save as JPEG)
   * @param file Image file to save (any size, will be compressed)
   * @returns Filename of saved image
   */
  async saveProfileImage(file: File): Promise<string> {
    if (!isDesktop()) {
      return this.saveProfileImageBrowser(file);
    }

    // Validate file type only (no size check)
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      throw new Error('Invalid file type. Please upload a JPG, PNG, or WebP image.');
    }

    // Resize and compress image to 256x256, target 500KB max
    const compressedBlob = await this.compressImageToTarget(file);
    const arrayBuffer = await compressedBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Ensure profile images directory exists
    try {
      await mkdir(this.PROFILE_DIR, {
        baseDir: BaseDirectory.AppData,
      });
    } catch (error) {
      // Directory might already exist, which is fine
    }

    const filepath = `${this.PROFILE_DIR}/${this.AVATAR_FILENAME}`;

    // Delete old file if exists
    try {
      const fileExists = await exists(filepath, { baseDir: BaseDirectory.AppData });
      if (fileExists) {
        await remove(filepath, { baseDir: BaseDirectory.AppData });
      }
    } catch (error) {
      // File might not exist, which is fine
    }

    // Write new file
    await writeFile(filepath, uint8Array, {
      baseDir: BaseDirectory.AppData,
    });

    return this.AVATAR_FILENAME;
  }

  /**
   * Get display URL for profile image
   * @param filename Image filename
   * @returns URL or null if file doesn't exist
   */
  async getProfileImageUrl(filename: string): Promise<string | null> {
    if (!isDesktop()) {
      return localStorage.getItem('profile-image-base64');
    }

    try {
      const filepath = `${this.PROFILE_DIR}/${filename}`;
      const fileExists = await exists(filepath, { baseDir: BaseDirectory.AppData });

      if (!fileExists) {
        return null;
      }

      const appData = await appDataDir();
      const fullPath = `${appData}/${this.PROFILE_DIR}/${filename}`;
      return convertFileSrc(fullPath);
    } catch (error) {
      console.error('Error getting profile image URL:', error);
      return null;
    }
  }

  /**
   * Delete profile image
   * @param filename Image filename
   */
  async deleteProfileImage(filename: string): Promise<void> {
    if (!isDesktop()) {
      localStorage.removeItem('profile-image-base64');
      return;
    }

    try {
      const filepath = `${this.PROFILE_DIR}/${filename}`;
      const fileExists = await exists(filepath, { baseDir: BaseDirectory.AppData });

      if (fileExists) {
        await remove(filepath, { baseDir: BaseDirectory.AppData });
      }
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  }

  /**
   * Compress image to target size using progressive quality reduction
   * @param file Image file
   * @param targetSizeKB Target size in KB (default 500KB)
   * @returns Compressed image blob
   */
  private async compressImageToTarget(file: File, targetSizeKB: number = 500): Promise<Blob> {
    const MAX_SIZE = targetSizeKB * 1024;
    const MIN_QUALITY = 0.5;

    // Start with high quality
    let quality = 0.95;
    let result = await this.resizeImageWithQuality(file, quality);

    // If already small enough, return
    if (result.size <= MAX_SIZE) {
      return result;
    }

    // Binary search for optimal quality
    let low = MIN_QUALITY;
    let high = quality;

    while (high - low > 0.05) {
      quality = (low + high) / 2;
      result = await this.resizeImageWithQuality(file, quality);

      if (result.size > MAX_SIZE) {
        high = quality;
      } else {
        low = quality;
      }
    }

    return result;
  }

  /**
   * Resize image to 256x256 with specific quality
   * @param file Image file
   * @param quality JPEG quality (0.0 - 1.0)
   * @returns Resized image blob
   */
  private async resizeImageWithQuality(file: File, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = 256;
        canvas.height = 256;

        // Calculate center crop dimensions
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        // Draw image with center crop
        ctx.drawImage(img, x, y, size, size, 0, 0, 256, 256);

        // Convert to blob with specified quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));

      reader.readAsDataURL(file);
    });
  }


  /**
   * Browser fallback: Save image as base64 in localStorage
   */
  private async saveProfileImageBrowser(file: File): Promise<string> {
    // Validate file type only (no size check)
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      throw new Error('Invalid file type. Please upload a JPG, PNG, or WebP image.');
    }

    // Compress image to target size
    const compressedBlob = await this.compressImageToTarget(file);
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result as string;
        localStorage.setItem('profile-image-base64', base64);
        resolve(this.AVATAR_FILENAME); // Return consistent filename
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(compressedBlob);
    });
  }
}

export const fileStorageService = new FileStorageService();
