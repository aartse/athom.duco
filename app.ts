'use strict';

import Homey, { Device } from 'homey';
import UpdateListener from './lib/UpdateListner';
import DucoApi from './lib/api/DucoApi';
import NodeActionEnum from './lib/api/types/NodeActionEnum';
import NodeHelper from './lib/NodeHelper';
import DiscoveryService from './lib/DiscoveryService';

export default class DucoApp extends Homey.App {
  ducoApi!: DucoApi

  async onInit() {
    // init settings
    if (this.homey.settings.get('hostname') === null) {
      this.homey.settings.set('hostname', '');
    }
    if (this.homey.settings.get('useHttps') === null) {
      this.homey.settings.set('useHttps', true);
    }

    this.ducoApi = DucoApi.create(this.homey);

    const updateListner = UpdateListener.create(this.homey);
    updateListner.startListener();

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
