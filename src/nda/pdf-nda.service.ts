import { Injectable } from '@nestjs/common';
import { UserDocument } from '../users/schemas/user.schema';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as puppeteer from 'puppeteer';
import axios from 'axios';

@Injectable()
export class PdfNdaService {
  
  async generateNda(user: UserDocument): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    
    try {
      // 1. Lire le template EJS
      const templatePath = path.join(__dirname, 'templates', 'nda-template.ejs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // 2. Convertir les logos en base64 (optionnel)
      const logo1Base64 = await this.imageToBase64('logo1.png');
      const signBase64 = await this.imageToBase64('sign.png');
      
      // 3. Télécharger la signature de l'utilisateur
      const userSignatureBase64 = await this.urlToBase64(user.signatureUrl);

      // 4. Rendre le template avec les données
      const htmlContent = ejs.render(templateContent, { 
        user,
        logo1Base64,
        signBase64,
        userSignatureBase64,
        currentDate: new Date().toLocaleDateString('fr-FR'),
        ndaNumber: this.generateNdaNumber()
      });

      // 5. Lancer Puppeteer et générer le PDF
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '25mm', right: '25mm', bottom: '25mm', left: '25mm' }
      });

      return pdfBuffer as Buffer;

    } catch (error) {
      throw new Error(`Erreur lors de la génération du NDA: ${(error as Error).message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async imageToBase64(imageName: string): Promise<string> {
    try {
      const imagePath = path.join(__dirname, 'templates', 'images', imageName);
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const extension = path.extname(imageName).toLowerCase();
      
      let mimeType = 'image/png';
      if (extension === '.jpg' || extension === '.jpeg') {
        mimeType = 'image/jpeg';
      }
      
      return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.warn(`Logo ${imageName} non trouvé`);
      return '';
    }
  }

  private async urlToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      const contentType = response.headers['content-type'] || 'image/png';
      
      return `data:${contentType};base64,${base64Image}`;
      
    } catch (error) {
      console.error('Erreur lors du téléchargement de la signature:', error.message);
      return '';
    }
  }

  private generateNdaNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `NDA-${timestamp}-${random}`;
  }
}