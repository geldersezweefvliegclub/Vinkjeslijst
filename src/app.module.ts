import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { VerwerkModule } from './verwerk/verwerk.module';
import { GoogleModule } from './google/google.module';
import { HeliosModule } from './helios/helios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        GOOGLE_CREDENTIALS: Joi.string().optional(),
        GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional(),
        GOOGLE_SHEETS_CONFIG: Joi.string().required()
      })
    }),
    ScheduleModule.forRoot(),
    GoogleModule,
    HeliosModule,
    VerwerkModule
  ]
})
export class AppModule {}