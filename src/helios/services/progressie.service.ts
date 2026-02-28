import {Injectable} from "@nestjs/common";
import {APIService, KeyValueArray} from "./api.service";
import {StorageService} from "./storage.service";
import {LoginService} from "./login.service";


@Injectable()
export class ProgressieService {
    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {}

    async getLidProgressie(lidId: number): Promise<any> {
        let getParams: KeyValueArray = {
           LID_ID: lidId
        };

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return []
        }

        var data = undefined
        try {
            const response: Response = await this.apiService.get('Progressie/GetObjects', getParams);
            data = await response.json();
        } catch (e:any) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                console.error(`Exception in progressie.service.getLidProgressie: ${e}`);
            }
        }
        return data ?  data?.dataset : undefined;
    }

    async setProgressie(lidId: number, competentie: number): Promise<any>
    {
       const replacer = (key:string, value:any) =>
          typeof value === 'undefined' ? null : value;

       const record = { LID_ID: lidId, COMPETENTIE_ID: competentie };
       try {
          const response: Response = await this.apiService.post('Progressie/SaveObject', JSON.stringify(record, replacer));
          return response.json();
       }
       catch (e) {
           console.error(`Exception in Progressie.service.setProgressie: ${e}`);
       }
    }
}
