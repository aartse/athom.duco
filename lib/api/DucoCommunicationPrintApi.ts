'use strict';

import Homey from 'homey/lib/Homey';
import NodeInterface from './types/NodeInterface';
import PostNodeAction from './types/PostNodeAction';
import HttpClient from './HttpClient';
import { NodeInfoGet } from './types/NodeInfoGet';
import DucoApi from './types/DucoApi';
import DucoBox from '../types/DucoBox';

export default class DucoCommunicationPrintApi implements DucoApi {

    httpClient: HttpClient

    constructor(homey: Homey, ducoBox: DucoBox) {
        this.httpClient = new HttpClient(homey, ducoBox.hostname, ducoBox.useHttps);
    }

    async getNodes() : Promise<NodeInterface[]> {
        const response = await this.httpClient.get('/nodelist');
                
        const result = JSON.parse(response) as { nodelist: number[] };
        const nodes: NodeInterface[] = [];

        for (const node of result.nodelist) {
            const response  = await this.httpClient.get('/nodeinfoget?node=' + node);
                
            const result = JSON.parse(response) as NodeInfoGet;
            nodes.push(this.toNodeInterface(result));
        }

        return nodes;
    }

    async postNodeAction(nodeId: number, postData: PostNodeAction) : Promise<void> {
        const response = await this.httpClient.get('/nodesetoperstate?node='+nodeId+'&value='+postData.Val+'&t=' + new Date().getTime())
        const isSuccess = response === `SUCCESS`;
        if (!isSuccess) {
            throw new Error('Error post node action.');
        }
    }

    private toNodeInterface(result: NodeInfoGet) : NodeInterface {
        return {
            Node: result.node,
            General: {
                Type: {
                    Val: result.devtype,
                },
                SubType: {
                    Val: result.subtype,
                },
                NetworkType: {
                    Val: result.netw,
                },
                Parent: {
                    Val: result.prnt,
                },
                Asso: {
                    Val: result.asso,
                },
                Name: {
                    Val: result.location,
                },
                Identify: {
                    Val: 0,
                },
            },
            Ventilation: {
                State: {
                    Val: result.state,
                },
                TimeStateRemain: {
                    Val: result.cntdwn,
                },
                TimeStateEnd: {
                    Val: result.endtime,
                },
                Mode: {
                    Val: result.mode,
                },
                FlowLvlTgt: {
                    Val: result.trgt,
                },
            },
            Sensor: {
                Rh: {
                    Val: result.rh
                },
                IaqRh: {
                    Val: result.snsr
                },
                Co2: {
                    Val: result.co2
                },
                IaqCo2: {
                    Val: result.snsr
                },
            },
        };
    }
}