'use strict';

import Homey from 'homey/lib/Homey';
import DucoBox from './types/DucoBox';

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
            this.saveDucoBox({
                id: 0,
                name: 'DucoBox',
                hostname: this.homey.settings.get('hostname'),
                useHttps: this.homey.settings.get('useHttps') === null || this.homey.settings.get('useHttps') === true,
                apiType: this.homey.settings.get('apiType') || 'connectivity_board'
            });

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

    getDucoBox(id: number) : DucoBox|null {
        return this.getDucoBoxes().find((ducoBox: DucoBox) => {
            return (ducoBox.id === id);
        }) || null;
    }

    saveDucoBox(ducoBox: DucoBox) {
        // search for existing ducobox
        const ducoBoxes = this.getDucoBoxes();
        const i = ducoBoxes.findIndex((existingDucoBox: DucoBox) => {
            return existingDucoBox.id === ducoBox.id;
        });

        // add or update the list with ducoBoxes
        if (i !== -1) {
            ducoBoxes[i] = ducoBox;
        } else {
            ducoBoxes.push(ducoBox);
        }

        // save ducoBoxes
        this.homey.settings.set('ducoBoxes', ducoBoxes);
    }

    removeDucoBox(id: number) {
        // search for ducobox
        const ducoBoxes = this.getDucoBoxes();
        const i = ducoBoxes.findIndex((existingDucoBox: DucoBox) => {
            return existingDucoBox.id === id;
        });

        // remove ducoBox when found
        if (i !== -1) {
            delete ducoBoxes[i];
            this.homey.settings.set('ducoBoxes', ducoBoxes);
        }
    }
}