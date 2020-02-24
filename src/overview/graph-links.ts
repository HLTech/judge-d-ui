import { DependencyLink, NodeSelection } from '../components/types';
import { ElementIds, Colors } from '../utils/AppConsts';
import { select } from 'd3-selection';
import { getNodeDimensions } from './graph-nodes';

export function createLinks(zoomLayer: NodeSelection<SVGGElement>, links: DependencyLink[]) {
    return zoomLayer
        .append('g')
        .attr('id', ElementIds.LINKS)
        .lower()
        .selectAll<HTMLElement, DependencyLink>('line.link')
        .data(links)
        .enter()
        .append<SVGPathElement>('svg:path')
        .attr('class', 'link')
        .attr('marker-end', 'url(#provider)')
        .style('stroke-width', 1);
}

export function createLinkMarkersDefinition(svgContainer: any): void {
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
        .attr('fill', '#dcdee0');
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
