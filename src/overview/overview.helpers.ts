import { DependencyNode, Network, NodeSelection } from '../components/types';
import { selectAllLinks, selectAllNodes, selectOverviewContainer } from '../utils/helpers/Selectors';
import { areNodesConnected, createNodeLabels, createNodes, getHighLightedLabelColor, getRenderedNodes } from './graph-nodes';
import { BaseType, select } from 'd3-selection';
import { ElementIds, Colors, TRANSITION_DURATION } from '../utils/AppConsts';
import { getButtonDimension } from './highlight-background/highlight-background.helpers';
import { ZoomScaleStorage } from '../utils/helpers/UserEventHelpers';
import { zoom, zoomIdentity } from 'd3-zoom';
import { changeZoom, createZoom } from '../zoom/zoom';
import { addNodesDrag, createSimulation } from './simulation/simulation';
import { createSVGContainer } from './overview-container';
import { createLinkMarkersDefinition, createLinkPath, createLinks } from './graph-links';
import { createHighlightBackground } from './highlight-background/highlight-background';
import { createDetailsButton } from './highlight-background/details-button';
import { createTooltip } from './tooltip/tooltip';

export function createOverview(container: HTMLDivElement, network: Network) {
    const { nodes, links } = network;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const simulation = createSimulation(nodes, links, width, height);
    const svgContainer = createSVGContainer(width, height);
    const zoomLayer = createZoom(svgContainer, ElementIds.OVERVIEW_ZOOM);

    createLinkMarkersDefinition(svgContainer);

    createHighlightBackground(zoomLayer);

    const labelNodesGroup = zoomLayer.append('g').attr('id', ElementIds.LABELS);
    const linkElements = createLinks(zoomLayer, links);

    createNodes(labelNodesGroup, nodes);
    createNodeLabels(labelNodesGroup, nodes);
    createDetailsButton(zoomLayer);
    createTooltip(zoomLayer);

    labelNodesGroup.selectAll<SVGGElement, DependencyNode>('g').call(addNodesDrag(simulation));

    simulation.on('tick', () => {
        linkElements.each(createLinkPath);

        labelNodesGroup
            .selectAll('text')
            .data(nodes)
            .attr('x', (node: DependencyNode) => (node.x ? node.x : null))
            .attr('y', (node: DependencyNode) => (node.y ? node.y : null));

        labelNodesGroup
            .selectAll<Element, DependencyNode>('path')
            .attr('transform', (node: DependencyNode) =>
                node.x && node.y ? 'translate(' + (node.x - 30) + ',' + (node.y - 55) + ')' : null
            )
            .lower();
    });
}

export function setDependencyLevelOnEachNode(clickedNode: DependencyNode, nodes: DependencyNode[]): DependencyNode[] {
    nodes.forEach(node => {
        node.level = 0;
    });

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

export function containsNode(arr: DependencyNode[], node: DependencyNode) {
    return arr.findIndex((el: DependencyNode) => compareNodes(el, node)) > -1;
}

export function compareNodes<T extends { name: string; version: string }, K extends { name: string; version: string }>(
    node1: T,
    node2: K
): Boolean {
    return node1.name === node2.name && node1.version === node2.version;
}

export function highlightNodes(clickedNode: DependencyNode) {
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
            select<Element, DependencyNode>(textElement).style('fill', Colors.WHITE);
        } else {
            select<Element, DependencyNode>(labelElement).attr('fill', Colors.LIGHT_GREY);
            select<Element, DependencyNode>(textElement).style('fill', Colors.BASIC_TEXT);
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
