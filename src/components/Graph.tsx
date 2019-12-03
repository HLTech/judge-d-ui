import * as React from 'react';
import { useEffect, useRef } from 'react';
import { css } from 'emotion';
import { draw } from '../utils/Draw';
import { select } from 'd3-selection';
import { Network } from './types';
import { Selectors } from '../utils/AppConsts';

export interface GraphProps {
    network: Network;
}

export const Graph = React.memo<GraphProps>(({ network: { nodes, links, detailsNodes } }) => {
    const dependencyGraphDiv = useRef<HTMLDivElement>(null);

    useEffect(() => {
        select(dependencyGraphDiv.current)
            .selectAll(`${Selectors.OVERVIEW_CONTAINER_DIV} > *, ${Selectors.DETAILS_CONTAINER_DIV} > *`)
            .remove();
        if (dependencyGraphDiv.current !== null && nodes.length > 0) {
            draw({ nodes, links, detailsNodes }, dependencyGraphDiv.current);
        }
    }, [nodes, links, detailsNodes]);

    return (
        <div ref={dependencyGraphDiv} className={graphContainerCls}>
            <div id={'overview-container-div'} className={graphOverviewCls} />
            <div id={'details-container-div'} className={graphOverviewCls} />
        </div>
    );
});

const graphContainerCls = css({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100vh',
    '& > svg': {
        flex: 1,
        overflow: 'hidden',
    },
});

const graphOverviewCls = css({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
});
