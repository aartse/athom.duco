'use strict';

import Homey from 'homey/lib/Homey';
import SettingsService from './SettingsService';
import DucoBoxInstance from './types/DucoBoxInstance';
import DucoBox from './types/DucoBox';
import DucoApi from './api/types/DucoApi';

let appService: AppService|null = null;

export default class AppService {

    homey: Homey
    settingsService: SettingsService
    ducoBoxInstances: Array<DucoBoxInstance>

    constructor(homey: Homey) {
        this.homey = homey;
        this.settingsService = SettingsService.create(homey);
        this.ducoBoxInstances = [];

        // reinit ducoBox instances when
        const onSettingsChange = (field: any) => {
            if ('ducoBoxes' === field) {
                this.homey.log('ducoBoxes changed, reloading ducoBox instances');

                this.init();
            }
        }
        this.homey.settings.on('set', onSettingsChange);
    }

    static create(homey: Homey) {
        if (null === appService) {
            appService = new AppService(homey);
        }

        return appService;
    }

    init() {
        // destroy existing ducoBox instances
        this.ducoBoxInstances.forEach((ducoBoxInstance: DucoBoxInstance) => {
            ducoBoxInstance.stopListener();
        });

        // re-create ducoBox instances
        this.ducoBoxInstances = [];
        this.settingsService.getDucoBoxes().forEach((ducoBox: DucoBox) => {
            const ducoBoxInstance = new DucoBoxInstance(this.homey, ducoBox);
            ducoBoxInstance.startListener(10000);

            this.ducoBoxInstances.push(ducoBoxInstance);
        });
    }

    getDucoBoxInstance(ducoBoxId: number): DucoBoxInstance|null {
        return this.ducoBoxInstances.find((ducoBoxInstance: DucoBoxInstance) => {
            return (ducoBoxInstance.ducoBox.id === ducoBoxId);
        }) || null;
    }

    getDucoApi(ducoBoxId: number): DucoApi|null {
        const ducoBoxInstance = this.getDucoBoxInstance(ducoBoxId);

        if (ducoBoxInstance) {
            return ducoBoxInstance.ducoApi;
        }

        return null;
    }
}