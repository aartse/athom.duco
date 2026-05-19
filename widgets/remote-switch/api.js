'use strict';

import NodeActionEnum from "../../lib/api/types/NodeActionEnum";

module.exports = {
  async updateVentilationState({ homey, params, body }) {
    homey.log('received updateVentilationState from widget for device '+params.id);

    // search for given device
    let device = null;
    if (params.id === 'BOX') {
      device = homey.app.getBoxDevice();
    } else {
      device = homey.app.getDeviceById(params.id);
    }

    // early return when device is not found, this can happen when the device is deleted
    if (null === device) {
      homey.error('cannot find device for "'+params.id+'"');

      return;
    }

    // early return when device has not the ventilation_state, this should not happen
    if (!device.hasCapability('ventilation_state')) {
      homey.error('device has no ventilation_state capability');

      return;
    }

    // update ventilation state
    device.postNodeAction({
      Action: NodeActionEnum.SetVentilationState,
      Val: body.state
    }).then(() => {
      // update capability value and restart listener with a timeout to make sure the has updated the values
      device.setCapabilityValue('ventilation_state', body.state);
      device.updateNode();
    });
  },

  async getVentilationState({ homey, params }) {
    homey.log('received getVentilationState from widget for device '+params.id);

    // search for given device
    let device = null;
    if (params.id === 'BOX') {
      device = homey.app.getBoxDevice();
    } else {
      device = homey.app.getDeviceById(params.id);
    }

    // early return when device is not found, this can happen when the device is deleted
    if (null === device) {
      homey.error('cannot find device for "'+params.id+'"');

      return null;
    }

    // early return when device has not the ventilation_state, this should not happen
    if (!device.hasCapability('ventilation_state')) {
      homey.error('device has no ventilation_state capability');

      return null;
    }

    return {
      'state': device.getCapabilityValue('ventilation_state'),
      'deviceId': device.getAppId()
    }
  },
};
