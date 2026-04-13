import { Module } from '@nestjs/common';
import { VerwerkService } from './verwerk.service';
import { VerwerkScheduler } from './verwerk.scheduler';
import { GoogleModule } from '../google/google.module';
import { HeliosModule } from '../helios/helios.module';

@Module({
  imports: [GoogleModule, HeliosModule],
  providers: [VerwerkService, VerwerkScheduler]
})
export class VerwerkModule {}

