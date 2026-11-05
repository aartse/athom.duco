'use strict';

import Homey from 'homey/lib/Homey';
import NodeInterface from './types/NodeInterface';
import PostNodeAction from './types/PostNodeAction';
import HttpClient from './HttpClient';
import DucoApi from './types/DucoApi';
import DucoBox from '../types/DucoBox';
import NodeConfig from './types/NodeConfig';
import generateDucoApiKey from './DucoApiKey';

// The key depends on the board time (per day), so a short cache is plenty.
const API_KEY_CACHE_MS = 60 * 1000;

export default class DucoConnectivityBoardApi implements DucoApi {

    httpClient: HttpClient
    // The board only honours the Api-Key over https; over http it returns the public subset.
    configHttpClient: HttpClient
    apiKey: string|null = null
    apiKeyTimestamp: number = 0

    constructor(homey: Homey, ducoBox: DucoBox) {
        this.httpClient = new HttpClient(homey, ducoBox.hostname, ducoBox.useHttps);
        this.configHttpClient = new HttpClient(homey, ducoBox.hostname, true);
    }

    getNodes() : Promise <NodeInterface[]> {
        return new Promise((resolve, reject) => {
            this.httpClient.get('/info/nodes')
                .then(response => {
                    let result = JSON.parse(response);
                    if (result && result.Nodes) {
                        return resolve(result.Nodes);
                    } else {
                        return reject(new Error('Error obtaining nodes.'));
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    postNodeAction(nodeId: number, postData: PostNodeAction) : Promise<any> {
        return new Promise((resolve, reject) => {
            this.httpClient.post('/action/nodes/'+nodeId, postData)
                .then(response => {
                    let result = JSON.parse(response);
                    if (result) {
                        return resolve(result);
                    } else {
                        return reject(new Error('Error post node action.'));
                    }
                })
                .catch(error => reject(error));
        });
    }

    supportsNodeConfig() : boolean {
        return true;
    }

    async getNodeConfig(nodeId: number) : Promise<NodeConfig> {
        const response = await this.configHttpClient.get('/config/nodes/'+nodeId, await this.getAuthHeaders());
        const result = JSON.parse(response) as NodeConfig;
        if (!result || result.Node !== nodeId) {
            throw new Error('Error obtaining node configuration.');
        }

        return result;
    }

    async patchNodeConfig(nodeId: number, values: Record<string, number>) : Promise<NodeConfig> {
        const body: Record<string, { Val: number }> = {};
        for (const [parameter, value] of Object.entries(values)) {
            body[parameter] = { Val: value };
        }

        await this.configHttpClient.patch('/config/nodes/'+nodeId, body, await this.getAuthHeaders());

        return this.getNodeConfig(nodeId);
    }

    private async getAuthHeaders() : Promise<Record<string, string>> {
        if (!this.apiKey || (Date.now() - this.apiKeyTimestamp) > API_KEY_CACHE_MS) {
            // Request only the fields the key is derived from, so the Wi-Fi AP key in /info is not logged.
            const board = JSON.parse(await this.configHttpClient.get('/info?module=General&submodule=Board'));
            const lan = JSON.parse(await this.configHttpClient.get('/info?module=General&submodule=Lan&parameter=Mac'));

            const boardSerial = board?.General?.Board?.SerialBoardBox?.Val;
            const time = board?.General?.Board?.Time?.Val;
            const mac = lan?.General?.Lan?.Mac?.Val;
            if (typeof boardSerial !== 'string' || typeof time !== 'number' || typeof mac !== 'string') {
                throw new Error('Unable to read board serial, MAC address or time for the API key.');
            }

            this.apiKey = generateDucoApiKey(boardSerial, mac, time);
            this.apiKeyTimestamp = Date.now();
        }

        return { 'Api-Key': this.apiKey };
    }
}