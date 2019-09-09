import { DependencyLink, DependencyNode } from '../../components/types';
import { select, Selection, event, BaseType, selectAll } from 'd3-selection';
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

    links
        .transition()
        .duration(750)
        .style('opacity', function(this: SVGGElement, link: DependencyLink) {
            const areNodesDirectlyConnected =
                areNodesConnected(clickedNode, link.source, linksData) && areNodesConnected(clickedNode, link.target, linksData);
            return areNodesDirectlyConnected ? 1 : 0.2;
        });

    labelNodes.each(function(this: SVGGElement, node: DependencyNode) {
        const areNodesDirectlyConnected = areNodesConnected(clickedNode, node, linksData);
        const labelElement = this.firstElementChild;
        const textElement = this.lastElementChild;

        if (!labelElement || !textElement) {
            return;
        }

        if (areNodesDirectlyConnected) {
            select<Element, DependencyNode>(labelElement)
                .attr('class', 'highlighted')
                .transition()
                .duration(750)
                .attr('fill', getHighLightedLabelColor)
                .style('opacity', 1);
            select<Element, DependencyNode>(textElement)
                .transition()
                .duration(750)
                .style('fill', TextColors.HIGHLIGHTED)
                .style('opacity', 1);;
        } else {
            select<Element, DependencyNode>(labelElement)
                .attr('class', null)
                .transition()
                .duration(750)
                .attr('fill', LabelColors.DEFAULT)
                .style('opacity', 0.2);
            select<Element, DependencyNode>(textElement)
                .transition()
                .duration(750)
                .style('fill', TextColors.DEFAULT)
                .style('opacity', 0.2);
        }
    });
}

export function selectHighLightedNodes() {
    return selectAllNodes().filter(function(this: SVGGElement) {
        return this.firstElementChild ? this.firstElementChild.getAttribute('class') === 'highlighted' : false;
    });
}

export function selectAllNodes() {
    return select('#labels').selectAll<SVGGElement, DependencyNode>('g');
}

export function selectAllLinks() {
    return selectAll<SVGGElement, DependencyLink>('.link');
}

export function centerScreenToDimension(dimension: ReturnType<typeof findGroupBackgroundDimension>, scale?: number) {
    if (dimension) {
        const svgContainer = select('#container');

        const width = Number(svgContainer.attr('width'));
        const height = Number(svgContainer.attr('height'));

        const scaleValue = Math.min(1.3, 0.9 / Math.max(dimension.width / width, dimension.height / height));

        svgContainer
            .transition()
            .duration(750)
            .call(
                zoom<any, any>().on('zoom', zoomed).transform,
                zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(scale || scaleValue)
                    .translate(-dimension.x - dimension.width / 2, -dimension.y - dimension.height / 2)
            );
    }
}

export function zoomToHighLightedNodes() {
    const highlightedNodes = selectHighLightedNodes();
    const dimension = findGroupBackgroundDimension(highlightedNodes.data());

    centerScreenToDimension(dimension);
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
                nodesToVisit.push(node);
            }
        });

        visitedNodes.push(currentNode);
    }

    return visitedNodes;
}

function containsNode(arr: DependencyNode[], node: DependencyNode) {
    return arr.findIndex((el: DependencyNode) => compareNodes(el, node)) > -1;
}

export function compareNodes<T extends { name: string; version: string }, K extends { name: string; version: string }>(
    node1: T,
    node2: K
): Boolean {
    return node1.name === node2.name && node1.version === node2.version;
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
    svgContainer.on('click', () => {
        const highlightedNodes = selectHighLightedNodes();
        if (highlightedNodes.data().length) {
        selectAllLinks()
            .transition()
            .duration(750)
            .style('opacity', 1);

            const dimension = findGroupBackgroundDimension(highlightedNodes.data());

        selectAllNodes().each(function(this: SVGGElement, node: DependencyNode) {
            node.level = 0;
            const labelElement = this.firstElementChild;
            const textElement = this.lastElementChild;

                if (!labelElement || !textElement) {
                    return;
                }

            select<Element, DependencyNode>(labelElement)
                .transition()
                .duration(750)
                .attr('fill', LabelColors.DEFAULT)
                .style('opacity', 1);
            select<Element, DependencyNode>(textElement)
                .transition()
                .duration(750)
                .style('fill', TextColors.DEFAULT)
                .style('opacity', 1);
        });

            centerScreenToDimension(dimension, 1);
        }
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

    public static isBelowMax() {
        return this.level < this.maxLevel;
    }

    static isAboveMin() {
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
