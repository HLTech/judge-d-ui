import { NodeSelection } from '../../components/types';
import {Colors} from '../../utils/AppConsts';
import { selectTooltip } from '../../utils/helpers/Selectors';

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

export function showTooltip() {
    selectTooltip().attr('visibility', 'visible');
}

export function hideTooltip() {
    selectTooltip().attr('visibility', 'hidden');
}
