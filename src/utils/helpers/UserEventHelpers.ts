import { event, select } from 'd3-selection';
import { DependencyNode, TreeNode } from '../../components/types';
import {
    centerScreenToDimension,
    changeZoom,
    findGroupBackgroundDimension,
    findMaxDependencyLevel,
    getHighLightedLabelColor,
    hideHighlightBackground,
    highlight,
    zoomToHighLightedNodes,
} from './GraphHelpers';
import {
    MAXIMUM_ZOOM_SCALE,
    MINIMUM_ZOOM_SCALE,
    ElementIds,
    ZOOM_DECREASE,
    ZOOM_INCREASE,
    FAST_TRANSITION_DURATION,
    TRANSITION_DURATION,
    Colors,
} from '../AppConsts';
import { zoom, zoomIdentity } from 'd3-zoom';
import {
    selectAllNodes,
    selectOverviewContainer,
    selectDetailsButtonWrapper,
    selectDetailsExitButtonWrapper,
    selectHighLightedNodes,
    selectTooltip,
    selectTooltipBackground,
    selectTooltipText,
} from './Selectors';
import { initializeDetailsView, shutdownDetailsView } from './DetailsDrawHelpers';

enum Subscriptions {
    HIGHLIGHT = 'click.highlight',
    RESET_HIGHLIGHT = 'click.resetHighlight',
    CHANGE_HIGHLIGHT_RANGE = 'keydown.changeHighlightRange',
    ZOOM_ON_ARROW_KEY = 'keydown.zoom',
    OPEN_DETAILS = 'click.openDetails',
    CLOSE_DETAILS = 'click.closeDetails',
    SHOW_TOOLTIP = 'mouseover.tooltip',
    HIDE_TOOLTIP = 'mouseout.tooltip',
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

                    let labelColor = Colors.LIGHT_GREY;
                    let textColor = Colors.BASIC_TEXT;

                    if (node.level - 1 <= LevelStorage.getLevel()) {
                        labelColor = getHighLightedLabelColor(node);
                        textColor = Colors.WHITE;
                    }

                    select<Element, DependencyNode>(labelElement).attr('fill', labelColor);
                    select<Element, DependencyNode>(textElement).style('fill', textColor);
                });

            zoomToHighLightedNodes();
        }
    });
}

export function subscribeToResetHighlight() {
    selectOverviewContainer().on(Subscriptions.RESET_HIGHLIGHT, () => {
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

                select<Element, DependencyNode>(labelElement).attr('fill', Colors.LIGHT_GREY);
                select<Element, DependencyNode>(textElement).style('fill', Colors.BASIC_TEXT);
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
                    const container = selectOverviewContainer();
                    container.call(() => {
                        return zoom<any, any>()
                            .on('zoom', changeZoom(ElementIds.OVERVIEW_ZOOM))
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
                    const container = selectOverviewContainer();
                    container.call(() => {
                        return zoom<any, any>()
                            .on('zoom', changeZoom(ElementIds.OVERVIEW_ZOOM))
                            .scaleBy(container, ZOOM_DECREASE);
                    }, zoomIdentity);
                }
                break;
            }
        }
    });
}

export function subscribeToOpenDetails(detailsNodes: TreeNode[]) {
    selectDetailsButtonWrapper().on(Subscriptions.OPEN_DETAILS, () => {
        if (selectHighLightedNodes().data().length === 0) {
            return;
        }
        event.stopPropagation();
        const selectedNode = selectAllNodes()
            .data()
            .find(node => node.level === 1);
        if (selectedNode) {
            const selectedTreeNode = detailsNodes.find(treeNode => treeNode.name === selectedNode.name);
            if (selectedTreeNode) {
                initializeDetailsView(selectedTreeNode);
            }
        }
    });
}

export function subscribeToCloseDetails() {
    selectDetailsExitButtonWrapper().on(Subscriptions.CLOSE_DETAILS, () => {
        shutdownDetailsView();
    });
}

const TOOLTIP_PADDING = 10;

export function subscribeToShowTooltipOnNodeHover() {
    selectAllNodes()
        .on(Subscriptions.SHOW_TOOLTIP, function(node) {
            const { x = 0, y = 0 } = node;
            const tooltipText = selectTooltipText();
            const tooltipBackground = selectTooltipBackground();
            selectTooltip()
                .transition()
                .duration(FAST_TRANSITION_DURATION)
                .style('opacity', 0.9);
            tooltipText
                .text(node.version)
                .attr('x', x)
                .attr('y', y - 25 - TOOLTIP_PADDING);
            const { width, height } = tooltipText.node() ? tooltipText.node()!.getBBox() : { width: 0, height: 0 };
            tooltipBackground
                .attr('x', x - TOOLTIP_PADDING)
                .attr('y', y - 42 - TOOLTIP_PADDING)
                .attr('width', width + 2 * TOOLTIP_PADDING)
                .attr('height', height + TOOLTIP_PADDING);
        })
        .on(Subscriptions.HIDE_TOOLTIP, function() {
            selectTooltip()
                .transition()
                .duration(TRANSITION_DURATION)
                .style('opacity', 0);
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
