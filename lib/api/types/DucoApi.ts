'use strict';

import NodeInterface from './NodeInterface';
import PostNodeAction from './PostNodeAction';
import NodeConfig from './NodeConfig';

export default interface DucoApi {
    getNodes() : Promise <NodeInterface[]>;
    postNodeAction(nodeId: number, postData: PostNodeAction) : Promise<any>;

    /**
     * Node configuration (flow levels, timer, ...). Only supported by the Connectivity Board.
     */
    supportsNodeConfig() : boolean;
    getNodeConfig(nodeId: number) : Promise<NodeConfig>;
    patchNodeConfig(nodeId: number, values: Record<string, number>) : Promise<NodeConfig>;
}