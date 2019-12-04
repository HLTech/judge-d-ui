import { select } from 'd3-selection';
import { LabelColors, ElementIds } from '../AppConsts';
import { DependencyLink, DependencyNode } from '../../components/types';
import { BaseType } from 'd3-selection';

export function selectHighLightedNodes() {
    return selectAllNodes().filter(function(this: SVGGElement) {
        return this.firstElementChild ? this.firstElementChild.getAttribute('fill') !== LabelColors.DEFAULT : false;
    });
}

export function selectAllNodes() {
    return selectById(ElementIds.LABELS).selectAll<SVGGElement, DependencyNode>('g');
}

export function selectAllLinks() {
    return selectById(ElementIds.LINKS).selectAll<SVGPathElement, DependencyLink>('path');
}

export function selectHighlightBackground() {
    return selectById(ElementIds.HIGHLIGHT_BACKGROUND);
}

export function selectDetailsButtonWrapper() {
    return selectById(ElementIds.DETAILS_BUTTON);
}

export function selectDetailsExitButtonWrapper() {
    return selectById(ElementIds.DETAILS_EXIT_BUTTON);
}

export function selectDetailsButtonRect() {
    return selectDetailsButtonWrapper().select('rect');
}

export function selectDetailsButtonText() {
    return selectDetailsButtonWrapper().select('text');
}

export function selectDetailsViewContainer() {
    return selectById(ElementIds.DETAILS_VIEW_CONTAINER);
}

export function selectDetailsContainerDiv() {
    return selectById(ElementIds.DETAILS_CONTAINER_DIV);
}

export function selectDetailsZoom() {
    return selectById(ElementIds.ZOOM_DETAILS);
}

export function selectContainer() {
    return selectById(ElementIds.CONTAINER);
}

export function selectById<Data = unknown>(selector: ElementIds) {
    return select<BaseType, Data>(`#${selector}`);
}
