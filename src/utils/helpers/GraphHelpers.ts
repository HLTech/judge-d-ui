import { DependencyLink, DependencyNode, NodeSelection, RenderedDependencyNode } from '../../components/types';
import { event, select, selectAll, BaseType } from 'd3-selection';
import { Simulation } from 'd3-force';
import { drag } from 'd3-drag';
import { zoom, zoomIdentity } from 'd3-zoom';
import { BACKGROUND_HIGHLIGHT_OPACITY, BASE_FONT_SIZE, LabelColors, ElementIds, TextColors, TRANSITION_DURATION } from '../AppConsts';
import { removeTooltipOnNodeHoverSubscription, subscribeToShowTooltipOnNodeHover, ZoomScaleStorage } from './UserEventHelpers';
import {
    selectAllLinks,
    selectAllNodes,
    selectById,
    selectOverviewContainer,
    selectDetailsButtonRect,
    selectDetailsButtonText,
    selectDetailsButtonWrapper,
    selectHighlightBackground,
    selectHighLightedNodes,
} from './Selectors';

export function getLabelTextDimensions(node: Node) {
    const textNode = select<SVGGElement, DependencyNode>(node.previousSibling as SVGGElement).node();

    if (!textNode) {
        return undefined;
    }

    return textNode.getBBox();
}

export function getNodeDimensions(selectedNode: DependencyNode): { width: number; height: number } {
    const foundNode = selectAllNodes()
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

export function highlight(clickedNode: DependencyNode) {
    const linksData = selectAllLinks().data();
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

function getDefaultScaleValue<T extends BaseType>(container: NodeSelection<T>, dimension: ReturnType<typeof findGroupBackgroundDimension>) {
    if (!dimension) {
        return 1;
    }
    const containerWidth = Number(container.attr('width'));
    const containerHeight = Number(container.attr('height'));

    const maxScaleValue = 1.3;
    const dimensionToContainerSizeRatio = Math.max(dimension.width / containerWidth, dimension.height / containerHeight);

    return Math.min(maxScaleValue, 0.9 / dimensionToContainerSizeRatio);
}

export function centerScreenToDimension(dimension: ReturnType<typeof findGroupBackgroundDimension>, scale?: number) {
    if (!dimension) {
        return;
    }

    const svgContainer = selectOverviewContainer();

    const width = Number(svgContainer.attr('width'));
    const height = Number(svgContainer.attr('height'));

    const scaleValue = scale || getDefaultScaleValue(svgContainer, dimension);

    ZoomScaleStorage.setScale(scaleValue);
    svgContainer
        .transition()
        .duration(TRANSITION_DURATION)
        .call(
            zoom<any, any>().on('zoom', changeZoom(ElementIds.OVERVIEW_ZOOM)).transform,
            zoomIdentity
                .translate(width / 2, height / 2)
                .scale(scaleValue)
                .translate(-dimension.x - dimension.width / 2, -dimension.y - dimension.height / 2)
        );
}

export function hideHighlightBackground() {
    const detailsButtonRectSelection = selectDetailsButtonRect();
    const detailsButtonTextSelection = selectDetailsButtonText();
    selectAll([selectHighlightBackground().node(), detailsButtonRectSelection.node(), detailsButtonTextSelection.node()])
        .transition()
        .duration(TRANSITION_DURATION)
        .style('opacity', 0)
        .end()
        .then(() => {
            selectDetailsButtonWrapper().lower();
        });
}

function getButtonDimension(dimension: ReturnType<typeof findGroupBackgroundDimension>, scale: number) {
    if (!dimension) {
        return {
            buttonWidth: 0,
            buttonHeight: 0,
            buttonMarginBottom: 0,
            buttonMarginRight: 0,
            buttonX: 0,
            buttonY: 0,
            buttonRadius: 0,
            buttonTextFontSize: 0,
            buttonTextPositionX: 0,
            buttonTextPositionY: 0,
        };
    }
    const scaleMultiplier = 1 / scale;

    const buttonWidth = 100 * scaleMultiplier;
    const buttonHeight = 60 * scaleMultiplier;
    const buttonMarginBottom = 10 * scaleMultiplier;
    const buttonMarginRight = 40 * scaleMultiplier;
    const buttonX = dimension.x + dimension.width - buttonWidth - buttonMarginRight;
    const buttonY = dimension.y + dimension.height - buttonHeight - buttonMarginBottom;
    const buttonRadius = 5 * scaleMultiplier;
    const buttonTextFontSize = BASE_FONT_SIZE * scaleMultiplier;
    const buttonTextPositionX = dimension.x + dimension.width - buttonWidth / 2 - buttonMarginRight;
    const buttonTextPositionY = dimension.y + dimension.height - buttonHeight / 2 + 6 * scaleMultiplier - buttonMarginBottom;
    return {
        buttonWidth,
        buttonHeight,
        buttonMarginBottom,
        buttonMarginRight,
        buttonX,
        buttonY,
        buttonRadius,
        buttonTextFontSize,
        buttonTextPositionX,
        buttonTextPositionY,
    };
}

function showHighlightBackground(dimension: ReturnType<typeof findGroupBackgroundDimension>) {
    if (!dimension) {
        return;
    }
    const highlightBackground = selectHighlightBackground();
    const detailsButtonRectSelection = selectDetailsButtonRect();
    const detailsButtonTextSelection = selectDetailsButtonText();

    const isBackgroundActive = highlightBackground.style('opacity') === String(BACKGROUND_HIGHLIGHT_OPACITY);

    const scale = ZoomScaleStorage.getScale();

    const {
        buttonWidth,
        buttonHeight,
        buttonX,
        buttonY,
        buttonRadius,
        buttonTextFontSize,
        buttonTextPositionX,
        buttonTextPositionY,
    } = getButtonDimension(dimension, scale);

    const elementsNextAttributes = [
        {
            x: dimension.x,
            y: dimension.y,
            width: dimension.width,
            height: dimension.height,
            opacity: BACKGROUND_HIGHLIGHT_OPACITY,
        },
        {
            x: buttonX,
            y: buttonY,
            rx: buttonRadius,
            ry: buttonRadius,
            width: buttonWidth,
            height: buttonHeight,
            opacity: 1,
        },
        {
            fontSize: buttonTextFontSize,
            x: buttonTextPositionX,
            y: buttonTextPositionY,
            opacity: 1,
        },
    ];

    if (isBackgroundActive) {
        selectAll([highlightBackground.node(), detailsButtonRectSelection.node(), detailsButtonTextSelection.node()])
            .data(elementsNextAttributes)
            .transition()
            .duration(TRANSITION_DURATION)
            .attr('x', data => data.x)
            .attr('y', data => data.y)
            .attr('rx', data => data.rx || 0)
            .attr('ry', data => data.ry || 0)
            .attr('width', data => data.width || 0)
            .attr('height', data => data.height || 0)
            .attr('font-size', data => data.fontSize || 0);
    } else {
        selectDetailsButtonWrapper().raise();
        selectAll([highlightBackground.node(), detailsButtonRectSelection.node(), detailsButtonTextSelection.node()])
            .data(elementsNextAttributes)
            .attr('x', data => data.x)
            .attr('y', data => data.y)
            .attr('rx', data => data.rx || 0)
            .attr('ry', data => data.ry || 0)
            .attr('width', data => data.width || 0)
            .attr('height', data => data.height || 0)
            .attr('font-size', data => data.fontSize || 0)
            .transition()
            .duration(TRANSITION_DURATION)
            .style('opacity', data => data.opacity);
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

    clickedNode.level = 1;

    nodesToVisit.push(clickedNode);

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
    const { isConsumer, isProvider, level } = node;

    if (level === 1) {
        return LabelColors.FOCUSED;
    }

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
    let isDragStarted = false;
    return drag<SVGGElement, DependencyNode>()
        .on('start', (node: DependencyNode) => {
            if (!selectHighLightedNodes().data().length) {
                dragStarted(node, simulation);
                isDragStarted = true;
                removeTooltipOnNodeHoverSubscription();
            }
        })
        .on('drag', (node: DependencyNode) => {
            if (isDragStarted) {
                dragged(node);
            }
        })
        .on('end', (node: DependencyNode) => {
            dragEnded(node, simulation);
            isDragStarted = false;
            subscribeToShowTooltipOnNodeHover();
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

export const changeZoom = (zoomSelector: ElementIds.OVERVIEW_ZOOM | ElementIds.DETAILS_ZOOM) => () => {
    const { transform } = event;
    const zoomLayer = selectById(zoomSelector);
    zoomLayer.attr('transform', transform);
    zoomLayer.attr('stroke-width', 1 / transform.k);
    ZoomScaleStorage.setScale(transform.k);
};

export function getRenderedNodes(nodes: DependencyNode[]): RenderedDependencyNode[] {
    return nodes.filter(
        (node): node is RenderedDependencyNode =>
            node.x !== undefined && node.y !== undefined && node.width !== undefined && node.height !== undefined
    );
}

export function findGroupBackgroundDimension(nodesGroup: DependencyNode[]) {
    const renderedNodes = getRenderedNodes(nodesGroup);
    if (renderedNodes.length === 0) {
        return;
    }

    let upperLimitNode = renderedNodes[0];
    let lowerLimitNode = renderedNodes[0];
    let leftLimitNode = renderedNodes[0];
    let rightLimitNode = renderedNodes[0];

    renderedNodes.forEach(node => {
        if (node.x + node.width > rightLimitNode.x + rightLimitNode.width) {
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
    const width = rightLimitNode.x && rightLimitNode.width ? rightLimitNode.x + rightLimitNode.width - leftLimitWithOffset : 0;
    const height = lowerLimitNode.y ? lowerLimitNode.y - upperLimitWithOffset : 0;

    const dimension = {
        x: leftLimitWithOffset,
        y: upperLimitWithOffset,
        width,
        height,
    };

    const container = selectOverviewContainer();

    const scale = getDefaultScaleValue(container, dimension);

    const { buttonHeight, buttonMarginBottom } = getButtonDimension(dimension, scale);

    dimension.height += buttonHeight + buttonMarginBottom * 4;

    return dimension;
}
