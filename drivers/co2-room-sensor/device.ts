import DucoDevice from '../../lib/homey/DucoDevice';
import NodeInterface from '../../lib/api/types/NodeInterface';
import DucoBoxCapabilityValues from '../../lib/types/DucoBoxCapabilityValues';
import FlowHelper from '../../lib/FlowHelper';
import NodeActionEnum from '../../lib/api/types/NodeActionEnum';

class Co2RoomSensorDevice extends DucoDevice {

  async initCapabilities() {
    if (!this.hasCapability('ventilation_state')) {
      await this.addCapability('ventilation_state');
    }
    if (!this.hasCapability('ventilation_time_state_remain')) {
      await this.addCapability('ventilation_time_state_remain');
    }
    if (!this.hasCapability('ventilation_time_state_end')) {
      await this.addCapability('ventilation_time_state_end');
    }
    if (!this.hasCapability('measure_co2')) {
      await this.addCapability('measure_co2');
    }
    if (!this.hasCapability('sensor_air_quality_co2')) {
      await this.addCapability('sensor_air_quality_co2');
    }
    if (!this.hasCapability('measure_sensor_air_quality_co2')) {
      await this.addCapability('measure_sensor_air_quality_co2');
    }

    this.registerCapabilityListener('ventilation_state', (value) => {
      this.homey.log(`ventilation_state capability has been changed to ${value}`);

      return this.postNodeAction({
        Action: NodeActionEnum.SetVentilationState,
        Val: value
      }).then(() => {
        // trigger event ventilation_state_changed to update the widget data
        this.homey.api.realtime('ventilation_state_changed', {
          device_id: this.getAppId(),
          old_value: this.getCapabilityValue('ventilation_state'),
          new_value: value,
        });

        this.updateNode();
      });
    });
  }

  updateByNode(node: NodeInterface): void {
    // save old capability values fo tigger cards
    const oldCapabilityValues = <DucoBoxCapabilityValues> {
      ventilationState: this.getCapabilityValue('ventilation_state'),
      ventilationTimeStateRemain: this.getCapabilityValue('ventilation_time_state_remain'),
      ventilationTimeStateEnd: this.getCapabilityValue('ventilation_time_state_end'),
      sensorCO2: this.getCapabilityValue('measure_co2'),
      sensorAirQualityCO2: this.getCapabilityValue('sensor_air_quality_co2'),
    }

    Promise.all([
      this.setCapabilityValue('ventilation_state', (node.Ventilation && node.Ventilation.State) ? node.Ventilation.State.Val : null),
      this.setCapabilityValue('ventilation_time_state_remain', (node.Ventilation && node.Ventilation.TimeStateRemain) ? node.Ventilation.TimeStateRemain.Val : null),
      this.setCapabilityValue('ventilation_time_state_end', (node.Ventilation && node.Ventilation.TimeStateEnd && node.Ventilation.TimeStateEnd.Val) ? (new Date(node.Ventilation.TimeStateEnd.Val * 1000)).toLocaleString(this.homey.i18n.getLanguage(), { timeZone: this.homey.clock.getTimezone() }) : null),
      this.setCapabilityValue('measure_co2', (node.Sensor && node.Sensor.Co2) ? node.Sensor.Co2.Val : null),
      this.setCapabilityValue('sensor_air_quality_co2', (node.Sensor && node.Sensor.IaqCo2) ? node.Sensor.IaqCo2.Val : null),
      this.setCapabilityValue('measure_sensor_air_quality_co2', (node.Sensor && node.Sensor.IaqCo2) ? node.Sensor.IaqCo2.Val : null)
    ]).then(() => {
      this.triggerFlowCards(oldCapabilityValues)
    }).catch((err) => {
      this.homey.log(err)
    })
  }

  triggerFlowCards(oldCapabilityValues: DucoBoxCapabilityValues): void {
    // trigger event ventilation_state_changed to update the widget data
    if (oldCapabilityValues.ventilationState !== this.getCapabilityValue('ventilation_state')) {
      this.homey.api.realtime('ventilation_state_changed', {
        device_id: this.getAppId(),
        old_value: oldCapabilityValues.ventilationState,
        new_value: this.getCapabilityValue('ventilation_state'),
      });
    }

    // trigger ventilation_state changed
    FlowHelper.triggerChangedValueFlowCards(
      this,
      ''+oldCapabilityValues.ventilationState,
      ''+this.getCapabilityValue('ventilation_state'),
      'co2-room-sensor__ventilation_state_changed'
    );

    // trigger ventilation_time_state_remain changed
    FlowHelper.triggerChangedValueFlowCards(
      this,
      oldCapabilityValues.ventilationTimeStateRemain || 0,
      this.getCapabilityValue('ventilation_time_state_remain') || 0,
      'co2-room-sensor__ventilation_time_state_remain_changed'
    );

    // trigger ventilation_time_state_end changed
    FlowHelper.triggerChangedValueFlowCards(
      this,
      ''+oldCapabilityValues.ventilationTimeStateEnd,
      ''+this.getCapabilityValue('ventilation_time_state_end'),
      'co2-room-sensor__ventilation_time_state_end_changed'
    );

    // trigger sensor_air_quality_co2 changed
    FlowHelper.triggerChangedValueFlowCards(
      this,
      oldCapabilityValues.sensorAirQualityCO2 || 0,
      this.getCapabilityValue('sensor_air_quality_co2') || 0,
      'co2-room-sensor__sensor_air_quality_co2_changed'
    );
  }
}

module.exports = Co2RoomSensorDevice;
