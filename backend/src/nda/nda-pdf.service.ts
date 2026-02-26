// backend/src/nda/nda-pdf.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserDocument } from '../users/schemas/user.schema';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as puppeteer from 'puppeteer';
import axios from 'axios';

@Injectable()
export class NdaPdfService {
  private readonly logger = new Logger(NdaPdfService.name);

  async generateNda(
    user: UserDocument, 
    ndaNumber: string
  ): Promise<Buffer> {
    return this.generatePdfFromTemplate('nda.ejs', user, ndaNumber);
  }

  private async generatePdfFromTemplate(
    templateName: string,
    user: UserDocument,
    ndaNumber: string,
  ): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    
    try {
      // 1. Récupérer le chemin du template avec plusieurs fallbacks
      const templatePath = await this.findTemplatePath(templateName);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      this.logger.log(`✅ Template chargé: ${templatePath}`);

      // 2. Convertir les logos en base64
      const logo1Base64 = await this.imageToBase64('logo1.png');
      const logo2Base64 = await this.imageToBase64('logo2.png');
      const signBase64 = await this.imageToBase64('sign.png');
      
      // 3. Télécharger et convertir la signature de l'utilisateur
      let userSignatureBase64: string;
      
      if (user.signature?.url) {
        const signature = await this.urlToBase64(user.signature.url);
        userSignatureBase64 = signature ?? this.getDefaultSignature();
      } else {
        userSignatureBase64 = this.getDefaultSignature();
      }

      // 4. Préparer les dates formatées
      const today = new Date();
      const signatureDate = today.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      const generationDate = today.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // 5. Rendre le template avec les données
      const htmlContent = ejs.render(templateContent, { 
        user,
        ndaNumber,
        logo1Base64,
        logo2Base64,
        signBase64,
        userSignatureBase64,
        signatureDate,
        generationDate
      });

      // 6. Lancer Puppeteer et générer le PDF
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1240, height: 1754 });
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { 
          top: '0mm', 
          right: '0mm', 
          bottom: '0mm', 
          left: '0mm' 
        },
        preferCSSPageSize: true,
      });

      return pdfBuffer as Buffer;

    } catch (error) {
      this.logger.error(`Erreur lors de la génération du PDF NDA: ${error.message}`, error.stack);
      throw new Error(`Erreur lors de la génération du PDF NDA: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Trouver le chemin du template avec plusieurs fallbacks
   */
  private async findTemplatePath(templateName: string): Promise<string> {
    // Noms de dossier possibles (singulier/pluriel)
    const possibleFolderNames = ['nda', 'ndas'];
    
    // Chemins possibles (développement et production)
    const possibleBasePaths = [
      path.join(__dirname, 'templates'),                    // dist/src/nda/templates
      path.join(__dirname, '..', 'templates'),             // dist/src/templates
      path.join(process.cwd(), 'src', 'nda', 'templates'), // src/nda/templates
      path.join(process.cwd(), 'src', 'ndas', 'templates'), // src/ndas/templates
      path.join(process.cwd(), 'dist', 'src', 'nda', 'templates'), // dist/src/nda/templates
      path.join(process.cwd(), 'dist', 'src', 'ndas', 'templates'), // dist/src/ndas/templates
    ];

    // Essayer toutes les combinaisons
    for (const basePath of possibleBasePaths) {
      for (const folderName of possibleFolderNames) {
        // Si le basePath contient déjà le nom du dossier
        if (basePath.includes('nda') || basePath.includes('ndas')) {
          const templatePath = path.join(basePath, templateName);
          try {
            await fs.access(templatePath, fs.constants.R_OK);
            this.logger.log(`Template trouvé: ${templatePath}`);
            return templatePath;
          } catch {
            continue;
          }
        }
        
        // Sinon, ajouter le nom du dossier
        const templatePath = path.join(basePath, templateName);
        try {
          await fs.access(templatePath, fs.constants.R_OK);
          this.logger.log(`Template trouvé: ${templatePath}`);
          return templatePath;
        } catch {
          continue;
        }
      }
    }

    // Si aucun template trouvé, créer un template par défaut en mémoire
    this.logger.warn('Aucun template trouvé, utilisation du template par défaut');
    return this.createDefaultTemplate();
  }

  /**
   * Créer un template par défaut si le fichier n'existe pas
   */
  private async createDefaultTemplate(): Promise<string> {
    const defaultTemplatePath = path.join(process.cwd(), 'temp-nda.ejs');
    
    const defaultTemplate = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Accord de confidentialité - NDA</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #000; border-bottom: 2px solid purple; }
    .signature { margin-top: 50px; }
  </style>
</head>
<body>
  <h1>ACCORD DE CONFIDENTIALITÉ</h1>
  <p>Entre CODE TALENT et <%%= user.nom %> <%%= user.prenoms %></p>
  <p>NDA N°: <%%= ndaNumber %></p>
  <div class="signature">
    <p>Signé le <%%= signatureDate %></p>
  </div>
</body>
</html>`;

    await fs.writeFile(defaultTemplatePath, defaultTemplate);
    return defaultTemplatePath;
  }

  /**
   * Convertir une image locale en base64
   */
  private async imageToBase64(imageName: string): Promise<string> {
    const possiblePaths = [
      path.join(__dirname, 'templates', 'images', imageName),
      path.join(__dirname, '..', 'templates', 'images', imageName),
      path.join(process.cwd(), 'src', 'nda', 'templates', 'images', imageName),
      path.join(process.cwd(), 'src', 'ndas', 'templates', 'images', imageName),
      path.join(process.cwd(), 'dist', 'src', 'nda', 'templates', 'images', imageName),
      path.join(process.cwd(), 'dist', 'src', 'ndas', 'templates', 'images', imageName),
    ];

    for (const imagePath of possiblePaths) {
      try {
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
      } catch {
        continue;
      }
    }

    return this.getDefaultLogo(imageName);
  }

  private getDefaultLogo(imageName: string): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjM0YyMTdDIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTIiPkNEPC90ZXh0Pgo8L3N2Zz4K';
  }

  private async urlToBase64(imageUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        validateStatus: (status) => status === 200,
      });

      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      const contentType = response.headers['content-type'] || 'image/png';
      
      return `data:${contentType};base64,${base64Image}`;
    } catch (error) {
      this.logger.error(`Erreur téléchargement signature: ${error.message}`);
      return null;
    }
  }

  private getDefaultSignature(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IiM2NjYiPlNpZ25hdHVyZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
  }
}