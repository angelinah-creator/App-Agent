import { Injectable } from '@nestjs/common';
import { UserDocument } from '../users/schemas/user.schema';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as puppeteer from 'puppeteer';
import axios from 'axios';

@Injectable()
export class PdfService {
  
  async generateStagiaireContract(user: UserDocument): Promise<Buffer> {
    return this.generatePdfFromTemplate('contract-stagiaire.ejs', user);
  }

  async generatePrestataireContract(user: UserDocument): Promise<Buffer> {
    return this.generatePdfFromTemplate('contract-prestataire.ejs', user);
  }

  private async generatePdfFromTemplate(templateName: string, user: UserDocument): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    
    try {
      // 1. Lire le template EJS
      const templatePath = path.join(__dirname, 'templates', templateName);
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // 2. Convertir les logos en base64
      const logo1Base64 = await this.imageToBase64('logo1.png');
      const logo2Base64 = await this.imageToBase64('logo2.png');
      const signBase64 = await this.imageToBase64('sign.png');
      
      // 3. NOUVEAU : Télécharger et convertir la signature de l'utilisateur
      const userSignatureBase64 = await this.urlToBase64(user.signatureUrl);

      // 4. Rendre le template avec les données
      const htmlContent = ejs.render(templateContent, { 
        user,
        logo1Base64,
        logo2Base64,
        signBase64,
        userSignatureBase64
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
      throw new Error(`Erreur lors de la génération du PDF: ${(error as Error).message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Convertir une image locale en base64
   */
  private async imageToBase64(imageName: string): Promise<string> {
    try {
      const imagePath = path.join(__dirname, 'templates', 'images', imageName);
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const extension = path.extname(imageName).toLowerCase();
      
      let mimeType = 'image/png';
      if (extension === '.jpg' || extension === '.jpeg') {
        mimeType = 'image/jpeg';
      } else if (extension === '.svg') {
        mimeType = 'image/svg+xml';
      }
      
      return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.warn(`Logo ${imageName} non trouvé, utilisation d'un placeholder`);
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjM0YyMTdDIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTIiPkxPR088L3RleHQ+Cjwvc3ZnPgo=';
    }
  }

  /**
   * NOUVELLE MÉTHODE : Télécharger une image depuis une URL et la convertir en base64
   */
  private async urlToBase64(imageUrl: string): Promise<string> {
    try {
      console.log('Téléchargement de la signature depuis:', imageUrl);
      
      // Télécharger l'image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000, // Timeout de 10 secondes
      });

      // Convertir en base64
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      
      // Déterminer le MIME type depuis les headers ou l'URL
      const contentType = response.headers['content-type'] || 'image/png';
      
      console.log('Signature téléchargée et convertie en base64');
      return `data:${contentType};base64,${base64Image}`;
      
    } catch (error) {
      console.error('Erreur lors du téléchargement de la signature:', (error as Error).message);
      // Retourner un placeholder en cas d'erreur
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5TaWduYXR1cmUgbm9uIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';
    }
  }
}