import { TreeNode } from '../../components/types';
import { selectDetailsContainerDiv, selectDetailsExitButtonWrapper, selectDetailsViewContainer, selectDetailsZoom } from './Selectors';
import { ElementColors, FAST_TRANSITION_DURATION, ElementIds } from '../AppConsts';
import { hierarchy, HierarchyPointNode, tree, HierarchyPointLink } from 'd3-hierarchy';
import { create, linkHorizontal, zoom, zoomIdentity, symbol, symbolCross } from 'd3';
import { createZoom } from './DrawHelpers';
import { changeZoom } from './GraphHelpers';

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
    createZoom(container, ElementIds.ZOOM_DETAILS);
    container.call(
        zoom<SVGSVGElement, unknown>().on('zoom', changeZoom(ElementIds.ZOOM_DETAILS)).transform,
        // rough center screen on diagram's root node
        zoomIdentity.translate(-width / 5.3, -height / 2.65)
    );
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

    return svg.node();
}

function transformDiagramElement(xOffset: number, yOffset: number, drawToLeft: boolean) {
    return `translate(${xOffset},${yOffset}) ${drawToLeft ? 'rotate(180)' : ''}`;
}

function createDiagrams(
    container: ReturnType<typeof selectDetailsViewContainer>,
    consumersData: TreeStructure,
    providersData: TreeStructure,
    width: number,
    height: number
) {
    const consumersTree = createTree(consumersData);
    const providersTree = createTree(providersData);

    const consumersRootYPosition = getRootYPosition(consumersTree);
    const providersRootYPosition = getRootYPosition(providersTree);

    const rootNodeYOffset = Math.max(consumersRootYPosition, providersRootYPosition);

    const consumersDiagram = createDiagram(consumersTree, width, height, rootNodeYOffset, true);
    const providersDiagram = createDiagram(providersTree, width, height, rootNodeYOffset);

    if (providersDiagram) {
        container.append<SVGSVGElement>(() => providersDiagram);
    }

    if (consumersDiagram) {
        container.append<SVGSVGElement>(() => consumersDiagram);
    }
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
