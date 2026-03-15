import {HttpCode, HttpStatus, Injectable} from '@nestjs/common';
import {GoogleService} from '../google/google.service';
import {HeliosService} from '../helios/helios.service';
import {VerwerkDto} from "./dto/verwerk.dto";
import {LoginService} from "../helios/services/login.service";
import {LedenService} from "../helios/services/leden.service";
import {ProgressieService} from "../helios/services/progressie.service";
import * as fs from "node:fs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export interface myResponse
{
   code: string;
   bericht: string;
   details: string[];
}

@Injectable()
export class VerwerkService
{
   constructor(
      private readonly google: GoogleService,
      private readonly helios: HeliosService,
      private loginService: LoginService,
      private ledenService: LedenService,
      private progessieService: ProgressieService
   )
   {
   }

   private sleep(ms: number)
   {
      return new Promise((r) => setTimeout(r, ms));
   }

   async sheet2Vinkje(input: VerwerkDto): Promise<any>
   {
      const tabTitle = input.tabName || await this.google.getFirstTabTitle(input.spreadsheetId);

      if (tabTitle === undefined)
      {
         const response: myResponse =
            {
               code: HttpStatus.FAILED_DEPENDENCY.toString(),
               bericht: 'Tabblad is onbekend',
               details: ['tabTitle === undefined'],
            }
         return response;
      }

      const rows: number = await this.google.getRows(input.spreadsheetId, tabTitle)
      if (rows === undefined)
      {
         const response: myResponse =
            {
               code: HttpStatus.FAILED_DEPENDENCY.toString(),
               bericht: 'Aantal rijen is onbekend',
               details: ['rows === undefined'],
            }
         return response;
      }

      if (rows <= 1)    // rij 1 = headers
      {
         const response: myResponse =
            {
               code: HttpStatus.CONTINUE.toString(),
               bericht: 'Geen data te verwerken',
               details: ['rows <= 1'],
            }
         return response;
      }

      const emailRange = `${input.emailKolom}2:${input.emailKolom}${rows}`;
      const emailArray = await this.google.getCells(input.spreadsheetId, tabTitle, emailRange);

      if (emailArray === undefined)
      {
         const response: myResponse =
            {
               code: HttpStatus.FAILED_DEPENDENCY.toString(),
               bericht: 'Geen data te verwerken',
               details: [`emailArray === undefined, range=${emailRange}`]
            }
         return response;
      }

      const statusRange = `${input.statusKolom}2:${input.statusKolom}${rows}`;
      const statusArray = await this.google.getCells(input.spreadsheetId, tabTitle, statusRange);

      const scoreRange = (input.scoreKolom === undefined) ? undefined :  `${input.scoreKolom}2:${input.scoreKolom}${rows}`;
      const scoreArray = (scoreRange === undefined) ? undefined : await this.google.getCells(input.spreadsheetId, tabTitle, scoreRange);

      await this.loginService.login();
      const leden = await this.ledenService.getLeden();

      // logo tbv uitsturen email.
      const base64img = fs.readFileSync('./templates/gezc-logo.png', {encoding: 'base64'});

      var response: myResponse = {
         code: HttpStatus.OK.toString(),
         bericht: "",
         details: []
      }
      var aantalVerwerkt: number = 0;
      for (var row = 0; row < emailArray!.length; row++)
      {
         if (statusArray && statusArray![row])
         {
            const status = statusArray![row][0];

            if (status !== undefined)
               continue;                    // is al eerder verwerkt, dus overslaan
         }

         const email = emailArray![row][0];
         console.log(`cel: ${input.emailKolom}${row + 1}  email=${email}`);

         if (!email)
         {
            const msg = `Geen email op rij ${row+1}`
            console.log(msg);
            response.details.push(msg);
            await this.google.setCell(input.spreadsheetId, tabTitle, input.statusKolom, row + 2, "Geen email");
            continue;
         }

         if (!emailRegex.test(email))
         {
            const msg = `Geen correct email adres op rij ${row + 1}`
            console.log(msg);
            response.details.push(msg);
            console.log(`Onjuist email formaat, cel:${input.emailKolom}${row + 1} :${email}`);
            continue;
         }

         var errorMsg: { log: string, msg: string } | undefined = undefined;
         const lid = leden.filter((l: any) => l.EMAIL.toLowerCase() === email.toLowerCase());    // zoek het lid op in het leden array

         var html = "";
         switch (lid.length)
         {
            case 0:
            {
               errorMsg = {
                  log: `Geen lid gevonden, cel:${input.emailKolom}${row + 1} :${email}`,
                  msg: `Geen lid gevonden`
               }
               html = fs.readFileSync('./templates/geen-lid.html', 'utf8');
               html = html.replaceAll(/\{base64img\}/g, base64img);
               html = html.replaceAll(/\{naam\}/g, input.naam);

               break;
            }
            case 1:
            {
               // dis is wat we willen
               const progressie: any = await this.progessieService.getLidProgressie(lid[0].ID)

               const idx = progressie.findIndex((c: any) => c.COMPETENTIE_ID === input.competentie);
               if (idx !== -1)
               {
                  errorMsg = {
                     log: `Lid heeft al progressie cel:${input.emailKolom}${row + 1} :${email} ${progressie[idx].ID}`,
                     msg: `Lid heeft al progressie ${progressie[idx].ID}`,
                  }

                  html = fs.readFileSync('./templates/al-gedaan.html', 'utf8');
                  html = html.replaceAll(/\{base64img\}/g, base64img);
                  html = html.replaceAll(/\{naam\}/g, input.naam);
                  html = html.replaceAll(/\{id\}/g, progressie[idx].ID);
               }
               else if (scoreArray && scoreArray![row]) // controleer of de scoore voldoende is
               {
                  var [score,max] = scoreArray[row][0].split(' / ');
                  const goed = score ? parseInt(score) : 0;

                  if (goed < input.minScore)
                  {
                     errorMsg = {
                        log: `Score onvoldoende cel:${input.emailKolom}${row + 1} : ${statusArray![row][0]}`,
                        msg: `Score onvoldoende`,
                     }

                     html = fs.readFileSync('./templates/onvoldoende.html', 'utf8');
                     html = html.replaceAll(/\{base64img\}/g, base64img);
                     html = html.replaceAll(/\{naam\}/g, input.naam);
                     html = html.replaceAll(/\{goed\}/g, score);
                     html = html.replaceAll(/\{goed\}/g, max);
                  }
               }
               break;
            }
            default:
            {
               errorMsg = {
                  log: `Teveel leden gevonden cel:${input.emailKolom}${row + 1} :${email} ` + lid.map((l: any) => l.ID).join(","),
                  msg: `Teveel leden gevonden ` + lid.map((l: any) => l.ID).join(",")
               }

               html = fs.readFileSync('./templates/meerdere-leden.html', 'utf8');
               html = html.replaceAll(/\{base64img\}/g, base64img);
               html = html.replaceAll(/\{naam\}/g, input.naam);
            }
         }

         try
         {
            if (errorMsg)
            {
               await this.google.setCell(input.spreadsheetId, tabTitle, input.statusKolom, row + 2, errorMsg.msg);
               console.log(errorMsg.log);
               response.details.push(errorMsg.log);
            }
            else
            {
               // update helios
               aantalVerwerkt++;
               const record = await this.progessieService.setProgressie(lid[0].ID, input.competentie)
               await this.google.setCell(input.spreadsheetId, tabTitle, input.statusKolom, row + 2, "ID=" + record.ID);

               response.details.push(`progressie gezet ${email} ${record.ID}`);

               html = fs.readFileSync('./templates/success.html', 'utf8');
               html = html.replaceAll(/\{base64img\}/g, base64img);
               html = html.replaceAll(/\{naam\}/g, input.naam);
               html = html.replaceAll(/\{id\}/g, record.ID);
            }

            await this.google.sendEmail({to: email, subject: input.naam, bodyText: html})
         }
         catch (e)
         {
            console.log(e)
         }
         await this.sleep(1000);
      }
      response.bericht = `${aantalVerwerkt} items verwerkt`
      response.code = HttpStatus.OK.toString()

      return response;
   }
}