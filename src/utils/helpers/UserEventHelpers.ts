import { event, select } from 'd3-selection';
import { DependencyNode } from '../../components/types';
import {
    centerScreenToDimension,
    changeZoom,
    findGroupBackgroundDimension,
    findMaxDependencyLevel,
    getHighLightedLabelColor,
    hideHighlightBackground,
    highlight,
    LevelStorage,
    selectAllNodes,
    selectHighLightedNodes,
    zoomToHighLightedNodes,
} from './GraphHelpers';
import { LabelColors, MAXIMUM_ZOOM_SCALE, MINIMUM_ZOOM_SCALE, Selectors, TextColors } from '../AppConsts';
import { zoom, zoomIdentity } from 'd3-zoom';

enum Subscriptions {
    HIGHLIGHT = 'click.highlight',
    RESET_HIGHLIGHT = 'click.resetHighlight',
    CHANGE_HIGHLIGHT_RANGE = 'keydown.changeHighlightRange',
    ZOOM_ON_ARROW_KEY = 'keydown.zoom',
}

export function subscribeToHighlight() {
    selectAllNodes().on(Subscriptions.HIGHLIGHT, (node: DependencyNode) => {
        LevelStorage.reset();
        if (node.links.length) {
            highlight(node);
            zoomToHighLightedNodes();
        }
        event.stopPropagation();
    });
}

export function subscribeToChangeHighlightRangeOnArrowKey() {
    select('body').on(Subscriptions.CHANGE_HIGHLIGHT_RANGE, () => {
        const labelNodesGroup = select<SVGGElement, DependencyNode>('g#labels');
        LevelStorage.setMaxLevel(findMaxDependencyLevel(labelNodesGroup));

        if (!isFinite(LevelStorage.getMaxLevel())) {
            return;
        }

        if (LevelStorage.isBelowMax() && event.code === 'ArrowRight') {
            LevelStorage.increase();
        }

        if (LevelStorage.isAboveMin() && event.code === 'ArrowLeft') {
            LevelStorage.decrease();
        }

        // TODO refactor it to share logic with GraphHelpers/highlight function
        labelNodesGroup
            .selectAll<HTMLElement, DependencyNode>('g')
            .filter((node: DependencyNode) => node.level > 0)
            .each(function(this: HTMLElement, node: DependencyNode) {
                const labelElement = this.firstElementChild;
                const textElement = this.lastElementChild;

                if (!labelElement || !textElement) {
                    return;
                }

                let labelColor = LabelColors.DEFAULT;
                let textColor = TextColors.DEFAULT;
                if (node.level - 1 <= LevelStorage.getLevel()) {
                    labelColor = getHighLightedLabelColor(node);
                    textColor = TextColors.HIGHLIGHTED;
                }

                select<Element, DependencyNode>(labelElement).attr('fill', labelColor);
                select<Element, DependencyNode>(textElement).style('fill', textColor);
            });

        zoomToHighLightedNodes();
    });
}

export function subscribeToResetHighlight() {
    select(Selectors.CONTAINER).on(Subscriptions.RESET_HIGHLIGHT, () => {
        const highlightedNodes = selectHighLightedNodes();
        if (highlightedNodes.data().length) {
            selectAllNodes().each((node: DependencyNode) => (node.level = 0));

            const dimension = findGroupBackgroundDimension(highlightedNodes.data());

            highlightedNodes.each(function(this: SVGGElement) {
                const labelElement = this.firstElementChild;
                const textElement = this.lastElementChild;

                if (!labelElement || !textElement) {
                    return;
                }

                select<Element, DependencyNode>(labelElement).attr('fill', LabelColors.DEFAULT);
                select<Element, DependencyNode>(textElement).style('fill', TextColors.DEFAULT);
            });

            hideHighlightBackground();

            centerScreenToDimension(dimension, 1);
        }
    });
}

export function subscribeToZoomOnArrowKey() {
    select('body').on(Subscriptions.ZOOM_ON_ARROW_KEY, () => {
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
            const scaleMultiplier = event.code === 'ArrowUp' ? 1.25 : 0.8;
            const zoomLayer = select(Selectors.ZOOM);
            const oldScaleValue = Number(zoomLayer.attr('data-scale')) || 1;
            const scaleValue = oldScaleValue * scaleMultiplier;
            if (scaleValue <= MAXIMUM_ZOOM_SCALE && scaleValue >= MINIMUM_ZOOM_SCALE) {
                const container = select(Selectors.CONTAINER);
                container.call(() => {
                    return zoom<any, any>()
                        .on('zoom.key', changeZoom)
                        .scaleBy(container, scaleMultiplier);
                }, zoomIdentity);
            }
        }
    });
}
