import { DependencyLink, DependencyNode } from '../../components/types';
import { select, Selection, event, BaseType } from 'd3-selection';
import { Simulation } from 'd3-force';
import { drag } from 'd3-drag';
import { zoom, zoomIdentity } from 'd3-zoom';

export type NodeSelection<T extends BaseType> = Selection<T, DependencyNode, Element, HTMLElement>;

export type LinkSelection = Selection<SVGPathElement, DependencyLink, SVGGElement, DependencyNode>;

export enum LabelColors {
    PROVIDER = '#00BFC2',
    CONSUMER = '#039881',
    PROVIDER_CONSUMER = '#03939F',
    DEFAULT = '#dcdee0',
}

export enum TextColors {
    HIGHLIGHTED = 'WHITE',
    DEFAULT = '#5E6063',
}

export function getLabelTextDimensions(node: Node) {
    const textNode = select<SVGGElement, DependencyNode>(node.previousSibling as SVGGElement).node();

    if (!textNode) {
        return undefined;
    }

    return textNode.getBBox();
}

export function getNodeDimensions(selectedNode: DependencyNode): { width: number; height: number } {
    const foundNode = select<SVGGElement, DependencyNode>('#labels')
        .selectAll<SVGGElement, DependencyNode>('g')
        .filter((node: DependencyNode) => node.x === selectedNode.x && node.y === selectedNode.y)
        .node();
    return foundNode ? foundNode.getBBox() : { width: 200, height: 25 };
}

export function findMaxDependencyLevel(labelNodesGroup: NodeSelection<SVGGElement>) {
    return (
        Math.max(
            ...labelNodesGroup
                .selectAll<HTMLElement, DependencyNode>('g')
                .filter((node: DependencyNode) => node.level > 0)
                .data()
                .map((node: DependencyNode) => node.level)
        ) - 1
    );
}

export function highlight(clickedNode: DependencyNode, links: LinkSelection) {
    const linksData = links.data();
    const labelNodes = selectAllNodes();

    const visitedNodes = setDependencyLevelOnEachNode(clickedNode, labelNodes.data());

    if (visitedNodes.length === 1) {
        return;
    }

    labelNodes.each(function(this: SVGGElement, node: DependencyNode) {
        const areNodesDirectlyConnected = areNodesConnected(clickedNode, node, linksData);
        const labelElement = this.firstElementChild;
        const textElement = this.lastElementChild;

        if (!labelElement || !textElement) {
            return;
        }

        if (areNodesDirectlyConnected) {
            select<Element, DependencyNode>(labelElement).attr('fill', getHighLightedLabelColor);
            select<Element, DependencyNode>(textElement).style('fill', TextColors.HIGHLIGHTED);
        } else {
            select<Element, DependencyNode>(labelElement).attr('fill', LabelColors.DEFAULT);
            select<Element, DependencyNode>(textElement).style('fill', TextColors.DEFAULT);
        }
    });
}

export function selectHighLightedNodes() {
    return selectAllNodes().filter(function(this: SVGGElement) {
        return this.firstElementChild ? this.firstElementChild.getAttribute('fill') !== LabelColors.DEFAULT : false;
    });
}

export function selectAllNodes() {
    return select('#labels').selectAll<SVGGElement, DependencyNode>('g');
}

export function zoomToHighLightedNodes() {
    const highlightedNodes = selectHighLightedNodes();
    const svgContainer = select('#container');
    const svgContainerNode = select<SVGSVGElement, DependencyNode>('#container').node();
    const dim = findGroupBackgroundDimension(highlightedNodes.data());

    if (!svgContainerNode || !dim) {
        return;
    }

    const width = Number(svgContainerNode.getAttribute('width'));
    const height = Number(svgContainerNode.getAttribute('height'));

    const scaleValue = Math.min(8, 0.9 / Math.max(dim.width / width, dim.height / height));

    svgContainer
        .transition()
        .duration(750)
        .call(
            zoom<any, any>().on('zoom', zoomed).transform,
            zoomIdentity
                .translate(width / 2, height / 2)
                .scale(scaleValue)
                .translate(-dim.x - dim.width / 2, -dim.y - dim.height / 2)
        );
}

export function setDependencyLevelOnEachNode(clickedNode: DependencyNode, nodes: DependencyNode[]): DependencyNode[] {
    nodes.forEach((node: DependencyNode) => (node.level = 0));

    const visitedNodes: DependencyNode[] = [];
    const nodesToVisit: DependencyNode[] = [];

    nodesToVisit.push({ ...clickedNode, level: 1 });

    while (nodesToVisit.length > 0) {
        const currentNode = nodesToVisit.shift();

        if (!currentNode) {
            return [];
        }

        currentNode.links.forEach((node: DependencyNode) => {
            if (!containsNode(visitedNodes, node) && !containsNode(nodesToVisit, node)) {
                node.level = currentNode.level + 1;
                nodesToVisit.push({ ...node, level: currentNode.level + 1 });
            }
        });

        visitedNodes.push(currentNode);
    }

    return visitedNodes;
}

function containsNode(arr: DependencyNode[], node: DependencyNode) {
    return arr.findIndex((el: DependencyNode) => Boolean(el.name === node.name && el.version === node.version)) > -1;
}

export function areNodesConnected(a: DependencyNode, b: DependencyNode, links: DependencyLink[]) {
    return (
        a.index === b.index ||
        links.some(
            link =>
                (link.source.index === a.index && link.target.index === b.index) ||
                (link.source.index === b.index && link.target.index === a.index)
        )
    );
}

export function getHighLightedLabelColor(node: DependencyNode) {
    const { isConsumer, isProvider } = node;

    if (isConsumer && isProvider) {
        return LabelColors.PROVIDER_CONSUMER;
    }

    if (isProvider) {
        return LabelColors.PROVIDER;
    }

    if (isConsumer) {
        return LabelColors.CONSUMER;
    }

    return LabelColors.DEFAULT;
}

export function handleDrag(simulation: Simulation<DependencyNode, DependencyLink>) {
    return drag<SVGGElement, DependencyNode>()
        .on('start', (node: DependencyNode) => dragStarted(node, simulation))
        .on('drag', dragged)
        .on('end', (node: DependencyNode) => dragEnded(node, simulation));
}

function dragStarted(node: DependencyNode, simulation: Simulation<DependencyNode, DependencyLink>) {
    if (!event.active) {
        simulation.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
}

function dragged(node: DependencyNode) {
    node.fx = event.x;
    node.fy = event.y;
}

function dragEnded(node: DependencyNode, simulation: Simulation<DependencyNode, DependencyLink>) {
    if (!event.active) {
        simulation.alphaTarget(0);
    }
    node.fx = null;
    node.fy = null;
}

export function zoomed() {
    const { transform } = event;
    const zoomLayer = select('#zoom');
    zoomLayer.attr('transform', transform);
    zoomLayer.attr('stroke-width', 1 / transform.k);
}

export function findGroupBackgroundDimension(nodesGroup: DependencyNode[]) {
    if (nodesGroup.length === 0) {
        return undefined;
    }

    let upperLimitNode = nodesGroup[0];
    let lowerLimitNode = nodesGroup[0];
    let leftLimitNode = nodesGroup[0];
    let rightLimitNode = nodesGroup[0];

    nodesGroup.forEach((node: DependencyNode) => {
        if (!node.x || !node.y || !rightLimitNode.x || !leftLimitNode.x || !upperLimitNode.y || !lowerLimitNode.y) {
            return;
        }
        if (node.x > rightLimitNode.x) {
            rightLimitNode = node;
        }

        if (node.x < leftLimitNode.x) {
            leftLimitNode = node;
        }

        if (node.y < upperLimitNode.y) {
            upperLimitNode = node;
        }

        if (node.y > lowerLimitNode.y) {
            lowerLimitNode = node;
        }
    });

    const upperLimitWithOffset = upperLimitNode.y ? upperLimitNode.y - 50 : 0;
    const leftLimitWithOffset = leftLimitNode.x ? leftLimitNode.x - 100 : 0;
    const width = rightLimitNode.x && rightLimitNode.width ? rightLimitNode.x + rightLimitNode.width + 50 - leftLimitWithOffset : 0;
    const height = lowerLimitNode.y ? lowerLimitNode.y! + 100 - upperLimitWithOffset : 0;

    return {
        x: leftLimitWithOffset,
        y: upperLimitWithOffset,
        width,
        height,
    };
}

export function setResetViewHandler() {
    LevelStorage.reset();
    const svgContainer = select('#container');
    const zoomLayer = select('#zoom');
    svgContainer.on('dblclick', () => {
        selectAllNodes().each((node: DependencyNode) => (node.level = 0));

        selectHighLightedNodes().each(function(this: SVGGElement) {
            const labelElement = this.firstElementChild;
            const textElement = this.lastElementChild;

            if (!labelElement || !textElement) {
                return;
            }

            select<Element, DependencyNode>(labelElement).attr('fill', LabelColors.DEFAULT);
            select<Element, DependencyNode>(textElement).style('fill', TextColors.DEFAULT);
        });

        svgContainer
            .transition()
            .duration(750)
            .call(zoom<any, any>().on('zoom', () => zoomLayer.attr('transform', event.transform)).transform, zoomIdentity);
    });
}

export class LevelStorage {
    private static level: number = 1;
    private static maxLevel: number = 1;

    public static getLevel(): number {
        return this.level;
    }

    public static increase() {
        this.level = this.level + 1;
    }

    public static decrease() {
        this.level = this.level - 1;
    }

    public static isMax() {
        return this.level < this.maxLevel;
    }

    static isMin() {
        return this.level > 1;
    }

    static setMaxLevel(maxLevel: number) {
        this.maxLevel = maxLevel;
    }

    static getMaxLevel(): number {
        return this.maxLevel;
    }

    public static reset() {
        this.level = 1;
        this.maxLevel = 1;
    }
}
