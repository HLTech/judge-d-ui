import { changeZoom, getTextDimensions, getNodeDimensions } from './GraphHelpers';
import { DependencyLink, DependencyNode, NodeSelection } from '../../components/types';
import { forceCenter, forceCollide, forceLink, forceSimulation, forceY } from 'd3-force';
import { select, Selection } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { BASE_FONT_SIZE, MAXIMUM_ZOOM_SCALE, MINIMUM_ZOOM_SCALE, ElementIds, Colors } from '../AppConsts';
import { selectById } from './Selectors';

export function createLinkElements(zoomLayer: NodeSelection<SVGGElement>, links: DependencyLink[]) {
    return zoomLayer
        .append('g')
        .attr('id', ElementIds.LINKS)
        .lower()
        .selectAll<HTMLElement, DependencyLink>('line.link')
        .data(links)
        .enter()
        .append<SVGPathElement>('svg:path')
        .attr('marker-end', 'url(#provider)')
        .style('stroke-width', 1);
}

export function createLabels(labelNodesGroup: NodeSelection<SVGGElement>, nodes: DependencyNode[]) {
    labelNodesGroup
        .selectAll('g')
        .data(nodes)
        .append<SVGPathElement>('svg:path')
        .attr('fill', Colors.LIGHT_GREY)
        .attr('d', function({ isConsumer, isProvider }) {
            return createLabelPath.call(this, isConsumer, isProvider);
        });
}

export function createTextElements(labelNodesGroup: NodeSelection<SVGGElement>, nodes: DependencyNode[]) {
    return labelNodesGroup
        .selectAll<HTMLElement, DependencyNode>('g#labels')
        .data(nodes)
        .enter()
        .append<SVGGElement>('g')
        .attr('cursor', 'pointer')
        .append('text')
        .attr('font-size', BASE_FONT_SIZE)
        .attr('text-anchor', 'middle')
        .attr('fill', Colors.BASIC_TEXT)
        .text(d => d.name);
}

export function createMarkers(svgContainer: any): void {
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
        .attr('fill', Colors.LIGHT_GREY);
}

export function createSimulation(nodes: DependencyNode[], links: DependencyLink[], width: number, height: number) {
    return forceSimulation(nodes)
        .force(
            'dependency',
            forceLink<DependencyNode, DependencyLink>(links)
                .distance(180)
                .id((node: DependencyNode) => node.name)
        )
        .force('center', forceCenter(width / 2, height / 2))
        .force('y', forceY(0.5))
        .force('collide', forceCollide(140))
        .force('nodeCollide', forceCollide(140));
}

export function createSVGContainer(width: number, height: number) {
    return selectById(ElementIds.OVERVIEW_CONTAINER_DIV)
        .append('svg')
        .attr('id', ElementIds.OVERVIEW_CONTAINER)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height);
}

export function createZoom(svgContainer: NodeSelection<SVGSVGElement>, selector: ElementIds.OVERVIEW_ZOOM | ElementIds.DETAILS_ZOOM) {
    const zoomLayer = svgContainer.append('g').attr('id', selector);

    svgContainer
        .call(
            zoom<SVGSVGElement, DependencyNode>()
                .scaleExtent([MINIMUM_ZOOM_SCALE, MAXIMUM_ZOOM_SCALE])
                .on(`zoom`, changeZoom(selector))
        )
        .on('dblclick.zoom', null);

    return zoomLayer;
}

export function createLinkPath(this: Element, link: DependencyLink): void {
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

    const offsetY = 50 * sinus;
    const offsetYBelow = -offsetY - 5;

    const sourceLabelWidth = getNodeDimensions(link.source).width;
    link.source.width = sourceLabelWidth;
    const targetLabelWidth = getNodeDimensions(link.target).width;
    link.target.width = targetLabelWidth;

    const sourceNewX = isSourceOnTheLeft ? (sourceLabelWidth / 2 + 15) * cosinus : (-sourceLabelWidth / 2 - 15) * cosinus;
    const sourceNewY = isSourceBelowTarget ? offsetYBelow : offsetY;

    const targetNewX = isSourceOnTheLeft ? (-targetLabelWidth / 2 - 15) * cosinus : (targetLabelWidth / 2 + 15) * cosinus;
    const targetNewY = isSourceBelowTarget ? offsetY : offsetYBelow;

    select<Element, DependencyLink>(this)
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
        .attr('stroke', Colors.LIGHT_GREY);
}

export function createLabelPath(this: SVGPathElement | null, isConsumer: boolean, isProvider: boolean) {
    const labelText = (this?.previousSibling || this?.nextSibling) as SVGTextElement | null;
    const labelTextDimensions = getTextDimensions(labelText);

    if (!labelTextDimensions) {
        return '';
    }

    const labelTextWidth = labelTextDimensions.width;

    if (isConsumer && isProvider) {
        return `M${-labelTextWidth / 2 + 4.5},35l9.37,14.59L${-labelTextWidth / 2 + 4.5},64.18h${labelTextWidth +
            45}l9-14.59L${labelTextWidth / 2 + 49.5},35H${-labelTextWidth / 2 + 4.5}z`;
    }

    if (isProvider) {
        return `M${labelTextWidth / 2 + 49.5},35H${-labelTextWidth / 2 + 4.5}l9.37,14.59L${-labelTextWidth / 2 +
            4.5},64.18h${labelTextWidth + 45}`;
    }

    if (isConsumer) {
        return `M${-labelTextWidth / 2 + 4.5},64.18h${labelTextWidth + 45}l9.42-14.59L${labelTextWidth / 2 + 49.5},35H${-labelTextWidth /
            2 +
            4.5}`;
    }

    return `M${-labelTextWidth / 2 + 4.5},64.18h${labelTextWidth + 55}L${labelTextWidth / 2 + 59.5},35H${-labelTextWidth / 2 + 4.5}`;
}

export function createHighlightBackground(
    svgContainer: NodeSelection<SVGGElement>
): Selection<SVGRectElement, DependencyNode, Element, HTMLElement> {
    return svgContainer
        .append('rect')
        .attr('id', ElementIds.HIGHLIGHT_BACKGROUND)
        .attr('width', 0)
        .attr('height', 0)
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', Colors.BLUE_GREY)
        .style('opacity', 0);
}

export function createDetailsButton(svgContainer: NodeSelection<SVGGElement>) {
    const detailsButtonWrapper = svgContainer
        .append('g')
        .attr('id', ElementIds.DETAILS_BUTTON)
        .attr('cursor', 'pointer');
    detailsButtonWrapper
        .append('rect')
        .style('opacity', 0)
        .attr('fill', Colors.BLACK);
    detailsButtonWrapper
        .append('text')
        .style('opacity', 0)
        .style('text-anchor', 'middle')
        .attr('fill', Colors.WHITE)
        .text('Details');
    return detailsButtonWrapper;
}

export function createTooltip(svgContainer: NodeSelection<SVGGElement>) {
    const tooltipElement = svgContainer
        .append('g')
        .attr('id', 'tooltip')
        .style('opacity', 0);
    tooltipElement
        .append('rect')
        .attr('fill', Colors.BLACK)
        .attr('rx', 5)
        .attr('ry', 5);
    tooltipElement.append('text').attr('fill', Colors.WHITE);
}
