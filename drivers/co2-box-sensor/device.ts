import DucoDevice from '../../lib/homey/DucoDevice';
import NodeInterface from '../../lib/api/types/NodeInterface';
import DucoBoxCapabilityValues from '../../lib/types/DucoBoxCapabilityValues';
import FlowHelper from '../../lib/FlowHelper';

class CO2BoxSensorDevice extends DucoDevice {

  async initCapabilities() {
    if (!this.hasCapability('measure_co2')) {
      await this.addCapability('measure_co2');
    }
    if (!this.hasCapability('sensor_air_quality_co2')) {
      await this.addCapability('sensor_air_quality_co2');
    }
    if (!this.hasCapability('measure_sensor_air_quality_co2')) {
      await this.addCapability('measure_sensor_air_quality_co2');
    }
  }

  updateByNode(node: NodeInterface): void {
    // save old capability values fo tigger cards
    const oldCapabilityValues = <DucoBoxCapabilityValues> {
      sensorAirQualityCO2: this.getCapabilityValue('sensor_air_quality_co2'),
      sensorCO2: this.getCapabilityValue('measure_co2'),
    }

    Promise.all([
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
    // trigger sensor_air_quality_co2 changed
    FlowHelper.triggerChangedValueFlowCards(
      this,
      oldCapabilityValues.sensorAirQualityCO2 || 0,
      this.getCapabilityValue('sensor_air_quality_co2') || 0,
      'co2-box-sensor__sensor_air_quality_co2_changed'
    );
  }
}

module.exports = CO2BoxSensorDevice;
