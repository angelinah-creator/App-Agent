// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();


// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.useGlobalPipes(new ValidationPipe({ 
//     whitelist: true,
//     forbidNonWhitelisted: true
//   }));
//   await app.listen(process.env.PORT || 3000);
//   console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
// }
// bootstrap();



import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation globale DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Activer CORS pour le frontend
  app.enableCors({
    origin: 'http://localhost:3000', // ton front
    credentials: true,               // si tu envoies cookies
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();