import { NodeSelection, TreeNode } from '../../components/types';
import {
    selectDetailsContainerDiv,
    selectDetailsExitButtonWrapper,
    selectDetailsRootNodeContainer,
    selectDetailsViewContainer,
    selectDetailsZoom,
} from './Selectors';
import { ElementColors, ElementIds, FAST_TRANSITION_DURATION, LabelColors, TextColors } from '../AppConsts';
import { hierarchy, HierarchyPointLink, HierarchyPointNode, tree } from 'd3-hierarchy';
import { create, linkHorizontal, symbol, symbolCross, zoom, zoomIdentity } from 'd3';
import { createLabelPath, createZoom } from './DrawHelpers';
import { changeZoom, getTextDimensions } from './GraphHelpers';

export function createDetailsViewContainer(width: number, height: number) {
    const containerWidth = width * 4;
    const containerHeight = height * 4;

    const container = selectDetailsContainerDiv()
        .style('display', 'none')
        .style('opacity', 0)
        .append('svg')
        .attr('id', ElementIds.DETAILS_VIEW_CONTAINER)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    container
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', ElementColors.DETAILS_BACKGROUND);
    container
        .append('g')
        .attr('id', ElementIds.DETAILS_EXIT_BUTTON)
        .attr('cursor', 'pointer')
        .append('rect')
        .attr('transform', 'translate(5,5)')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', ElementColors.DETAILS_BACKGROUND);
    selectDetailsExitButtonWrapper()
        .append('path')
        .attr('transform', 'translate(10,10) rotate(45)')
        .attr(
            'd',
            symbol()
                .type(symbolCross)
                .size(20)
        );
    createZoom(container, ElementIds.DETAILS_ZOOM);
}

function resetZoomPosition() {
    const detailsContainerDiv = selectDetailsContainerDiv().node();
    const { width, height } = detailsContainerDiv ? detailsContainerDiv.getBoundingClientRect() : { width: 0, height: 0 };

    const container = selectDetailsViewContainer();

    container.call(
        zoom<SVGSVGElement, unknown>().on('zoom', changeZoom(ElementIds.DETAILS_ZOOM)).transform,
        // rough center screen on diagram's root node
        zoomIdentity.translate(-width / 5.3, -height / 2.65)
    );
}

// these magic numbers(-30, -36.5) are dependant of how node labels are painted relative to label text
const labelPathWidthOffset = -30;
const labelPathHeightOffset = -36.5;

async function createRootNode(
    container: NodeSelection<any>,
    viewboxWidth: number,
    viexboxHeight: number,
    rootNodeName: string,
    isConsumer: boolean,
    isProvider: boolean
) {
    const nodeContainer = container
        .append('svg')
        .attr('id', ElementIds.DETAILS_ROOT_NODE_CONTAINER)
        .attr('font-size', 15)
        // hard-coded magic numbers that translates root node to position of root of the tree graphs
        .attr('viewBox', `-${viewboxWidth / 3.2} -${viexboxHeight / 2} ${viewboxWidth} ${viexboxHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    const label = nodeContainer.append('path').attr('fill', LabelColors.FOCUSED);
    const text = nodeContainer
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', TextColors.HIGHLIGHTED)
        .text(rootNodeName);
    await delayPromise();
    const { height, x, y } = getTextDimensions(text.node()) || { height: 0, x: 0, y: 0 };
    const labelPath = createLabelPath.call(label.node(), isConsumer, isProvider);
    label.attr('d', labelPath).attr('transform', `translate(${x + labelPathWidthOffset}, ${y + labelPathHeightOffset})`);
    // center text vertically on label
    text.attr('y', y + height + 1);
}

function delayPromise(delay: number = 0) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

interface TreeStructure {
    name: string;
    children?: TreeStructure[];
}

type TreeNodeWithVisitedFlag = TreeNode & { isVisited?: boolean };

function mapNodeToTreeStructure(node: TreeNodeWithVisitedFlag, linksType: 'consumers' | 'providers'): TreeStructure {
    node.isVisited = true;
    const unvisitedLinks = node[linksType].filter((linkedNode: TreeNodeWithVisitedFlag) => !linkedNode.isVisited && linkedNode[linksType]);
    const children = unvisitedLinks.map(nestedNode => mapNodeToTreeStructure(nestedNode, linksType));
    node.isVisited = undefined;
    return { name: node.name, children };
}

const VERTICAL_DISTANCE_BETWEEN_NODES = 40;
const HORIZONTAL_DISTANCE_BETWEEN_NODES = 300;

const NODE_NEIGHBOURS_SEPARATION_MULTIPLIER = 1;
const NODE_NORMAL_SEPARATION_MULTIPLIER = 4;

function createTree(data: TreeStructure) {
    const node = hierarchy(data);
    return tree<TreeStructure>()
        .nodeSize([VERTICAL_DISTANCE_BETWEEN_NODES, HORIZONTAL_DISTANCE_BETWEEN_NODES])
        .separation((node1, node2) =>
            node1.parent === node2.parent ? NODE_NEIGHBOURS_SEPARATION_MULTIPLIER : NODE_NORMAL_SEPARATION_MULTIPLIER
        )(node);
}

function getRootYPosition(data: HierarchyPointNode<TreeStructure>) {
    let x0 = Infinity;
    data.each(node => {
        if (node.x < x0) x0 = node.x;
    });
    return VERTICAL_DISTANCE_BETWEEN_NODES - x0;
}

function createDiagram(
    tree: HierarchyPointNode<TreeStructure>,
    containerWidth: number,
    containerHeight: number,
    rootNodeYOffset: number,
    drawToLeft: boolean = false
) {
    if (!tree.children || !tree.children.length) {
        return null;
    }

    const diagramWidth = containerWidth / 2;
    const diagramXOffset = -diagramWidth / 8;
    const diagramYOffset = -containerHeight / 2;

    const svg = create('svg').attr('viewBox', `${diagramXOffset} ${diagramYOffset + rootNodeYOffset} ${diagramWidth} ${containerHeight}`);

    const g = svg
        .append('g')
        .attr('font-size', 15)
        .attr('transform', transformDiagramElement(0, rootNodeYOffset, drawToLeft));

    g.append('g')
        .attr('fill', 'none')
        .attr('stroke', ElementColors.DETAILS_LINK)
        .attr('stroke-width', 2)
        .selectAll('path')
        .data(tree.links())
        .join('path')
        .attr(
            'd',
            linkHorizontal<HierarchyPointLink<TreeStructure>, HierarchyPointNode<TreeStructure>>()
                .x(d => d.y)
                .y(d => d.x)
        );

    const node = g
        .append('g')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-width', 3)
        .selectAll('g')
        .data(tree.descendants())
        .join('g')
        .attr('transform', d => transformDiagramElement(d.y, d.x, drawToLeft));

    node.append('text')
        .attr('dy', '0.31em')
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .style('background-color', '#ffffff')
        .text(node => node.data.name)
        .clone(true)
        .lower()
        .attr('stroke-width', 4)
        .attr('stroke', 'white');

    return svg;
}

function transformDiagramElement(xOffset: number, yOffset: number, drawToLeft: boolean) {
    return `translate(${xOffset},${yOffset}) ${drawToLeft ? 'rotate(180)' : ''}`;
}

async function createDiagrams(
    container: ReturnType<typeof selectDetailsZoom>,
    consumersData: TreeStructure,
    providersData: TreeStructure,
    width: number,
    height: number
) {
    const rootNodeName = consumersData.name || providersData.name;
    consumersData.name = '';
    providersData.name = '';
    const consumersTree = createTree(consumersData);
    const providersTree = createTree(providersData);

    const consumersRootYPosition = getRootYPosition(consumersTree);
    const providersRootYPosition = getRootYPosition(providersTree);

    const rootNodeYOffset = Math.max(consumersRootYPosition, providersRootYPosition);

    const consumersDiagram = createDiagram(consumersTree, width, height, rootNodeYOffset, true);
    const providersDiagram = createDiagram(providersTree, width, height, rootNodeYOffset);

    await createRootNode(container, width, height, rootNodeName, Boolean(providersDiagram), Boolean(consumersDiagram));

    const detailsRootNodeContainer = selectDetailsRootNodeContainer();
    const detailsRootNodeBBox = detailsRootNodeContainer.node()?.getBBox() || { width: 0, x: 0 };

    const providersDiagramNode = providersDiagram?.node();
    const consumersDiagramNode = consumersDiagram?.node();

    const xOffsetFromRootNodeCenter = detailsRootNodeBBox.width / 7;

    if (providersDiagramNode) {
        providersDiagram?.attr('x', xOffsetFromRootNodeCenter);
        container.append<SVGSVGElement>(() => providersDiagramNode);
    }

    if (consumersDiagramNode) {
        consumersDiagram?.attr('x', -xOffsetFromRootNodeCenter);
        container.append<SVGSVGElement>(() => consumersDiagramNode);
    }

    detailsRootNodeContainer.raise();
}

export function initializeDetailsView(node: TreeNode) {
    const consumerNodes = mapNodeToTreeStructure(node, 'consumers');
    const providerNodes = mapNodeToTreeStructure(node, 'providers');

    const detailsViewContainer = selectDetailsViewContainer();
    const width = Number(detailsViewContainer.attr('width'));
    const height = Number(detailsViewContainer.attr('height'));

    const detailsZoom = selectDetailsZoom();
    createDiagrams(detailsZoom, consumerNodes, providerNodes, width, height);
    switchDetailsVisibility();

    resetZoomPosition();
}

export function shutdownDetailsView() {
    switchDetailsVisibility();
    deleteDiagrams();
}

function deleteDiagrams() {
    selectDetailsZoom()
        .transition()
        .selectAll('*')
        .remove();
}

export function switchDetailsVisibility() {
    const container = selectDetailsContainerDiv();
    const isVisible = container.style('display') === 'block';
    if (isVisible) {
        container
            .transition()
            .duration(FAST_TRANSITION_DURATION)
            .style('opacity', 0)
            .transition()
            .style('display', 'none');
    } else {
        container
            .style('display', 'block')
            .transition()
            .duration(FAST_TRANSITION_DURATION)
            .style('opacity', 1);
    }
}
