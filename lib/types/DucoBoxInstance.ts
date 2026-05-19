import Homey from 'homey/lib/Homey';
import DucoBox from "./DucoBox";
import DucoApi from "../api/types/DucoApi";
import DucoCommunicationPrintApi from "../api/DucoCommunicationPrintApi";
import DucoConnectivityBoardApi from "../api/DucoConnectivityBoardApi";
import NodeInterface from "../api/types/NodeInterface";
import DucoDriver from "../homey/DucoDriver";
import NodeHelper from "../NodeHelper";

export default class DucoBoxInstance {

    homey: Homey
    ducoBox: DucoBox
    ducoApi: DucoApi
    refreshInterval: number = 60000
    timeoutId: any
    initTimeoutId: any
    updatingDevices: boolean

    constructor(homey: Homey, ducoBox: DucoBox) {
        this.homey = homey;
        this.ducoBox = ducoBox;
        this.timeoutId = null;
        this.updatingDevices = false;

        // create Duco API
        this.ducoApi = 'communication_print' === ducoBox.apiType
            ? new DucoCommunicationPrintApi(homey, ducoBox)
            : new DucoConnectivityBoardApi(homey, ducoBox);
    }

    getApi(): DucoApi {
        return this.ducoApi;
    }

    startListener(initTimeout: number|null = null) {
        // first stop the listener
        this.stopListener();

        // use polling to update the data
        const timeoutCallback = () => {
            this.updateDevices();
        }
        this.timeoutId = this.homey.setInterval(timeoutCallback, this.refreshInterval);

        // update devices when start listener
        if (initTimeout) {
            const timeoutCallback = () => {
                this.updateDevices();
            }

            this.initTimeoutId = this.homey.setTimeout(timeoutCallback, initTimeout);
        } else {
            this.updateDevices();
        }
    }

    stopListener() {
        // stop the listener interval
        if (this.timeoutId) {
            this.homey.clearInterval(this.timeoutId);
            this.timeoutId = null;
        }

        // stop the init timeout interval
        if (this.initTimeoutId) {
            this.homey.clearTimeout(this.initTimeoutId);
            this.initTimeoutId = null;
        }
    }

    updateDevices() {
        if (this.updatingDevices) {
            this.homey.error('update devices process already running');
            return;
        }
        this.updatingDevices = true;

        this.ducoApi.getNodes().then(nodes => {
            this.updatingDevices = false;

            nodes.forEach((node: NodeInterface) => {
                this.updateDriverByNode(node);
            });
        }).catch((err) => {
            this.updatingDevices = false;

            const drivers = this.homey.drivers.getDrivers();
            for(const id in drivers) {
                const driver = <DucoDriver>drivers[id];

                driver.setUnavailable(this.ducoBox, err);
            }
        });
    }

    updateDriverByNode(node: NodeInterface) {
        NodeHelper.getDriverIdsForNodeType(node.General.Type.Val).forEach((driverId: string) => {
            const driver = <DucoDriver>this.homey.drivers.getDriver(driverId);
            
            driver.setAvailable(this.ducoBox);
            driver.updateByNode(this.ducoBox, node);
        })
    }
}
