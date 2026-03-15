import {Injectable, Logger} from "@nestjs/common";
import {APIService, KeyValueArray} from "./api.service";
import {StorageService} from "./storage.service";
import {LoginService} from "./login.service";


@Injectable()
export class LedenService {
    private readonly logger = new Logger(LedenService.name);
    private ledenCache: any = undefined;     // return waarde van API call

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {}

    async getLeden(): Promise<any> {
       let getParams: KeyValueArray = {}

        if (this.ledenCache === undefined) {
            this.ledenCache = this.storageService.ophalen('ledenCache');
        }

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return (this.ledenCache === undefined) ? this.ledenCache?.dataset  : [];
        }

        if ((this.ledenCache != undefined)  && (this.ledenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
           getParams['HASH'] = this.ledenCache.hash
        }

        try {
            const response: Response = await this.apiService.get('Leden/GetObjects', getParams);
            this.ledenCache = await response.json();
            this.storageService.opslaan('vliegtuigen', this.ledenCache);
        } catch (e: any) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
               this.logger.error(`Exception in leden.service.getLeden: ${e}`);
            }
        }
        return this.ledenCache?.dataset;
    }
}
