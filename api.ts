import RequestWithBody from "./lib/homey/types/RequestWithBody";
import RequestWithoutBody from "./lib/homey/types/RequestWithoutBody";
import SettingsService from "./lib/SettingsService";
import DucoBox from "./lib/types/DucoBox";

module.exports = {
  async getDucoBoxes({ homey }: RequestWithoutBody) : Promise<Array<DucoBox>> {
    return SettingsService.create(homey).getDucoBoxes();
  },

  async getDucoBox({ homey, params }: RequestWithoutBody) : Promise<DucoBox> {
    return SettingsService.create(homey).getDucoBox(parseInt(params.id));
  },

  async postDucoBox({ homey, body }: RequestWithBody<DucoBox>) : Promise<DucoBox> {
    return SettingsService.create(homey).saveDucoBox(body);
  },

  async putDucoBox({ homey, params, body }: RequestWithBody<DucoBox>) : Promise<DucoBox> {
    body.id = parseInt(params.id);
    return SettingsService.create(homey).saveDucoBox(body);
  },

  async deleteDucoBox({ homey, params }: RequestWithoutBody) : Promise<any> {
    SettingsService.create(homey).removeDucoBox(parseInt(params.id));
  },
};