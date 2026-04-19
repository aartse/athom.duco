'use strict';

import NodeInterface from './NodeInterface';
import PostNodeAction from './PostNodeAction';

export default interface DucoApi {
    getNodes() : Promise <NodeInterface[]>;
    postNodeAction(nodeId: number, postData: PostNodeAction) : Promise<any>;
}