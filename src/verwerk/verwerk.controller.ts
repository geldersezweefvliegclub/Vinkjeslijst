import {Body, Controller, HttpCode, Get, Param, HttpStatus} from '@nestjs/common';
import { VerwerkDto } from './dto/verwerk.dto';
import {myResponse, VerwerkService} from './verwerk.service';
import fs from "node:fs";
import {GoogleService} from "../google/google.service";

@Controller()
export class VerwerkController
{
   sheets: VerwerkDto[] = []
  constructor(private readonly google: GoogleService,
              private readonly svc: VerwerkService) {
     const fileContent = fs.readFileSync(process.env.GOOGLE_SHEETS_CONFIG!, "utf-8");
     this.sheets = JSON.parse(fileContent);
  }

  @Get('zetProgressie')
  @HttpCode(200)
  async process(): Promise<any> {
     var response : myResponse[] = [];

     for (const sheet of this.sheets)
     {
        console.log(sheet.naam)
        const r = await this.svc.sheet2Vinkje(sheet);
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
