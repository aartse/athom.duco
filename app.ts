'use strict';

import Homey, { Device } from 'homey';
import NodeHelper from './lib/NodeHelper';
import DiscoveryService from './lib/DiscoveryService';
import AppService from './lib/AppService';

export default class DucoApp extends Homey.App {

  appService!: AppService

  async onInit() {
    // init app service
    this.appService = AppService.create(this.homey)
    this.appService.init();

    // init discover service
    DiscoveryService.create(this.homey).discover();
  }

  getBoxDevice(): Device|null {
    const drivers = this.homey.drivers.getDrivers();
    for(const id in drivers) {
      if (NodeHelper.isMappedForDriver('BOX', id)) {
        const devices = drivers[id].getDevices();
        for(const id in devices) {
          return devices[id];
        }
      }
    }

    return null;
  }

  getDeviceById(deviceId: string): Device|null {
    const drivers = this.homey.drivers.getDrivers();
    for(const id in drivers) {
      const devices = drivers[id].getDevices();
      for(const id in devices) {
        if (deviceId === devices[id].getAppId()) {
          return devices[id];
        }
      }
    }

    return null;
  }
}

module.exports = DucoApp;
