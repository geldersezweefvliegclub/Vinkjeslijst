import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console


  console.log(`Server listening on port ${port}`);
  console.log("Settings:");
  console.log("VERZENDEN_EMAIL:", process.env.VERZENDEN_EMAIL ? 'true' : 'false');
  console.log("GOOGLE_PROJECT_ID:", process.env.GOOGLE_PROJECT_ID);
  console.log("GOOGLE_ADMIN_EMAIL:", process.env.GOOGLE_ADMIN_EMAIL);
  console.log("GOOGLE_CREDENTIALS_PATH:", process.env.GOOGLE_CREDENTIALS_PATH);
  console.log("GOOGLE_SHEETS_CONFIG:", process.env.GOOGLE_SHEETS_CONFIG);
  console.log("HELIOS_CREDENTIAL_FILE:", process.env.HELIOS_CREDENTIAL_FILE);
}
bootstrap();