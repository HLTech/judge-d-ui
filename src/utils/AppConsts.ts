export enum ElementIds {
    CONTAINER = 'container',
    LABELS = 'labels',
    LINKS = 'links',
    HIGHLIGHT_BACKGROUND = 'highlight-background',
    DETAILS_BUTTON = 'details-button',
    ZOOM_OVERVIEW = 'zoom-overview',
    ZOOM_DETAILS = 'zoom-details',
    DETAILS_VIEW_CONTAINER = 'details-view-container',
    OVERVIEW_CONTAINER_DIV = 'overview-container-div',
    DETAILS_CONTAINER_DIV = 'details-container-div',
    DETAILS_EXIT_BUTTON = 'details-exit-button',
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
    PROVIDER_CONSUMER = '#03939F',
    DEFAULT = '#DCDEE0',
    FOCUSED = '#4ca3e5',
}

export enum TextColors {
    HIGHLIGHTED = '#FFFFFF',
    DEFAULT = '#5E6063',
}

export enum ElementColors {
    BUTTON = '#858789',
    HIGHLIGHT_BACKGROUND = '#EDEEF0',
    SLIDER = '#BABEC2',
    SLIDER_LABEL = '#8B8B8C',
    DETAILS_BACKGROUND = '#FFFFFF',
    DETAILS_LINK = '#0076EB',
}
