import { TreeStructure } from './details-mappers';
import { hierarchy, HierarchyPointLink, HierarchyPointNode, tree } from 'd3-hierarchy';
import { create, linkHorizontal } from 'd3';
import { Colors } from '../utils/AppConsts';

const VERTICAL_DISTANCE_BETWEEN_NODES = 40;
const HORIZONTAL_DISTANCE_BETWEEN_NODES = 300;
const NODE_NEIGHBOURS_SEPARATION_MULTIPLIER = 1;
const NODE_NORMAL_SEPARATION_MULTIPLIER = 4;

export function createTree(data: TreeStructure) {
    const node = hierarchy(data);
    return tree<TreeStructure>()
        .nodeSize([VERTICAL_DISTANCE_BETWEEN_NODES, HORIZONTAL_DISTANCE_BETWEEN_NODES])
        .separation((node1, node2) =>
            node1.parent === node2.parent ? NODE_NEIGHBOURS_SEPARATION_MULTIPLIER : NODE_NORMAL_SEPARATION_MULTIPLIER
        )(node);
}

export function getRootYPosition(data: HierarchyPointNode<TreeStructure>) {
    let x0 = Infinity;
    data.each(node => {
        if (node.x < x0) x0 = node.x;
    });
    return VERTICAL_DISTANCE_BETWEEN_NODES - x0;
}

export function createDiagram(
    tree: HierarchyPointNode<TreeStructure>,
    containerWidth: number,
    containerHeight: number,
    rootNodeYOffset: number,
    drawToLeft: boolean = false
) {
    if (!tree.children || !tree.children.length) {
        return null;
    }

    const diagramWidth = containerWidth / 2;
    const diagramXOffset = -diagramWidth / 8;
    const diagramYOffset = -containerHeight / 2;

    const svg = create('svg').attr('viewBox', `${diagramXOffset} ${diagramYOffset + rootNodeYOffset} ${diagramWidth} ${containerHeight}`);

    const g = svg
        .append('g')
        .attr('font-size', 15)
        .attr('transform', transformDiagramElement(0, rootNodeYOffset, drawToLeft));

    g.append('g')
        .attr('fill', 'none')
        .attr('stroke', Colors.ANCHOR_BLUE)
        .attr('stroke-width', 2)
        .selectAll('path')
        .data(tree.links())
        .join('path')
        .attr(
            'd',
            linkHorizontal<HierarchyPointLink<TreeStructure>, HierarchyPointNode<TreeStructure>>()
                .x(d => d.y)
                .y(d => d.x)
        );

    const node = g
        .append('g')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-width', 3)
        .selectAll('g')
        .data(tree.descendants())
        .join('g')
        .attr('transform', d => transformDiagramElement(d.y, d.x, drawToLeft));

    node.append('text')
        .attr('dy', '0.31em')
        .attr('x', 0)
        .attr('text-anchor', 'middle')
        .style('background-color', '#ffffff')
        .text(node => node.data.name)
        .clone(true)
        .lower()
        .attr('stroke-width', 4)
        .attr('stroke', 'white');

    return svg;
}

function transformDiagramElement(xOffset: number, yOffset: number, drawToLeft: boolean) {
    return `translate(${xOffset},${yOffset}) ${drawToLeft ? 'rotate(180)' : ''}`;
}
