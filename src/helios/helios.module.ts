import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HeliosService } from './helios.service';
import {LoginService} from "./services/login.service";
import {APIService} from "./services/api.service";
import {LedenService} from "./services/leden.service";
import {ProgressieService} from "./services/progressie.service";
import {StorageService} from "./services/storage.service";

@Module({
  imports: [HttpModule],
  providers: [HeliosService, APIService, LoginService, LedenService, ProgressieService, StorageService],
  exports: [HeliosService, LoginService, LedenService, ProgressieService],
})
export class HeliosModule {}