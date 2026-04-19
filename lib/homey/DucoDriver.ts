import NodeInterface from "../api/types/NodeInterface";
import Homey, { Device } from 'homey';
import DucoDevice from "./DucoDevice";
import DucoBox from "../types/DucoBox";

export default class DucoDriver extends Homey.Driver {
    updateByNode(ducoBox: DucoBox, node: NodeInterface) {
      this.getDevices().forEach((device: Device) => {
        if ((<DucoDevice>device).getDucoBoxId() !== ducoBox.id) {
          return;
        }
 
        device.setAvailable();
        if ((<DucoDevice>device).getDucoNodeId() === node.Node) {
          this.homey.log('updating "'+this.id+'" named "'+device.getName()+'" for node "'+node.Node+'" on ducoBox "'+ducoBox.id+'"');
          (<DucoDevice>device).updateByNode(node);
        }
      })
    }

    setUnavailable(ducoBox: DucoBox, message?: string | null | undefined) {
      this.getDevices().forEach((device: Device) => {
        if ((<DucoDevice>device).getDucoBoxId() !== ducoBox.id) {
          return;
        }

        device.setUnavailable(message);
      })
    }

    setAvailable(ducoBox: DucoBox) {
      this.getDevices().forEach((device: Device) => {
        if ((<DucoDevice>device).getDucoBoxId() !== ducoBox.id) {
          return;
        }

        device.setAvailable();
      })
    }
}