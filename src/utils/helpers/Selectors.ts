import { select } from 'd3-selection';
import { LabelColors, Selectors } from '../AppConsts';
import { DependencyLink, DependencyNode } from '../../components/types';

export function selectHighLightedNodes() {
    return selectAllNodes().filter(function(this: SVGGElement) {
        return this.firstElementChild ? this.firstElementChild.getAttribute('fill') !== LabelColors.DEFAULT : false;
    });
}

export function selectAllNodes() {
    return select(Selectors.LABELS).selectAll<SVGGElement, DependencyNode>('g');
}

export function selectAllLinks() {
    return select(Selectors.LINKS).selectAll<SVGPathElement, DependencyLink>('path');
}

export function selectHighlightBackground() {
    return select(Selectors.HIGHLIGHT_BACKGROUND);
}

export function selectDetailsButtonWrapper() {
    return select(Selectors.DETAILS_BUTTON);
}

export function selectDetailsButtonRect() {
    return selectDetailsButtonWrapper().select('rect');
}

export function selectDetailsButtonText() {
    return selectDetailsButtonWrapper().select('text');
}
