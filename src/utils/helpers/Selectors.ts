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
    return selectById<SVGGElement>(ElementIds.LABELS).selectAll<SVGGElement, DependencyNode>('g');
}

export function selectAllLinks() {
    return selectById<SVGGElement>(ElementIds.LINKS).selectAll<SVGPathElement, DependencyLink>('path');
}

export function selectHighlightBackground() {
    return selectById<SVGGElement>(ElementIds.HIGHLIGHT_BACKGROUND);
}

export function selectDetailsButtonWrapper() {
    return selectById<SVGGElement>(ElementIds.DETAILS_BUTTON);
}

export function selectDetailsExitButtonWrapper() {
    return selectById<SVGGElement>(ElementIds.DETAILS_EXIT_BUTTON);
}

export function selectDetailsButtonRect() {
    return selectDetailsButtonWrapper().select('rect');
}

export function selectDetailsButtonText() {
    return selectDetailsButtonWrapper().select('text');
}

export function selectDetailsViewContainer() {
    return selectById<SVGSVGElement>(ElementIds.DETAILS_VIEW_CONTAINER);
}

export function selectDetailsContainerDiv() {
    return selectById<HTMLDivElement>(ElementIds.DETAILS_CONTAINER_DIV);
}

export function selectDetailsZoom() {
    return selectById<SVGGElement>(ElementIds.ZOOM_DETAILS);
}

export function selectContainer() {
    return selectById<SVGSVGElement>(ElementIds.CONTAINER);
}

export function selectById<Type extends BaseType = BaseType, Data = unknown>(selector: ElementIds) {
    return select<Type, Data>(`#${selector}`);
}
