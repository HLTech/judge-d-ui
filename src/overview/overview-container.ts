import { selectById } from '../utils/helpers/Selectors';
import { ElementIds } from '../utils/AppConsts';

export function createSVGContainer(width: number, height: number) {
    return selectById(ElementIds.OVERVIEW_CONTAINER_DIV)
        .append('svg')
        .attr('id', ElementIds.OVERVIEW_CONTAINER)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height);
}
