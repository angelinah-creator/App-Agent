import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
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

  // Méthode pour uploader des PDF avec resource_type: "raw"
  async uploadPdf(buffer: Buffer, fileName: string): Promise<{ url: string; publicId: string }> {
    console.log('Upload PDF brut:', fileName);
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // IMPORTANT: fichier brut
          folder: 'agent_code_talent/contracts',
          public_id: fileName.replace('.pdf', ''),
          access_mode: 'public',
          // Pas de transformation - fichier brut
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('Erreur Cloudinary:', error);
            reject(new Error(`Cloudinary upload error: ${error.message}`));
          } else if (result) {
            console.log('Upload PDF Cloudinary réussi:', result.public_id);
            console.log('URL Cloudinary:', result.secure_url);
            
            resolve({
              url: result.secure_url, // URL directe vers le fichier brut
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Cloudinary upload failed: No result and no error'));
          }
        }
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
    contentType: string
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
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
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
            reject(new Error('Cloudinary upload failed: No result and no error'));
          }
        }
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

  private getResourceType(contentType: string): 'image' | 'raw' | 'auto' {
    if (contentType.startsWith('image/')) {
      return 'image';
    } else if (contentType === 'application/pdf') {
      return 'raw';
    } else {
      return 'auto';
    }
  }
}