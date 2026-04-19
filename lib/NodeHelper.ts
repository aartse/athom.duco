'use strict';

import DucoDevice from "./homey/DucoDevice";

export default class NodeHelper {

    static getDriverIdsForNodeType(type: string) : string[] {
        switch (type) {
            case 'BOX':
                return ['ducobox-silent-connect','ducobox-focus'];
            case 'BSRH':
                return ['humidity-box-sensor'];
            case 'BSCO2':
                return ['co2-box-sensor'];
            case 'UCBAT':
                return ['user-control'];
            case 'UCRH':
                return ['humidity-room-sensor'];
            case 'UCCO2':
                return ['co2-room-sensor'];
            case 'VLV':
                return ['valve'];
            case 'VLVCO2':
                return ['co2-valve'];
            case 'VLVRH':
                return ['humidity-valve'];
            case 'VLVCO2RH':
                return ['co2-humidity-valve'];
        }

        return [];
    }

    static isMappedForDriver(type: string, driver: string) : boolean {
        return this.getDriverIdsForNodeType(type).indexOf(driver) !== -1;
    }
}