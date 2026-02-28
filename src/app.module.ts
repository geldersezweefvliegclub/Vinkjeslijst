import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { VerwerkModule } from './verwerk/verwerk.module';
import { GoogleModule } from './google/google.module';
import { HeliosModule } from './helios/helios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        GOOGLE_CREDENTIALS: Joi.string().optional(),
        GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional()
      })
    }),
    GoogleModule,
    HeliosModule,
    VerwerkModule
  ]
})
export class AppModule {}