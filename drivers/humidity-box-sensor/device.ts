import DucoDevice from '../../lib/homey/DucoDevice';
import NodeInterface from '../../lib/api/types/NodeInterface';
import DucoBoxCapabilityValues from '../../lib/types/DucoBoxCapabilityValues';
import FlowHelper from '../../lib/FlowHelper';

class HumidityBoxSensorDevice extends DucoDevice {

  async initCapabilities() {
    if (!this.hasCapability('measure_humidity')) {
      await this.addCapability('measure_humidity');
    }
    if (!this.hasCapability('sensor_air_quality_rh')) {
      await this.addCapability('sensor_air_quality_rh');
    }
    if (!this.hasCapability('measure_sensor_air_quality_rh')) {
      await this.addCapability('measure_sensor_air_quality_rh');
    }
  }

  updateByNode(node: NodeInterface): void {
    // save old capability values fo tigger cards
    const oldCapabilityValues = <DucoBoxCapabilityValues> {
      sensorRH: this.getCapabilityValue('measure_humidity'),
      sensorAirQualityRH: this.getCapabilityValue('sensor_air_quality_rh'),
    }

    Promise.all([
      this.setCapabilityValue('measure_humidity', (node.Sensor && node.Sensor.Rh) ? node.Sensor.Rh.Val : null),
      this.setCapabilityValue('sensor_air_quality_rh', (node.Sensor && node.Sensor.IaqRh) ? node.Sensor.IaqRh.Val : null),
      this.setCapabilityValue('measure_sensor_air_quality_rh', (node.Sensor && node.Sensor.IaqRh) ? node.Sensor.IaqRh.Val : null)
    ]).then(() => {
      this.triggerFlowCards(oldCapabilityValues)
    }).catch((err) => {
      this.homey.log(err)
    })
  }

  triggerFlowCards(oldCapabilityValues: DucoBoxCapabilityValues): void {
    // trigger sensor_air_quality_rh changed
    FlowHelper.triggerChangedValueFlowCards(
      this,
      oldCapabilityValues.sensorAirQualityRH || 0,
      this.getCapabilityValue('sensor_air_quality_rh') || 0,
      'humidity-box-sensor__sensor_air_quality_rh_changed'
    );
  }
}

module.exports = HumidityBoxSensorDevice;
