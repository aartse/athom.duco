'use strict';

import Homey from 'homey/lib/Homey';
import DucoBox from './types/DucoBox';
import assert from "node:assert";
import DucoBoxApiTypeEnum from './types/DucoBoxApiTypeEnum';

let settingsService: SettingsService|null = null;

export default class SettingsService {

    homey: Homey

    constructor(homey: Homey) {
        this.homey = homey;
    }

    static create(homey: Homey) {
        if (null === settingsService) {
            settingsService = new SettingsService(homey);
            settingsService.init();
        }

        return settingsService;
    }

    init() {
        // init a list of ducoBoxes
        if (!Array.isArray(this.homey.settings.get('ducoBoxes'))) {
            this.homey.settings.set('ducoBoxes', []);
        }

        // migrate old settings to a ducoBox
        if (this.homey.settings.get('hostname')) {
            this.homey.log('migrating old settings to ducoBox 0');
            const ducoBox = {
                id: 0,
                name: 'DucoBox',
                hostname: this.homey.settings.get('hostname'),
                useHttps: this.homey.settings.get('useHttps') === null || this.homey.settings.get('useHttps') === true,
                apiType: this.homey.settings.get('apiType') || DucoBoxApiTypeEnum.connectivity_board
            };

            // fix invalid apiType
            if (Object.values(DucoBoxApiTypeEnum).indexOf(ducoBox.apiType) === -1) {
                ducoBox.apiType = DucoBoxApiTypeEnum.connectivity_board;
            }

            this.saveDucoBox(ducoBox);

            // clear old values
            this.homey.settings.set('hostname', null);
            this.homey.settings.set('useHttps', null);
            this.homey.settings.set('apiType', null);
        }

        // log the amount of boxes
        this.homey.log('settings initialized, number of boxes: '+this.getDucoBoxes().length);
    }

    getDucoBoxes() : Array<DucoBox> {
        return this.homey.settings.get('ducoBoxes');
    }

    getDucoBox(id: number) : DucoBox {
        const ducoBox = this.getDucoBoxes().find((ducoBox: DucoBox) => {
            return (ducoBox.id === id);
        }) || null;

        if (null === ducoBox) {
            throw new Error('no DucoBox found with id '+id);
        }

        return ducoBox;
    }

    saveDucoBox(ducoBox: DucoBox) : DucoBox {
        // search for existing ducobox
        const ducoBoxes = this.getDucoBoxes();

        // generate new id when not given
        if (null === ducoBox.id || typeof ducoBox.id === 'undefined') {
            let newId = 0;
            let idFound = true;
            while (idFound) {
                idFound = false;
                for(const existingDucoBox of ducoBoxes) {
                    if (existingDucoBox.id === newId) {
                        idFound = true;
                        break;
                    }
                };

                if (idFound) {
                    newId++;
                }
            }
            ducoBox.id = newId;
        }

        // search for existing item based on id
        const i = ducoBoxes.findIndex((existingDucoBox: DucoBox) => {
            return existingDucoBox.id === ducoBox.id;
        });

        // validate types
        assert(typeof ducoBox.id === "number" && !isNaN(ducoBox.id), "id should be a number");
        assert(typeof ducoBox.name === "string", "name should be a string");
        assert(typeof ducoBox.hostname === "string", "hostname should be a string");
        assert(typeof ducoBox.apiType === "string", "apiType should be a string");
        assert(typeof ducoBox.useHttps === "boolean", "useHttps should be a boolean");

        // validate values
        assert(ducoBox.id >= 0, "id should not be negative");
        assert(ducoBox.name.trim() !== "", "name should not be empty");
        assert(ducoBox.hostname.trim() !== "", "hostname should not be empty");
        assert(Object.values(DucoBoxApiTypeEnum).indexOf(ducoBox.apiType) !== -1, "invalid apiType, should be one of "+Object.values(DucoBoxApiTypeEnum).join(','));

        // add or update the list with ducoBoxes
        if (i !== -1) {
            ducoBoxes[i] = ducoBox;
        } else {
            ducoBoxes.push(ducoBox);
        }

        // save ducoBoxes
        this.homey.settings.set('ducoBoxes', ducoBoxes);

        return ducoBox;
    }

    removeDucoBox(id: number) {
        // search for ducobox
        const ducoBoxes = this.getDucoBoxes();
        const i = ducoBoxes.findIndex((existingDucoBox: DucoBox) => {
            return existingDucoBox.id === id || (isNaN(existingDucoBox.id) && isNaN(id)) || (null === existingDucoBox.id && isNaN(id));
        });

        // remove ducoBox when found
        if (i !== -1) {
            ducoBoxes.splice(i, 1);
            this.homey.settings.set('ducoBoxes', ducoBoxes);
        }
    }
}