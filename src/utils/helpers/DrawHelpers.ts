import {
    getLabelTextDimensions,
    getNodeDimensions,
    findMaxDependencyLevel,
    getHighLightedLabelColor,
    zoomToHighLightedNodes,
    LevelStorage,
} from './GraphHelpers';
import { DependencyLink, DependencyNode, NodeSelection } from '../../components/types';
import { forceCenter, forceCollide, forceLink, forceSimulation, forceY } from 'd3-force';
import { event, select, Selection } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { LabelColors, TextColors } from '../AppConsts';

export function createLinkElements(zoomLayer: NodeSelection<SVGGElement>, links: DependencyLink[]) {
    return zoomLayer
        .append('g')
        .attr('id', 'links')
        .lower()
        .selectAll<HTMLElement, DependencyLink>('line.link')
        .data(links)
        .enter()
        .append<SVGPathElement>('svg:path')
        .attr('class', 'link')
        .attr('marker-end', 'url(#provider)')
        .style('stroke-width', 1);
}

export function createLabels(labelNodesGroup: NodeSelection<SVGGElement>, nodes: DependencyNode[]) {
    labelNodesGroup
        .selectAll('g')
        .data(nodes)
        .append<SVGPathElement>('svg:path')
        .attr('class', 'label')
        .attr('fill', LabelColors.DEFAULT)
        .attr('d', createLabelPath);
}

export function createTextElements(labelNodesGroup: NodeSelection<SVGGElement>, nodes: DependencyNode[]) {
    return labelNodesGroup
        .selectAll<HTMLElement, DependencyNode>('g#labels')
        .data(nodes)
        .enter()
        .append<SVGGElement>('g')
        .attr('cursor', 'pointer')
        .append('text')
        .attr('fill', TextColors.DEFAULT)
        .text(d => d.name);
}

export function createMarkers(svgContainer: NodeSelection<SVGSVGElement>): void {
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

export function createSVGContainer(
    container: HTMLDivElement,
    width: number,
    height: number
): Selection<SVGSVGElement, DependencyNode, Element, HTMLElement> {
    return select<Element, DependencyNode>(`#${container.id}`)
        .append('svg')
        .attr('id', 'container')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height);
}

export function createZoom(svgContainer: NodeSelection<SVGSVGElement>): Selection<SVGGElement, DependencyNode, Element, HTMLElement> {
    const zoomLayer = svgContainer.append('g').attr('id', 'zoom');

    const zoomed = () => zoomLayer.attr('transform', event.transform);

    svgContainer
        .call(
            zoom<SVGSVGElement, DependencyNode>()
                .scaleExtent([1 / 2, 12])
                .on('zoom', zoomed)
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

    const offsetXLeft = -50 * cosinus;
    const offsetY = 50 * sinus;
    const offsetYBelow = -offsetY - 5;

    const sourceLabelWidth = getNodeDimensions(link.source).width;
    link.source.width = sourceLabelWidth;
    const targetLabelWidth = getNodeDimensions(link.target).width;
    link.target.width = targetLabelWidth;

    const sourceNewX = isSourceOnTheLeft ? (sourceLabelWidth + 20) * cosinus : offsetXLeft;
    const sourceNewY = isSourceBelowTarget ? offsetYBelow : offsetY;

    const targetNewX = isSourceOnTheLeft ? offsetXLeft : (targetLabelWidth + 20) * cosinus;
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
        .attr('stroke', LabelColors.DEFAULT);
}

export function createLabelPath(this: Node, node: DependencyNode) {
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

export function createHighlightBackground(
    svgContainer: NodeSelection<SVGGElement>
): Selection<SVGRectElement, DependencyNode, Element, HTMLElement> {
    return svgContainer
        .append('rect')
        .attr('id', 'highlight-background')
        .attr('width', 0)
        .attr('height', 0)
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#000000')
        .style('opacity', 0);
}

export function createDetailsButton(svgContainer: NodeSelection<SVGGElement>) {
    const detailsButtonWrapper = svgContainer
        .append('g')
        .attr('id', 'details-button')
        .on('click', () => {
            event.stopPropagation();
        })
        .attr('cursor', 'pointer');
    detailsButtonWrapper
        .append('rect')
        .style('opacity', 0)
        .attr('fill', '#00a8a8');
    detailsButtonWrapper
        .append('text')
        .style('opacity', 0)
        .attr('fill', TextColors.HIGHLIGHTED)
        .text('Details');
    return detailsButtonWrapper;
}

export function setKeyboardDependencyHighlightHandler() {
    select('body').on('keydown', () => {
        const labelNodesGroup = select<SVGGElement, DependencyNode>('g#labels');
        LevelStorage.setMaxLevel(findMaxDependencyLevel(labelNodesGroup));

        if (!isFinite(LevelStorage.getMaxLevel())) {
            return;
        }

        if (LevelStorage.isBelowMax() && event.code === 'NumpadAdd') {
            LevelStorage.increase();
        }

        if (LevelStorage.isAboveMin() && event.code === 'NumpadSubtract') {
            LevelStorage.decrease();
        }

        labelNodesGroup
            .selectAll<HTMLElement, DependencyNode>('g')
            .filter((node: DependencyNode) => node.level > 0)
            .each(function(this: HTMLElement, node: DependencyNode) {
                const labelElement = this.firstElementChild;
                const textElement = this.lastElementChild;

                if (!labelElement || !textElement) {
                    return;
                }

                let labelColor = LabelColors.DEFAULT;
                let textColor = TextColors.DEFAULT;
                if (node.level - 1 <= LevelStorage.getLevel()) {
                    labelColor = getHighLightedLabelColor(node);
                    textColor = TextColors.HIGHLIGHTED;
                }

                select<Element, DependencyNode>(labelElement).attr('fill', labelColor);
                select<Element, DependencyNode>(textElement).style('fill', textColor);
            });

        zoomToHighLightedNodes();
    });
}
