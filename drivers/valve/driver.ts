import DucoDriver from '../../lib/homey/DucoDriver';
import NodeActionEnum from '../../lib/api/types/NodeActionEnum';

class ValveDriver extends DucoDriver {
  async onInit() {
    // init action card
    const changeVentilationStateAction = this.homey.flow.getActionCard('valve__change_ventilation_state');
    changeVentilationStateAction.registerRunListener((args, state) => {
      return args.device.postNodeAction({
        Action: NodeActionEnum.SetVentilationState,
        Val: args.ventilation_state
      }).then(() => {
        // trigger event ventilation_state_changed to update the widget data
        this.homey.api.realtime('ventilation_state_changed', {
          device_id: args.device.getAppId(),
          old_value: args.device.getCapabilityValue('ventilation_state'),
          new_value: args.ventilation_state,
        });

        // update capability value
        args.device.setCapabilityValue('ventilation_state', args.ventilation_state);
        args.device.updateNode();
      });
    });
    
    // init condition cards
    const ventilationStateCondition = this.homey.flow.getConditionCard('valve__ventilation_state_is');
    ventilationStateCondition.registerRunListener((args, state) => {
      return args.device.getCapabilityValue('ventilation_state') === args.state;
    });
    const ventilationModeCondition = this.homey.flow.getConditionCard('valve__ventilation_mode_is');
    ventilationModeCondition.registerRunListener((args, state) => {
      return args.device.getCapabilityValue('ventilation_mode') === args.mode;
    });
  }
}

module.exports = ValveDriver;
