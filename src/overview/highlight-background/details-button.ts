import { NodeSelection } from '../../components/types';
import { Colors, ElementIds } from '../../utils/AppConsts';

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
