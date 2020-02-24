import { Network } from '../components/types';
import {
    subscribeToChangeHighlightRangeOnArrowKey,
    subscribeToCloseDetails,
    subscribeToHighlight,
    subscribeToOpenDetails,
    subscribeToResetHighlight,
    subscribeToShowTooltipOnNodeHover,
    subscribeToZoomOnArrowKey,
} from './helpers/UserEventHelpers';
import { createDetailsViewContainer } from '../details/details-container';
import { createOverview } from '../overview/overview.helpers';

export const draw = (network: Network, container: HTMLDivElement) => {
    createOverview(container, network);
    createDetailsViewContainer(container.clientWidth, container.clientHeight);

    subscribeToHighlight();
    subscribeToResetHighlight();
    subscribeToChangeHighlightRangeOnArrowKey();
    subscribeToZoomOnArrowKey();
    subscribeToOpenDetails(network.detailsNodes);
    subscribeToCloseDetails();
    subscribeToShowTooltipOnNodeHover();
};
