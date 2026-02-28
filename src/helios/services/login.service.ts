import {Base64} from 'js-base64';
import {APIService} from   "./api.service";
import { HELIOS_CREDENTIAL_FILE } from "./api.service";
import {Injectable} from "@nestjs/common";
import { createHash } from "crypto";
import fs from "node:fs";

interface BearerToken {
    TOKEN: string;
}

@Injectable()
export class LoginService  {
    isLoggedIn: boolean = false;

    constructor(private readonly apiService: APIService) { }

    async login(): Promise<boolean> {
        const HeliosConfig = fs.existsSync(HELIOS_CREDENTIAL_FILE) ? JSON.parse(fs.readFileSync(HELIOS_CREDENTIAL_FILE,{encoding: 'utf8'})) : undefined
        const gebruikersnaam = HeliosConfig.username;
        const wachtwoord = HeliosConfig.password;
        const bypassToken = this.dayOfYear() + HeliosConfig.token;

        const token = createHash("sha1").update(HeliosConfig.token + wachtwoord, "utf8").digest("hex");

        const headers = new Headers(
            {
                'Authorization': 'Basic ' + Base64.encode(`${gebruikersnaam}:${wachtwoord}`)
            });

        let params: any;
        if ((token) && (token !== "")) {
            params = {'token': token as string}
        }

        const response: Response = await this.apiService.get('Login/Login', params, headers);

        if (response.ok) {
            const login: BearerToken = await response.json();
            this.apiService.setBearerToken(login.TOKEN);
            this.isLoggedIn = true;
            return true;
        }
        return false;
    }

    // Haal nieuw token op zodat de sessie alive blijft
    async relogin(): Promise<boolean> {
        try {
            const response: Response = await this.apiService.get('Login/Relogin');
            if (response.ok) {
                const login: BearerToken = await response.json();

                this.apiService.setBearerToken(login.TOKEN);
                this.isLoggedIn = true;
            }
        }
        catch (e) {
            this.apiService.setBearerToken();
            this.isLoggedIn = false;
            return false;
        }
        return true;
    }

    isIngelogd(): boolean {
        return this.isLoggedIn;
    }

   private dayOfYear(date: Date = new Date()): number {
      const start = new Date(date.getFullYear(), 0, 1);
      const diff = date.getTime() - start.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
   }
}
