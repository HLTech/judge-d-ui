export enum ElementIds {
    OVERVIEW_CONTAINER = 'overview-container',
    LABELS = 'labels',
    LINKS = 'links',
    HIGHLIGHT_BACKGROUND = 'highlight-background',
    DETAILS_BUTTON = 'details-button',
    OVERVIEW_ZOOM = 'overview-zoom',
    DETAILS_ZOOM = 'details-zoom',
    DETAILS_VIEW_CONTAINER = 'details-view-container',
    OVERVIEW_CONTAINER_DIV = 'overview-container-div',
    DETAILS_CONTAINER_DIV = 'details-container-div',
    DETAILS_EXIT_BUTTON = 'details-exit-button',
    DETAILS_ROOT_NODE_CONTAINER = 'details-root-node-container',
    TOOLTIP = 'tooltip',
}

export const TRANSITION_DURATION = 750;
export const FAST_TRANSITION_DURATION = 450;

export const BACKGROUND_HIGHLIGHT_OPACITY = 0.35;

export const BASE_FONT_SIZE = 15;

export const MINIMUM_ZOOM_SCALE = 0.5;
export const MAXIMUM_ZOOM_SCALE = 12;

export const ZOOM_INCREASE = 1.25;
export const ZOOM_DECREASE = 0.8;

export enum LabelColors {
    PROVIDER = '#00bfc2',
    CONSUMER = '#039881',
    PROVIDER_CONSUMER = '#03939f',
    DEFAULT = '#dcdee0',
    FOCUSED = '#4ca3e5',
}

export enum TextColors {
    HIGHLIGHTED = '#ffffff',
    DEFAULT = '#5e6063',
}

export enum ElementColors {
    BUTTON = '#858789',
    HIGHLIGHT_BACKGROUND = '#edeef0',
    SLIDER = '#babec2',
    SLIDER_LABEL = '#8b8b8c',
    DETAILS_BACKGROUND = '#ffffff',
    DETAILS_LINK = '#0076eb',
}
