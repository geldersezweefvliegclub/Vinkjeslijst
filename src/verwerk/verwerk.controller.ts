import {Body, Controller, HttpCode, Get, Param, HttpStatus, Logger} from '@nestjs/common';
import { VerwerkDto } from './dto/verwerk.dto';
import {myResponse, VerwerkService} from './verwerk.service';
import fs from "node:fs";
import {GoogleService} from "../google/google.service";
import {LedenService} from "../helios/services/leden.service";
import {LoginService} from "../helios/services/login.service";

@Controller()
export class VerwerkController
{
   private readonly logger = new Logger(VerwerkController.name);

   sheets: VerwerkDto[] = []
  constructor(private readonly google: GoogleService,
              private loginService: LoginService,
              private ledenService: LedenService,
              private readonly svc: VerwerkService) {
     const fileContent = fs.readFileSync(process.env.GOOGLE_SHEETS_CONFIG!, "utf-8");
     this.sheets = JSON.parse(fileContent);
  }

  @Get('zetProgressie')
  @HttpCode(200)
  async process(): Promise<any> {
     var response : myResponse[] = [];

     await this.loginService.login();
     const leden = await this.ledenService.getLeden();

     for (const sheet of this.sheets)
     {
        this.logger.verbose(`Processing sheet ${sheet.naam} (${sheet.spreadsheetId})...`);
        const r = await this.svc.sheet2Vinkje(leden, sheet);
        r.naam = sheet.naam;

        response.push(r);
     }
     return response;
  }

   @Get('stuurEmail')
   @HttpCode(200)
   async stuurEmail(): Promise<any> {
      await this.google.sendEmail({to: "richard@jnkr.eu", subject: "test email", bodyText: "Hello World!"});
   }
}
