import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {firstValueFrom, Observable} from 'rxjs';

@Injectable()
export class HeliosService {
  constructor(private readonly http: HttpService) {
    console.log("HELIOS_CREDENTIAL_FILE:", process.env.HELIOS_CREDENTIAL_FILE);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async postEmailWithRetry(email: string, maxRetries = 5) {
    const url = 'https://helios.gezc.org/setEmail';
    let attempt = 0;
    while (true) {
      try {
        const res = await firstValueFrom(
          this.http.post(url, { email }, { timeout: 15000 })
        );
        return {
          ok: true,
          status: res.status,
          data: res.data ?? null
        };
      } catch (err: any) {
        attempt++;
        const status = err?.response?.status;
        const retriable =
          !status || (status >= 500 && status < 600) || status === 429 ||
          err?.code === 'ECONNABORTED' || err?.code === 'ENOTFOUND';

        if (!retriable || attempt > maxRetries) {
          return {
            ok: false,
            status: status ?? err?.code ?? 'unknown',
            error: err?.message || 'request failed'
          };
        }

        const delayMs = Math.min(30000, 1000 * Math.pow(2, attempt));
        await this.sleep(delayMs);
      }
    }
  }
}