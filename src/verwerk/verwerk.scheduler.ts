import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VerwerkDto } from './dto/verwerk.dto';
import { myResponse, VerwerkService } from './verwerk.service';
import fs from 'node:fs';
import { GoogleService } from '../google/google.service';
import { LedenService } from '../helios/services/leden.service';
import { LoginService } from '../helios/services/login.service';

@Injectable()
export class VerwerkScheduler {
  private readonly logger = new Logger(VerwerkScheduler.name);
  private sheets: VerwerkDto[] = [];
  private isInitialized = false;

  constructor(
    private readonly google: GoogleService,
    private loginService: LoginService,
    private ledenService: LedenService,
    private readonly svc: VerwerkService,
  ) {
    this.initializeSheets();
  }

  private initializeSheets() {
    try {
      const fileContent = fs.readFileSync(process.env.GOOGLE_SHEETS_CONFIG!, 'utf-8');
      this.sheets = JSON.parse(fileContent);
      this.isInitialized = true;
      this.logger.log(`Initialized with ${this.sheets.length} sheets`);
    } catch (error) {
      this.logger.error('Failed to initialize sheets configuration', error);
      this.isInitialized = false;
    }
  }

  @Cron(process.env.CRON_VLUCHT_GEEN_MEDICAL || '* 6-23 * 1-10 *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async processProgressie() {
    if (!this.isInitialized || this.sheets.length === 0) {
      this.logger.warn('Scheduler not ready or no sheets configured');
      return;
    }

    try {
      this.logger.verbose('Starting scheduled process...');
      const response: myResponse[] = [];

      await this.loginService.login();
      const leden = await this.ledenService.getLeden();

      for (const sheet of this.sheets) {
        this.logger.verbose(`Processing sheet ${sheet.naam} (${sheet.spreadsheetId})...`);
        const r = await this.svc.sheet2Vinkje(leden, sheet);
        r.naam = sheet.naam;
        response.push(r);
      }

      this.logger.debug(`Scheduled process completed. Results: ${JSON.stringify(response)}`);
    } catch (error) {
      this.logger.error('Error during scheduled process', error);
    }
  }
}

