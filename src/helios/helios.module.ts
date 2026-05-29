import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {LoginService} from "./services/login.service";
import {APIService} from "./services/api.service";
import {LedenService} from "./services/leden.service";
import {ProgressieService} from "./services/progressie.service";
import {StorageService} from "./services/storage.service";

@Module({
  imports: [HttpModule],
  providers: [APIService, LoginService, LedenService, ProgressieService, StorageService],
  exports: [LoginService, LedenService, ProgressieService],
})
export class HeliosModule {}