'use strict';

import { DiscoveryResultMDNSSD } from 'homey';
import Homey from 'homey/lib/Homey';

let discoveryService: DiscoveryService|null = null;

export default class DiscoveryService {

    homey: Homey

    constructor(homey: Homey) {
        this.homey = homey;
    }

    static create(homey: Homey) {
        if (null === discoveryService) {
            discoveryService = new DiscoveryService(homey);
        }

        return discoveryService;
    }

    discover() {
        this.homey.settings.set('discoveredDucoBoxes', []);

        const discoveryStrategies = [
            this.homey.discovery.getStrategy("duco-connectivity-board-https"),
            this.homey.discovery.getStrategy("duco-connectivity-board-http")
        ];

        // loop all discovery strategies
        for (const discoveryStrategy of discoveryStrategies) {
            // load initial discovered results
            const initialDiscoveryResults = discoveryStrategy.getDiscoveryResults();
            for (const discoveryResult of Object.values(initialDiscoveryResults)) {
                if (discoveryResult instanceof DiscoveryResultMDNSSD) {
                    this.handleDiscoveryResult(discoveryResult);
                }
            }

            // add later discovered results
            discoveryStrategy.on("result", discoveryResult => {
                if (discoveryResult instanceof DiscoveryResultMDNSSD) {
                    this.handleDiscoveryResult(discoveryResult);
                }
            });
        }
    }

    handleDiscoveryResult(discoveryResult: DiscoveryResultMDNSSD) {
        this.homey.log('Discovered a MMDNSSD Device:');
        this.homey.log(discoveryResult);
        
        // skip: this is not a duco device
        if (!discoveryResult.name.startsWith('DUCO')) {
            this.homey.log('MDNSSD result is no duco device');

            return;
        }

        // load existing duco boxes and add this result to it
        var discoveredDucoBoxes = this.homey.settings.get('discoveredDucoBoxes');
        if (!(discoveredDucoBoxes instanceof Array)) {
            discoveredDucoBoxes = [];
        }
        discoveredDucoBoxes.push(discoveryResult);
        this.homey.settings.set('discoveredDucoBoxes', discoveredDucoBoxes);

        this.homey.log('Device added to the discovered duco boxes list, current number of boxes: '+discoveredDucoBoxes.length);
    }
}