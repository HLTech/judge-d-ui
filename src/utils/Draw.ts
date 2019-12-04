import { DependencyNode, Network } from '../components/types';
import { handleDrag } from './helpers/GraphHelpers';
import {
    createDetailsButton,
    createHighlightBackground,
    createLabels,
    createLinkElements,
    createLinkPath,
    createMarkers,
    createSimulation,
    createSVGContainer,
    createTextElements,
    createZoom,
} from './helpers/DrawHelpers';
import {
    subscribeToChangeHighlightRangeOnArrowKey,
    subscribeToCloseDetails,
    subscribeToHighlight,
    subscribeToOpenDetails,
    subscribeToResetHighlight,
    subscribeToZoomOnArrowKey,
} from './helpers/UserEventHelpers';
import { createDetailsViewContainer } from './helpers/DetailsDrawHelpers';
import { ElementIds } from './AppConsts';

export const draw = (network: Network, container: HTMLDivElement) => {
    const { nodes, links, detailsNodes } = network;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const simulation = createSimulation(nodes, links, width, height);
    const svgContainer = createSVGContainer(width, height);
    const zoomLayer = createZoom(svgContainer, ElementIds.ZOOM_OVERVIEW);

    createMarkers(svgContainer);

    createHighlightBackground(zoomLayer);

    const labelNodesGroup = zoomLayer.append('g').attr('id', ElementIds.LABELS);
    const linkElements = createLinkElements(zoomLayer, links);

    createTextElements(labelNodesGroup, nodes);
    createLabels(labelNodesGroup, nodes);
    createDetailsButton(zoomLayer);
    createDetailsViewContainer(container.clientWidth, container.clientHeight);

    labelNodesGroup.selectAll<SVGGElement, DependencyNode>('g').call(handleDrag(simulation));

    subscribeToHighlight();
    subscribeToResetHighlight();
    subscribeToChangeHighlightRangeOnArrowKey();
    subscribeToZoomOnArrowKey();
    subscribeToOpenDetails(detailsNodes);
    subscribeToCloseDetails();

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

    return svgContainer.node();
};
