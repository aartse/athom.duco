import NodeInterface from "../api/types/NodeInterface";
import Homey from 'homey';
import AppService from "../AppService";
import DucoApi from "../api/types/DucoApi";
import PostNodeAction from "../api/types/PostNodeAction";
import NodeHelper from "../NodeHelper";

export default class DucoDevice extends Homey.Device {
    updateByNode(node: NodeInterface): void {

    }

    /**
     * Initalize capabilities.
     * This method is executed in the `onInit` event and should be overwritten.
     */
    async initCapabilities() {

    }

    async onInit() {
        await this.initCapabilities();

        // log initialized device
        this.homey.log('device initialized: '+JSON.stringify({
            'id': this.getData()['id'],
            'ducoBoxId': this.getDucoBoxId(),
            'ducoNodeId': this.getDucoNodeId(),
            'driver': this.driver.id,
            'deviceName': this.getName()
        }));
    }

    getDucoNodeId(): number {
        return NodeHelper.getDucoNodeId(String(this.getData()['id']));
    }

    getDucoBoxId(): number {
        return NodeHelper.getDucoBoxId(String(this.getData()['id']));
    }

    postNodeAction(postData: PostNodeAction) : Promise<any> {
        const ducoBoxInstance = AppService.create(this.homey).getDucoBoxInstance(this.getDucoBoxId());
        if (null === ducoBoxInstance) {
            return new Promise((resolve, reject) => {
                reject(new Error("No duco box found with id "+this.getDucoBoxId()));
            });
        }

        return ducoBoxInstance.ducoApi.postNodeAction(this.getDucoNodeId(), postData);
    }

    updateNode() {
        AppService.create(this.homey).getDucoBoxInstance(this.getDucoBoxId())?.startListener(10000);
    }
}