import DucoApi from '../../lib/api/DucoApi';
import NodeHelper from '../../lib/NodeHelper';
import DucoDriver from '../../lib/homey/DucoDriver';

class UserControlDriver extends DucoDriver {
  ducoApi!: DucoApi

  async onInit() {
    this.ducoApi = DucoApi.create(this.homey);
  }

  async onPairListDevices() {
    // get nodes and filter the nodes that can be handled by this driver
    const nodes = (await this.ducoApi.getNodes()).filter(node => NodeHelper.isMappedForDriver(node.General.Type.Val, 'user-control'));

    // convert each node to a homey device
    return nodes.map(node => {
      return {
        name: node.General.Name.Val || 'Node ' + node.Node,
        data: {
          id: node.Node
        }
      }
    });
  }
}

module.exports = UserControlDriver;
