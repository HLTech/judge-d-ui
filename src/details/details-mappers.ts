import { TreeNode } from '../components/types';

export interface TreeStructure {
    name: string;
    children?: TreeStructure[];
}

type TreeNodeWithVisitedFlag = TreeNode & { isVisited?: boolean };

export function mapNodeToTreeStructure(node: TreeNodeWithVisitedFlag, linksType: 'consumers' | 'providers'): TreeStructure {
    node.isVisited = true;
    const unvisitedLinks = node[linksType].filter((linkedNode: TreeNodeWithVisitedFlag) => !linkedNode.isVisited && linkedNode[linksType]);
    const children = unvisitedLinks.map(nestedNode => mapNodeToTreeStructure(nestedNode, linksType));
    node.isVisited = undefined;
    return { name: node.name, children };
}
