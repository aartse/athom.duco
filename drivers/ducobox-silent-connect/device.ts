import DucoDevice from '../../lib/homey/DucoDevice';
import NodeInterface from '../../lib/api/types/NodeInterface';
import DucoApi from '../../lib/api/DucoApi';
import NodeActionEnum from '../../lib/api/types/NodeActionEnum';
import DucoBoxCapabilityValues from '../../lib/types/DucoBoxCapabilityValues';

class DucoboxSilentConnectDevice extends DucoDevice {
  ducoApi!: DucoApi

  async onInit() {
    await this.initCapabilities();
    this.ducoApi = new DucoApi(this.homey);
  }

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
    if (!this.hasCapability('ventilation_mode')) {
      await this.addCapability('ventilation_mode');
    }
    if (!this.hasCapability('ventilation_flow_level_target')) {
      await this.addCapability('ventilation_flow_level_target');
    }
    if (!this.hasCapability('sensor_air_quality_rh')) {
      await this.addCapability('sensor_air_quality_rh');
    }
    if (!this.hasCapability('sensor_air_quality_co2')) {
      await this.addCapability('sensor_air_quality_co2');
    }

    this.registerCapabilityListener('ventilation_state', (value) => {
      return this.ducoApi.postNodeAction(this.getData().id, {
        Action: NodeActionEnum.SetVentilationState,
        Val: value
      });
    });
  }

  updateByNode(node: NodeInterface): void {
    // save old capability values fo tigger cards
    const oldCapabilityValues = <DucoBoxCapabilityValues> {
      ventilationState: this.getCapabilityValue('ventilation_state'),
      ventilationTimeStateRemain: this.getCapabilityValue('ventilation_time_state_remain'),
      ventilationTimeStateEnd: this.getCapabilityValue('ventilation_time_state_end'),
      ventilationMode: this.getCapabilityValue('ventilation_mode'),
      ventilationFlowLevelTarget: this.getCapabilityValue('ventilation_flow_level_target'),
      sensorAirQualityRH: this.getCapabilityValue('sensor_air_quality_rh'),
      sensorAirQualityCO2: this.getCapabilityValue('sensor_air_quality_co2'),
    }

    Promise.all([
      this.setCapabilityValue('ventilation_state', (node.Ventilation && node.Ventilation.State && node.Ventilation.State.Val) || null),
      this.setCapabilityValue('ventilation_time_state_remain', (node.Ventilation && node.Ventilation.TimeStateRemain && node.Ventilation.TimeStateRemain.Val) || null),
      this.setCapabilityValue('ventilation_time_state_end', (node.Ventilation && node.Ventilation.TimeStateEnd && node.Ventilation.TimeStateEnd.Val) || null),
      this.setCapabilityValue('ventilation_mode', (node.Ventilation && node.Ventilation.Mode && node.Ventilation.Mode.Val) || null),
      this.setCapabilityValue('ventilation_flow_level_target', (node.Ventilation && node.Ventilation.FlowLvlTgt && node.Ventilation.FlowLvlTgt.Val) || null),
      this.setCapabilityValue('sensor_air_quality_rh', (node.Sensor && node.Sensor.IaqRh && node.Sensor.IaqRh.Val) || null),
      this.setCapabilityValue('sensor_air_quality_co2', (node.Sensor && node.Sensor.IaqCo2 && node.Sensor.IaqCo2.Val) || null)
    ]).then(() => {
      this.triggerFlowCards(oldCapabilityValues)
    }).catch((err) => {
      this.homey.log(err)
      throw err
    })
  }

  triggerFlowCards(oldCapabilityValues: DucoBoxCapabilityValues): void {
    // trigger ventilation_state changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.ventilationState,
      this.getCapabilityValue('ventilation_state'),
      'ducobox-silent-connect__ventilation_state_changed'
    );

    // trigger ventilation_time_state_remain changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.ventilationTimeStateRemain,
      this.getCapabilityValue('ventilation_time_state_remain'),
      'ducobox-silent-connect__ventilation_time_state_remain_changed'
    );

    // trigger ventilation_time_state_end changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.ventilationTimeStateEnd,
      this.getCapabilityValue('ventilation_time_state_end'),
      'ducobox-silent-connect__ventilation_time_state_end_changed'
    );

    // trigger ventilation_mode changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.ventilationMode,
      this.getCapabilityValue('ventilation_mode'),
      'ducobox-silent-connect__ventilation_mode_changed'
    );

    // trigger ventilation_flow_level_target changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.ventilationFlowLevelTarget,
      this.getCapabilityValue('ventilation_flow_level_target'),
      'ducobox-silent-connect__ventilation_flow_level_target_changed'
    );

    // trigger sensor_air_quality_rh changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.sensorAirQualityRH,
      this.getCapabilityValue('sensor_air_quality_rh'),
      'ducobox-silent-connect__sensor_air_quality_rh_changed'
    );

    // trigger sensor_air_quality_co2 changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.sensorAirQualityCO2,
      this.getCapabilityValue('sensor_air_quality_co2'),
      'ducobox-silent-connect__sensor_air_quality_co2_changed'
    );
  }

  triggerChangedValueFlowCards(oldValue: any, newValue: any, triggerCard: string) : void {
    if (newValue !== oldValue) {
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(
          this,
          {
            old_value: oldValue,
            new_value: newValue
          },
          {}
        )
        .catch((err) => {
          this.homey.error(err);
        });
    }
  }
}

module.exports = DucoboxSilentConnectDevice;
