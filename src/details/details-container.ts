import {
    selectDetailsContainerDiv,
    selectDetailsExitButtonWrapper,
    selectDetailsRootNodeContainer,
    selectDetailsViewContainer,
    selectDetailsZoom,
} from '../utils/helpers/Selectors';
import { Colors, ElementIds, FAST_TRANSITION_DURATION } from '../utils/AppConsts';
import { symbol, symbolCross, zoom, zoomIdentity } from 'd3';
import { changeZoom, createZoom } from '../zoom/zoom';
import { TreeNode } from '../components/types';
import { createRootNode } from './root-node';
import { mapNodeToTreeStructure, TreeStructure } from './details-mappers';
import { createDiagram, createTree, getRootYPosition } from './details-diagram';

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
        .attr('fill', Colors.WHITE);
    createZoom(container, ElementIds.DETAILS_ZOOM);
    createDetailsExitButton();
}

function createDetailsExitButton() {
    selectDetailsViewContainer()
        .append('g')
        .attr('id', ElementIds.DETAILS_EXIT_BUTTON)
        .attr('cursor', 'pointer')
        .append('rect')
        .attr('transform', 'translate(5,5)')
        .attr('width', 10)
        .attr('height', 10)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', Colors.WHITE);
    selectDetailsExitButtonWrapper()
        .append('path')
        .attr('transform', 'translate(10,10) rotate(45)')
        .attr(
            'd',
            symbol()
                .type(symbolCross)
                .size(20)
        );
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
