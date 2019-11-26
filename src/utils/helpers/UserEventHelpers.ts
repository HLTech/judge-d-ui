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
    selectAllNodes,
    selectHighLightedNodes,
    zoomToHighLightedNodes,
} from './GraphHelpers';
import { LabelColors, MAXIMUM_ZOOM_SCALE, MINIMUM_ZOOM_SCALE, Selectors, TextColors, ZOOM_DECREASE, ZOOM_INCREASE } from '../AppConsts';
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
        if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
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
        }
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
        switch (event.code) {
            case 'ArrowUp': {
                const currentScaleValue = ZoomScaleStorage.getScale();
                const newScaleValue = currentScaleValue * ZOOM_INCREASE;
                if (newScaleValue <= MAXIMUM_ZOOM_SCALE) {
                    ZoomScaleStorage.setScale(newScaleValue);
                    const container = select(Selectors.CONTAINER);
                    container.call(() => {
                        return zoom<any, any>()
                            .on('zoom', changeZoom)
                            .scaleBy(container, ZOOM_INCREASE);
                    }, zoomIdentity);
                }
                break;
            }
            case 'ArrowDown': {
                const currentScaleValue = ZoomScaleStorage.getScale();
                const newScaleValue = currentScaleValue * ZOOM_DECREASE;
                if (newScaleValue >= MINIMUM_ZOOM_SCALE) {
                    ZoomScaleStorage.setScale(newScaleValue);
                    const container = select(Selectors.CONTAINER);
                    container.call(() => {
                        return zoom<any, any>()
                            .on('zoom', changeZoom)
                            .scaleBy(container, ZOOM_DECREASE);
                    }, zoomIdentity);
                }
                break;
            }
        }
    });
}

class LevelStorage {
    private static level: number = 1;
    private static maxLevel: number = 1;

    public static getLevel(): number {
        return this.level;
    }

    public static increase() {
        this.level = this.level + 1;
    }

    public static decrease() {
        this.level = this.level - 1;
    }

    public static isBelowMax() {
        return this.level < this.maxLevel;
    }

    static isAboveMin() {
        return this.level > 1;
    }

    static setMaxLevel(maxLevel: number) {
        this.maxLevel = maxLevel;
    }

    static getMaxLevel(): number {
        return this.maxLevel;
    }

    public static reset() {
        this.level = 1;
        this.maxLevel = 1;
    }
}

export class ZoomScaleStorage {
    private static currentScale = 1;

    public static setScale(newScale: number) {
        this.currentScale = newScale;
    }

    public static getScale() {
        return this.currentScale;
    }
}
