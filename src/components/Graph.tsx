import * as React from 'react';
import { useRef } from 'react';
import { css } from 'emotion';
import { useEffect } from 'react';
import { draw } from '../utils/Draw';
import * as d3 from 'd3';
import { DependencyLink, DependencyNode } from './types';

export interface GraphProps {
    nodes: DependencyNode[];
    links: DependencyLink[];
}

export const Graph = React.memo<GraphProps>(({ nodes, links }) => {
    const dependencyGraphDiv = useRef<HTMLDivElement>(null);

    useEffect(() => {
        d3.select(dependencyGraphDiv.current)
            .select('*')
            .remove();
        if (dependencyGraphDiv.current !== null && nodes.length > 0) {
            draw({ nodes, links }, dependencyGraphDiv.current);
        }
    }, [nodes, links]);

    return <div ref={dependencyGraphDiv} className={graphCls} id={'dependency-graph-container'} />;
});

const graphCls = css({
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '80vh',
    '& > svg': {
        flex: 1,
        overflow: 'hidden',
    },
});
