import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Application');

  logger.log('Application started as background worker');
  logger.log('Scheduled task running every minute...');

  // Keep the process alive
  process.on('SIGINT', () => {
    logger.log('Received SIGINT, shutting down gracefully...');
    app.close();
  });

  process.on('SIGTERM', () => {
    logger.log('Received SIGTERM, shutting down gracefully...');
    app.close();
  });
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
