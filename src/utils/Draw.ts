import { DependencyNode, Network } from '../components/types';
import { handleDrag, highlight, LevelStorage, setResetViewHandler, zoomToHighLightedNodes } from './helpers/GraphHelpers';
import { event } from 'd3-selection';
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
    setKeyboardDependencyHighlightHandler,
} from './helpers/DrawHelpers';

export const draw = (network: Network, container: HTMLDivElement) => {
    const { nodes, links } = network;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const simulation = createSimulation(nodes, links, width, height);
    const svgContainer = createSVGContainer(container, width, height);
    const zoomLayer = createZoom(svgContainer);

    setResetViewHandler();

    createMarkers(svgContainer);

    createHighlightBackground(zoomLayer);

    const labelNodesGroup = zoomLayer.append('g').attr('id', 'labels');
    const linkElements = createLinkElements(zoomLayer, links);

    createTextElements(labelNodesGroup, nodes);
    createLabels(labelNodesGroup, nodes);

    createDetailsButton(zoomLayer);

    labelNodesGroup
        .selectAll<SVGGElement, DependencyNode>('g')
        .on('click', (node: DependencyNode) => {
            LevelStorage.reset();
            if (node.links.length) {
                highlight(node, linkElements);
                zoomToHighLightedNodes();
            }
            event.stopPropagation();
        })
        .call(handleDrag(simulation));

    setKeyboardDependencyHighlightHandler();

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
