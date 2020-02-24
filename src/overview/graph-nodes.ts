import { DependencyLink, DependencyNode, NodeSelection, RenderedDependencyNode } from '../components/types';
import { BASE_FONT_SIZE, Colors } from '../utils/AppConsts';
import { select } from 'd3-selection';
import { selectAllNodes } from '../utils/helpers/Selectors';

export function createNodeLabels(labelNodesGroup: NodeSelection<SVGGElement>, nodes: DependencyNode[]) {
    labelNodesGroup
        .selectAll('g')
        .data(nodes)
        .append<SVGPathElement>('svg:path')
        .attr('class', 'label')
        .attr('fill', Colors.LIGHT_GREY)
        .attr('d', function({ isConsumer, isProvider }) {
            return createNodeLabelPath(this, isConsumer, isProvider);
        });
}

export function createNodes(labelNodesGroup: NodeSelection<SVGGElement>, nodes: DependencyNode[]) {
    return labelNodesGroup
        .selectAll<HTMLElement, DependencyNode>('g#labels')
        .data(nodes)
        .enter()
        .append<SVGGElement>('g')
        .attr('cursor', 'pointer')
        .append('text')
        .attr('font-size', BASE_FONT_SIZE)
        .attr('fill', Colors.BASIC_TEXT)
        .attr('text-anchor', 'middle')
        .text(d => d.name);
}

export function getTextDimensions(textElement: SVGTextElement | null) {
    if (textElement) {
        return select<SVGTextElement, DependencyNode>(textElement)
            .node()
            ?.getBBox();
    }
}

export function getNodeDimensions(selectedNode: DependencyNode): { width: number; height: number } {
    const foundNode = selectAllNodes()
        .filter((node: DependencyNode) => node.x === selectedNode.x && node.y === selectedNode.y)
        .node();
    return foundNode ? foundNode.getBBox() : { width: 200, height: 25 };
}

export function findMaxDependencyLevel(labelNodesGroup: NodeSelection<SVGGElement>) {
    return (
        Math.max(
            ...labelNodesGroup
                .selectAll<HTMLElement, DependencyNode>('g')
                .filter((node: DependencyNode) => node.level > 0)
                .data()
                .map((node: DependencyNode) => node.level)
        ) - 1
    );
}

export function areNodesConnected(a: DependencyNode, b: DependencyNode, links: DependencyLink[]) {
    return (
        a.index === b.index ||
        links.some(
            link =>
                (link.source.index === a.index && link.target.index === b.index) ||
                (link.source.index === b.index && link.target.index === a.index)
        )
    );
}

export function getHighLightedLabelColor(node: DependencyNode) {
    const { isConsumer, isProvider, level } = node;

    if (level === 1) {
        return Colors.CLIFTON_NAVY;
    }

    if (isConsumer || isProvider) {
        return Colors.MILLENNIUM_MINT;
    }

    return Colors.LIGHT_GREY;
}

export function getRenderedNodes(nodes: DependencyNode[]): RenderedDependencyNode[] {
    return nodes.filter((node): node is RenderedDependencyNode => node.x !== undefined && node.y !== undefined && node.width !== undefined);
}

export function createNodeLabelPath(node: SVGPathElement | null, isConsumer: boolean, isProvider: boolean) {
    const labelText = (node?.previousSibling || node?.nextSibling) as SVGTextElement | null;
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
