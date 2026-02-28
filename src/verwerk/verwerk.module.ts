import { Module } from '@nestjs/common';
import { VerwerkController } from './verwerk.controller';
import { VerwerkService } from './verwerk.service';
import { GoogleModule } from '../google/google.module';
import { HeliosModule } from '../helios/helios.module';

@Module({
  imports: [GoogleModule, HeliosModule],
  controllers: [VerwerkController],
  providers: [VerwerkService]
})
export class VerwerkModule
{}