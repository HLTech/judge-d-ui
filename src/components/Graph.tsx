import * as React from 'react';
import { useEffect, useRef } from 'react';
import { css, cx } from 'emotion';
import { draw } from '../utils/Draw';
import { Network } from './types';
import { ElementIds } from '../utils/AppConsts';
import { selectById } from '../utils/helpers/Selectors';

export interface GraphProps {
    network: Network;
}

export const Graph = React.memo<GraphProps>(({ network: { nodes, links, detailsNodes } }) => {
    const dependencyGraphDiv = useRef<HTMLDivElement>(null);

    useEffect(() => {
        selectById(ElementIds.OVERVIEW_CONTAINER_DIV)
            .selectAll('*')
            .remove();
        selectById(ElementIds.DETAILS_CONTAINER_DIV)
            .selectAll('*')
            .remove();
        if (dependencyGraphDiv.current !== null && nodes.length > 0) {
            draw({ nodes, links, detailsNodes }, dependencyGraphDiv.current);
        }
    }, [nodes, links, detailsNodes]);

    return (
        <div ref={dependencyGraphDiv} className={graphContainerCls}>
            <div id={ElementIds.OVERVIEW_CONTAINER_DIV} className={graphOverviewCls} />
            <div id={ElementIds.DETAILS_CONTAINER_DIV} className={cx(graphOverviewCls, graphDetailsCls)} />
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

const graphDetailsCls = css({
    zIndex: 6,
});
