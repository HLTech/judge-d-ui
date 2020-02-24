import { DependencyNode, NodeSelection } from '../components/types';
import { ElementIds, MAXIMUM_ZOOM_SCALE, MINIMUM_ZOOM_SCALE } from '../utils/AppConsts';
import { zoom } from 'd3-zoom';
import { event } from 'd3-selection';
import { selectById } from '../utils/helpers/Selectors';
import { ZoomScaleStorage } from '../utils/helpers/UserEventHelpers';

export const changeZoom = (zoomSelector: ElementIds.OVERVIEW_ZOOM | ElementIds.DETAILS_ZOOM) => () => {
    const { transform } = event;
    const zoomLayer = selectById(zoomSelector);
    zoomLayer.attr('transform', transform);
    ZoomScaleStorage.setScale(transform.k);
};

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
