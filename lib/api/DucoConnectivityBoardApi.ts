'use strict';

import Homey from 'homey/lib/Homey';
import NodeInterface from './types/NodeInterface';
import PostNodeAction from './types/PostNodeAction';
import HttpClient from './HttpClient';
import DucoApi from './types/DucoApi';
import DucoBox from '../types/DucoBox';

export default class DucoConnectivityBoardApi implements DucoApi {

    httpClient: HttpClient

    constructor(homey: Homey, ducoBox: DucoBox) {
        this.httpClient = new HttpClient(homey, ducoBox.hostname, ducoBox.useHttps);
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
}