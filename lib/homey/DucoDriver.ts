import NodeInterface from "../api/types/NodeInterface";
import Homey, { Device } from 'homey';
import DucoDevice from "./DucoDevice";
import DucoBox from "../types/DucoBox";
import { PairSession } from "homey/lib/Driver";
import SettingsService from "../SettingsService";
import AppService from "../AppService";
import NodeHelper from "../NodeHelper";
import DiscoveryService from "../DiscoveryService";
import DucoBoxApiTypeEnum from "../types/DucoBoxApiTypeEnum";

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

    async onPair(session: PairSession): Promise<void> {
      let ducoBoxId: number;

      session.setHandler("list_ducoboxes", async (): Promise<object[]> => {
        const existingDucoBoxes = SettingsService.create(this.homey).getDucoBoxes();

        const discoveredDucoBoxes = [];
        for (const discoveredDevice of DiscoveryService.create(this.homey).getDiscoveredDevices()) {
          // search for an existing ducobox
          const ducoboxExists = existingDucoBoxes.find((ducoBox: DucoBox) => {
              return (ducoBox.hostname === discoveredDevice.address);
          }) || null;

          // skip if a box already exists with this hostname
          if (existingDucoBoxes.length > 0 && ducoboxExists !== null) {
            continue;
          }

          // add a ducobox, the box is created wheb the user choses this box
          discoveredDucoBoxes.push(<DucoBox>{
            apiType: DucoBoxApiTypeEnum.connectivity_board,
            name: discoveredDevice.name,
            hostname: discoveredDevice.address,
            useHttps: discoveredDevice.port !== 80
          });
        }

        return [...existingDucoBoxes, ...discoveredDucoBoxes];
      });

      session.setHandler("selected_ducobox", async (ducoBox: DucoBox) => {
        // create a ducobox when the id is not given (this can happen when the device is discovered)
        if (null === ducoBox.id || typeof ducoBox.id === 'undefined') {
          ducoBox = SettingsService.create(this.homey).saveDucoBox(ducoBox);
        }

        ducoBoxId = ducoBox.id;
      });

      session.setHandler("list_devices", async (): Promise<object[]> => {
        const ducoBoxInstance = AppService.create(this.homey).getDucoBoxInstance(ducoBoxId);
        if (null === ducoBoxInstance) {
            return new Promise((resolve, reject) => {
                reject(new Error("No duco box found with id "+ducoBoxId));
            });
        }

        // get nodes and filter the nodes that can be handled by this driver
        const nodes = (await ducoBoxInstance.ducoApi.getNodes()).filter(node => NodeHelper.isMappedForDriver(node.General.Type.Val, this.id));

        // convert each node to a homey device
        return nodes.map(node => {
          return {
            name: node.General.Name.Val || 'Node ' + node.Node,
            data: {
              id: NodeHelper.getDeviceId(ducoBoxId, node.Node)
            }
          }
        });
      });
    }
}