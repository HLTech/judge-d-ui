import { DependencyLink, DependencyNode, Network } from '../components/types';
import {
    createSimulation,
    createSVGContainer,
    createZoom,
    generateLabelPath,
    generateMarkers,
    generateLinkPath,
    handleDrag,
} from './helpers/GraphHelpers';

export const draw = (network: Network, container: HTMLDivElement) => {
    const { nodes, links } = network;

    const width = container.clientWidth + 500;
    const height = container.clientHeight + 500;

    const simulation = createSimulation(nodes, links, width, height);
    const svgContainer = createSVGContainer(container, width, height);

    const zoomLayer = createZoom(svgContainer);

    generateMarkers(svgContainer);

    const linkElements = zoomLayer
        .append('g')
        .attr('id', 'links')
        .selectAll<Element, DependencyLink>('line.link')
        .data(links)
        .enter()
        .append<Element>('svg:path')
        .attr('class', 'link')
        .attr('marker-end', 'url(#provider)')
        .style('stroke-width', 1)
        .attr('stroke-opacity', 0.12);

    const labelNodes = zoomLayer.append('g').attr('id', 'labels');

    labelNodes
        .selectAll<Element, DependencyNode>('g#labels')
        .data(nodes)
        .enter()
        .append<SVGGElement>('g')
        .call(handleDrag(simulation))
        .append('text')
        .attr('fill', '#5E6063')
        .attr('cursor', 'default')
        .text(d => d.name);

    labelNodes
        .selectAll('g')
        .data(nodes)
        .append<SVGPathElement>('svg:path')
        .attr('class', 'label')
        .attr('fill', '#dcdee0')
        .attr('d', generateLabelPath);

    simulation.on('tick', () => {
        linkElements.each(generateLinkPath);

        labelNodes
            .selectAll('text')
            .data(nodes)
            .attr('x', (node: DependencyNode) => (node.x ? node.x : null))
            .attr('y', (node: DependencyNode) => (node.y ? node.y : null));

        labelNodes
            .selectAll<Element, DependencyNode>('path')
            .attr('transform', (node: DependencyNode) =>
                node.x && node.y ? 'translate(' + (node.x - 30) + ',' + (node.y - 55) + ')' : null
            )
            .lower();
    });

    return svgContainer.node();
};
