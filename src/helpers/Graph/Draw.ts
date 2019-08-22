import * as d3 from 'd3';
import { Simulation } from 'd3';
import { DependencyLink, DependencyNode, Network } from '../../components/types';

export const draw = (network: Network, container: HTMLDivElement) => {
    const { nodes, links } = network;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = 6;

    const simulation = d3
        .forceSimulation(nodes)
        .force(
            'dependency',
            d3
                .forceLink<DependencyNode, DependencyLink>(links)
                .distance(60)
                .id((node: DependencyNode) => node.name)
        )
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('y', d3.forceY(0.5))
        .force('nodeCollision', d3.forceCollide().radius(35));

    const svgContainer = d3
        .select(`#${container.id}`)
        .append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height);

    const zoomLayer = svgContainer.append('g');

    const zoomed = () => {
        zoomLayer.attr('transform', d3.event.transform);
    };

    svgContainer
        .call(
            d3
                .zoom<SVGSVGElement, any>()
                .scaleExtent([1 / 2, 12])
                .on('zoom', zoomed)
        )
        .on('dblclick.zoom', null);

    // Section for creating shapes used on GRAPH (arrow as provider and circle as client)
    svgContainer
        .append('svg:defs')
        .append('svg:marker')
        .attr('id', 'provider')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 18)
        .attr('refY', 0)
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5,z');

    // Lines used to show relation between services
    const linkNodes = zoomLayer
        .append('g')
        .attr('stroke', '#999')
        .attr('id', 'dependencies')
        .attr('stroke-opacity', 0.6)
        .selectAll('line.link')
        .data(links)
        .enter()
        .append('svg:path')
        .attr('class', 'link')
        .style('stroke', '#000000')
        .attr('marker-start', 'url(#client)')
        .attr('marker-end', 'url(#provider)')
        .style('stroke-width', 1);

    const labelNodes = zoomLayer
        .append('g')
        .attr('id', 'label')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .attr('fill', '#00a887')
        .text(d => d.name);

    // Dots used to show services
    const serviceNodes = zoomLayer
        .append('g')
        .attr('id', 'services')
        .attr('stroke-width', 0)
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('stroke', 'black')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1)
        .attr('fill', '#00a887')
        .attr('r', 8)
        .call(handleDrag(simulation))
        .on('dblclick', (node: DependencyNode) => highlight(node, serviceNodes, linkNodes, labelNodes, links));
    // Setting values for each element of graph services, dependencies and labels
    simulation.on('tick', () => {
        linkNodes.attr(
            'd',
            (link: DependencyLink) => 'M' + link.source.x + ',' + link.source.y + ', ' + link.target.x + ',' + link.target.y
        );
        serviceNodes
            .attr('cx', (node: DependencyNode) => (node.x = Math.max(radius, Math.min(width - radius, node.x!))))
            .attr('cy', (node: DependencyNode) => (node.y = Math.max(radius, Math.min(height - radius, node.y!))));

        labelNodes
            .attr('x', (node: DependencyNode) => {
                if (node.x) {
                    return node.x - node.name.length * 3.4;
                }
                return null;
            })
            .attr('y', (node: DependencyNode) => {
                if (node.y) {
                    return node.y - 12;
                }
                return null;
            });
    });

    return svgContainer.node();
};

const handleDrag = (simulation: Simulation<DependencyNode, DependencyLink>) => {
    function dragStarted(node: DependencyNode) {
        if (!d3.event.active) {
            simulation.alphaTarget(0.3).restart();
        }
        node.fx = node.x;
        node.fy = node.y;
    }

    function dragged(node: DependencyNode) {
        node.fx = d3.event.x;
        node.fy = d3.event.y;
    }

    function dragEnded(node: DependencyNode) {
        if (!d3.event.active) {
            simulation.alphaTarget(0);
        }
        node.fx = null;
        node.fy = null;
    }

    return d3
        .drag<SVGCircleElement, DependencyNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded);
};

export function areNodesDirectlyConnected(a: DependencyNode, b: DependencyNode, links: DependencyLink[]) {
    return links.some(link => link.source.index === a.index && link.target.index === b.index) || a.index === b.index;
}

function highlight(clickedNode: any, serviceNodes: any, linkNodes: any, labelNodes: any, links: any[]) {
    serviceNodes.style('opacity', (node: DependencyNode) => {
        return areNodesDirectlyConnected(clickedNode, node, links) || areNodesDirectlyConnected(node, clickedNode, links) ? 1 : 0.1;
    });

    linkNodes.style('opacity', (link: DependencyLink) => {
        return clickedNode.index === link.source.index || clickedNode.index === link.target.index ? 1 : 0.1;
    });

    labelNodes.style('opacity', (node: DependencyNode) => {
        return areNodesDirectlyConnected(clickedNode, node, links) || areNodesDirectlyConnected(node, clickedNode, links) ? 1 : 0.1;
    });
}
