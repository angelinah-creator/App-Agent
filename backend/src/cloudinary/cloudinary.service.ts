import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  // Nouvelle méthode pour uploader des images (photos d'espaces)
  async uploadImage(
    buffer: Buffer,
    fileName: string,
    folder: string = 'agent_code_talent/spaces',
  ): Promise<{ url: string; publicId: string }> {
    console.log('Upload Image:', { fileName, folder });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: folder,
          public_id: fileName.replace(/\.[^/.]+$/, ''),
          access_mode: 'public',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
            { quality: 'auto:good' },
            { format: 'webp' }
          ],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            console.error('Erreur Cloudinary image upload:', error);
            reject(new Error(`Cloudinary image upload error: ${error.message}`));
          } else if (result) {
            console.log('Upload Image Cloudinary réussi:', result.public_id);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(
              new Error('Cloudinary image upload failed: No result and no error'),
            );
          }
        },
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  // Méthode pour supprimer une image
  async deleteImage(publicId: string): Promise<void> {
    try {
      console.log('Suppression Image Cloudinary:', publicId);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary image delete failed: ${result.result}`);
      }

      console.log('Suppression Image Cloudinary réussie');
    } catch (error) {
      console.error('Erreur suppression image Cloudinary:', error);
      throw error;
    }
  }

  // Méthode pour uploader des PDF avec resource_type: "raw"
  async uploadPdf(
    buffer: Buffer,
    fileName: string,
  ): Promise<{ url: string; publicId: string }> {
    console.log('Upload PDF brut:', fileName);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'agent_code_talent/contracts',
          public_id: fileName.replace('.pdf', ''),
          access_mode: 'public',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            console.error('Erreur Cloudinary:', error);
            reject(new Error(`Cloudinary upload error: ${error.message}`));
          } else if (result) {
            console.log('Upload PDF Cloudinary réussi:', result.public_id);
            console.log('URL Cloudinary:', result.secure_url);

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(
              new Error('Cloudinary upload failed: No result and no error'),
            );
          }
        },
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<{ url: string; publicId: string }> {
    console.log('Upload File:', { fileName, contentType });

    const resourceType = this.getResourceType(contentType);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'agent_code_talent/documents',
          resource_type: resourceType,
          public_id: fileName.replace(/\.[^/.]+$/, ''),
          access_mode: 'public',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            console.error('Erreur Cloudinary:', error);
            reject(new Error(`Cloudinary upload error: ${error.message}`));
          } else if (result) {
            console.log('Upload Cloudinary réussi:', result.public_id);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(
              new Error('Cloudinary upload failed: No result and no error'),
            );
          }
        },
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      console.log('Suppression Cloudinary:', publicId);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
        invalidate: true,
      });

      if (result.result !== 'ok') {
        throw new Error(`Cloudinary delete failed: ${result.result}`);
      }

      console.log('Suppression Cloudinary réussie');
    } catch (error) {
      console.error('Erreur suppression Cloudinary:', error);
      throw error;
    }
  }

  async getFileUrl(publicId: string): Promise<string> {
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
    });
  }

  async fileExists(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'raw',
      });
      return !!result;
    } catch (error) {
      return false;
    }
  }

  async uploadVideo(
    buffer: Buffer,
    fileName: string,
    folder: string = 'agent_code_talent/videos',
  ): Promise<{
    url: string;
    publicId: string;
    duration?: number;
    format?: string;
  }> {
    console.log('Upload Video:', fileName);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: folder,
          public_id: fileName.replace(/\.[^/.]+$/, ''),
          access_mode: 'public',
          chunk_size: 6000000,
          eager: [
            { width: 640, height: 360, crop: 'limit' },
          ],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            console.error('Erreur Cloudinary video upload:', error);
            reject(
              new Error(`Cloudinary video upload error: ${error.message}`),
            );
          } else if (result) {
            console.log('Upload Video Cloudinary réussi:', result.public_id);
            console.log('Video URL:', result.secure_url);
            console.log('Video Duration:', result.duration);

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              duration: result.duration,
              format: result.format,
            });
          } else {
            reject(
              new Error(
                'Cloudinary video upload failed: No result and no error',
              ),
            );
          }
        },
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteVideo(publicId: string): Promise<void> {
    try {
      console.log('Suppression Video Cloudinary:', publicId);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
        invalidate: true,
      });

      if (result.result !== 'ok') {
        throw new Error(`Cloudinary video delete failed: ${result.result}`);
      }

      console.log('Suppression Video Cloudinary réussie');
    } catch (error) {
      console.error('Erreur suppression video Cloudinary:', error);
      throw error;
    }
  }

  async getVideoUrl(publicId: string, transformations?: any): Promise<string> {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      secure: true,
      ...transformations,
    });
  }

  async getVideoThumbnail(publicId: string): Promise<string> {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      secure: true,
      transformation: [
        { width: 300, height: 200, crop: 'fill' },
        { quality: 'auto' },
        { format: 'jpg' },
      ],
    });
  }

  async videoExists(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'video',
      });
      return !!result;
    } catch (error) {
      return false;
    }
  }

  private getResourceType(contentType: string): 'image' | 'raw' | 'video' | 'auto' {
    if (contentType.startsWith('image/')) {
      return 'image';
    } else if (contentType.startsWith('video/')) {
      return 'video';
    } else if (contentType === 'application/pdf') {
      return 'raw';
    } else {
      return 'auto';
    }
  }
}