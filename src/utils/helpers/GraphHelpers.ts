import * as d3 from 'd3';
import { DependencyLink, DependencyNode } from '../../components/types';
import { Simulation } from 'd3';

export type GraphContainer = d3.Selection<SVGSVGElement, DependencyNode, Element, HTMLElement>;

export function generateLinkPath(this: Element, link: DependencyLink): void {
    if (!link.source.x || !link.source.y || !link.target.x || !link.target.y) {
        return;
    }

    const xDiff = link.source.x - link.target.x;
    const yDiff = link.source.y - link.target.y;

    const isSourceOnTheLeft = xDiff < 0;
    const isSourceBelowTarget = yDiff > 0;

    const angleInRadians = Math.abs(Math.atan(yDiff / xDiff));
    const cosinus = Math.cos(angleInRadians);
    const sinus = Math.sin(angleInRadians);

    const offsetXLeft = -50 * cosinus;
    const offsetY = 50 * sinus;
    const offsetYBelow = -offsetY - 5;

    const sourceLabelWidth = getNodeDimensions(link.source).width;
    const targetLabelWidth = getNodeDimensions(link.target).width;

    const sourceNewX = isSourceOnTheLeft ? (sourceLabelWidth + 20) * cosinus : offsetXLeft;
    const sourceNewY = isSourceBelowTarget ? offsetYBelow : offsetY;

    const targetNewX = isSourceOnTheLeft ? offsetXLeft : (targetLabelWidth + 20) * cosinus;
    const targetNewY = isSourceBelowTarget ? offsetY : offsetYBelow;

    d3.select<Element, DependencyLink>(this)
        .attr(
            'd',
            'M' +
                (link.source.x + sourceNewX) +
                ',' +
                (link.source.y + sourceNewY) +
                ', ' +
                (link.target.x + targetNewX) +
                ',' +
                (link.target.y + targetNewY)
        )
        .attr('stroke', 'black');
}

export function generateMarkers(svgContainer: GraphContainer): void {
    svgContainer
        .append('svg:defs')
        .append('svg:marker')
        .attr('id', 'provider')
        .attr('viewBox', '-5 -5 40 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 40)
        .attr('markerHeight', 40)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L20,0L0,5,q10 -5,0 -10')
        .attr('fill', '#E5E5E6');
}

export function generateLabelPath(this: Node, node: DependencyNode) {
    const labelTextDimensions = getLabelTextDimensions(this);

    if (!labelTextDimensions) {
        return '';
    }

    const labelTextWidth = labelTextDimensions.width;

    const { isConsumer, isProvider } = node;

    if (isConsumer && isProvider) {
        return 'M4.5,35l9.37,14.59L4.5,64.18h' + (labelTextWidth + 45) + 'l9-14.59L' + (labelTextWidth + 49.5) + ',35H4.5z';
    }

    if (isProvider) {
        return 'M' + (labelTextWidth + 49.5) + ',35H4.5l9.37,14.59L4.5,64.18h' + (labelTextWidth + 45);
    }

    if (isConsumer) {
        return 'M4.5,64.18h' + (labelTextWidth + 45) + 'l9.42-14.59L' + (labelTextWidth + 49.5) + ',35H4.5';
    }

    return 'M4.5,64.18h' + (labelTextWidth + 55) + 'L' + (labelTextWidth + 59.5) + ',35H4.5';
}

export function handleDrag(simulation: Simulation<DependencyNode, DependencyLink>) {
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
        .drag<SVGGElement, DependencyNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded);
}

export function createSimulation(nodes: DependencyNode[], links: DependencyLink[], width: number, height: number) {
    return d3
        .forceSimulation(nodes)
        .force(
            'dependency',
            d3
                .forceLink<DependencyNode, DependencyLink>(links)
                .distance(180)
                .id((node: DependencyNode) => node.name)
        )
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('y', d3.forceY(0.5))
        .force('collide', d3.forceCollide(140))
        .force('nodeCollide', d3.forceCollide(140));
}

export function createSVGContainer(
    container: HTMLDivElement,
    width: number,
    height: number
): d3.Selection<SVGSVGElement, DependencyNode, Element, HTMLElement> {
    return d3
        .select<Element, DependencyNode>(`#${container.id}`)
        .append('svg')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height);
}

export function createZoom(svgContainer: GraphContainer): d3.Selection<SVGGElement, DependencyNode, Element, HTMLElement> {
    const zoomLayer = svgContainer.append('g');

    const zoomed = () => {
        zoomLayer.attr('transform', d3.event.transform);
    };

    svgContainer
        .call(
            d3
                .zoom<SVGSVGElement, DependencyNode>()
                .scaleExtent([1 / 2, 12])
                .on('zoom', zoomed)
        )
        .on('dblclick.zoom', null);

    return zoomLayer;
}

export function getLabelTextDimensions(node: Node) {
    const textNode = d3.select<SVGGElement, DependencyNode>(node.previousSibling as SVGGElement).node();

    if (!textNode) {
        return undefined;
    }

    return textNode.getBBox();
}

export function getNodeDimensions(selectedNode: DependencyNode): { width: number; height: number } {
    const foundNode = d3
        .select<SVGGElement, DependencyNode>('#labels')
        .selectAll<SVGGElement, DependencyNode>('g')
        .filter((node: DependencyNode) => node.x === selectedNode.x && node.y === selectedNode.y)
        .node();
    return foundNode ? foundNode.getBBox() : { width: 200, height: 25 };
}
