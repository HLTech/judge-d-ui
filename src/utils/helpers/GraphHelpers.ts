import { DependencyLink, DependencyNode, LinkSelection, NodeSelection } from '../../components/types';
import { select, event, selectAll } from 'd3-selection';
import { Simulation } from 'd3-force';
import { drag } from 'd3-drag';
import { zoom, zoomIdentity } from 'd3-zoom';
import { BACKGROUND_HIGHLIGHT_OPACITY, LabelColors, Selectors, TextColors, TRANSITION_DURATION } from '../AppConsts';

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
    return select(Selectors.LABELS).selectAll<SVGGElement, DependencyNode>('g');
}

export function selectHighlightBackground() {
    return select(Selectors.HIGHLIGHT_BACKGROUND);
}

function selectDetailsButtonWrapper() {
    return select(Selectors.DETAILS_BUTTON);
}

export function selectDetailsButtonRect() {
    return selectDetailsButtonWrapper().select('rect');
}

export function selectDetailsButtonText() {
    return selectDetailsButtonWrapper().select('text');
}

export function centerScreenToDimension(dimension: ReturnType<typeof findGroupBackgroundDimension>, scale?: number) {
    if (dimension) {
        const svgContainer = select(Selectors.CONTAINER);

        const width = Number(svgContainer.attr('width'));
        const height = Number(svgContainer.attr('height'));

        const scaleValue = scale || Math.min(1.3, 0.9 / Math.max(dimension.width / width, dimension.height / height));

        svgContainer
            .attr('data-scale', scaleValue)
            .transition()
            .duration(TRANSITION_DURATION)
            .call(
                zoom<any, any>().on('zoom', zoomed).transform,
                zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(scaleValue)
                    .translate(-dimension.x - dimension.width / 2, -dimension.y - dimension.height / 2)
            );
    }
}

function getScaleValue() {
    return select(Selectors.CONTAINER).attr('data-scale');
}

function removeHighlightBackground() {
    const detailsButtonRectSelection = selectDetailsButtonRect();
    const detailsButtonTextSelection = selectDetailsButtonText();
    selectAll([selectHighlightBackground().node(), detailsButtonRectSelection.node(), detailsButtonTextSelection.node()])
        .transition()
        .duration(TRANSITION_DURATION)
        .style('opacity', 0);
}

function showHighlightBackground(dimension: ReturnType<typeof findGroupBackgroundDimension>) {
    if (dimension) {
        const highlightBackground = selectHighlightBackground();
        const detailsButtonRectSelection = selectDetailsButtonRect();
        const detailsButtonTextSelection = selectDetailsButtonText();

        const scaleValue = Number(getScaleValue());

        const isBackgroundNotActive = highlightBackground.style('opacity') !== String(BACKGROUND_HIGHLIGHT_OPACITY);

        const scaleMultiplier = 1 / scaleValue;

        const buttonWidth = 100 * scaleMultiplier;
        const buttonHeight = 40 * scaleMultiplier;
        const buttonMargin = 20 * scaleMultiplier;
        const buttonX = dimension.x + dimension.width - buttonWidth - buttonMargin;
        const buttonY = dimension.y + dimension.height - buttonHeight - buttonMargin;
        const buttonTextFontSize = 20 * scaleMultiplier;
        const buttonTextPositionX = dimension.x + dimension.width - buttonWidth / 2 - buttonMargin;
        const buttonTextPositionY = dimension.y + dimension.height - buttonHeight / 2 + 7 * scaleMultiplier - buttonMargin;

        if (isBackgroundNotActive) {
            highlightBackground
                .attr('x', dimension.x)
                .attr('y', dimension.y)
                .attr('width', dimension.width)
                .attr('height', dimension.height)
                .transition()
                .duration(TRANSITION_DURATION)
                .style('opacity', BACKGROUND_HIGHLIGHT_OPACITY);

            detailsButtonRectSelection
                .attr('width', buttonWidth)
                .attr('height', buttonHeight)
                .attr('x', buttonX)
                .attr('y', buttonY)
                .transition()
                .duration(TRANSITION_DURATION)
                .style('opacity', 1);

            detailsButtonTextSelection
                .attr('font-size', buttonTextFontSize)
                .style('text-anchor', 'middle')
                .attr('x', buttonTextPositionX)
                .attr('y', buttonTextPositionY)
                .transition()
                .duration(TRANSITION_DURATION)
                .style('opacity', 1);
        } else {
            const elementsNextAttributes = [
                {
                    x: dimension.x,
                    y: dimension.y,
                    width: dimension.width,
                    height: dimension.height,
                },
                {
                    x: buttonX,
                    y: buttonY,
                    width: buttonWidth,
                    height: buttonHeight,
                },
                {
                    fontSize: buttonTextFontSize,
                    x: buttonTextPositionX,
                    y: buttonTextPositionY,
                },
            ];

            selectAll([highlightBackground.node(), detailsButtonRectSelection.node(), detailsButtonTextSelection.node()])
                .data(elementsNextAttributes)
                .transition()
                .duration(TRANSITION_DURATION)
                .attr('x', data => data.x)
                .attr('y', data => data.y)
                .attr('width', data => data.width || 0)
                .attr('height', data => data.height || 0)
                .attr('font-size', data => data.fontSize || 0);
        }
    }
}

export function zoomToHighLightedNodes() {
    const highlightedNodes = selectHighLightedNodes();
    const dimension = findGroupBackgroundDimension(highlightedNodes.data());

    centerScreenToDimension(dimension);
    showHighlightBackground(dimension);
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
        .on('start', (node: DependencyNode) => {
            if (!selectHighLightedNodes().data().length) {
                dragStarted(node, simulation);
            }
        })
        .on('drag', (node: DependencyNode) => {
            if (!selectHighLightedNodes().data().length) {
                dragged(node);
            }
        })
        .on('end', (node: DependencyNode) => {
            if (!selectHighLightedNodes().data().length) {
                dragEnded(node, simulation);
            }
        });
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
    const zoomLayer = select(Selectors.ZOOM);
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
    const svgContainer = select(Selectors.CONTAINER);
    svgContainer.on('click', () => {
        const highlightedNodes = selectHighLightedNodes();
        if (highlightedNodes.data().length) {
            selectAllNodes().each((node: DependencyNode) => (node.level = 0));

            const dimension = findGroupBackgroundDimension(highlightedNodes.data());

            highlightedNodes.each(function(this: SVGGElement) {
                const labelElement = this.firstElementChild;
                const textElement = this.lastElementChild;

                if (!labelElement || !textElement) {
                    return;
                }

                select<Element, DependencyNode>(labelElement).attr('fill', LabelColors.DEFAULT);
                select<Element, DependencyNode>(textElement).style('fill', TextColors.DEFAULT);
            });

            removeHighlightBackground();

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
