import { DependencyNode, NodeSelection } from '../../components/types';
import { Selection } from 'd3-selection';
import { Colors, ElementIds } from '../../utils/AppConsts';

export function createHighlightBackground(
    svgContainer: NodeSelection<SVGGElement>
): Selection<SVGRectElement, DependencyNode, Element, HTMLElement> {
    return svgContainer
        .append('rect')
        .attr('id', ElementIds.HIGHLIGHT_BACKGROUND)
        .attr('data-test-id', 'highlight-background')
        .attr('width', 0)
        .attr('height', 0)
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', Colors.BLUE_GREY)
        .style('opacity', 0);
}
