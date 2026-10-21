import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(
    (helmet as any).default({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global prefix for API
  app.setGlobalPrefix('api');

  // Serve Frontend SPA if built and placed in client folder
  const possiblePaths = [
    join(__dirname, '..', 'client'),
    join(__dirname, 'client'),
    join(process.cwd(), 'client'),
    join(process.cwd(), '..', 'dist'),
  ];
  let publicPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(join(p, 'index.html'))) {
      publicPath = p;
      break;
    }
  }

  if (publicPath) {
    console.log(`📦 Serving Frontend UI from: ${publicPath}`);
    app.use(express.static(publicPath));
    app.use((req: any, res: any, next: any) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
        return res.sendFile(join(publicPath, 'index.html'));
      }
      next();
    });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 ATK Light Server running on http://0.0.0.0:${port}`);
}

void bootstrap();
