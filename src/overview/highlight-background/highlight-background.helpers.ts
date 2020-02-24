import {
    selectDetailsButtonRect,
    selectDetailsButtonText,
    selectDetailsButtonWrapper,
    selectHighlightBackground,
    selectHighLightedNodes,
} from '../../utils/helpers/Selectors';
import { selectAll } from 'd3-selection';
import { BACKGROUND_HIGHLIGHT_OPACITY, BASE_FONT_SIZE, TRANSITION_DURATION } from '../../utils/AppConsts';
import { ZoomScaleStorage } from '../../utils/helpers/UserEventHelpers';
import { centerScreenToDimension, findGroupBackgroundDimension } from '../overview.helpers';

export function hideHighlightBackground() {
    const detailsButtonRectSelection = selectDetailsButtonRect();
    const detailsButtonTextSelection = selectDetailsButtonText();
    selectAll([selectHighlightBackground().node(), detailsButtonRectSelection.node(), detailsButtonTextSelection.node()])
        .transition()
        .duration(TRANSITION_DURATION)
        .style('opacity', 0)
        .end()
        .then(() => {
            selectDetailsButtonWrapper().lower();
        });
}

export function getButtonDimension(dimension: ReturnType<typeof findGroupBackgroundDimension>, scale: number) {
    if (!dimension) {
        return {
            buttonWidth: 0,
            buttonHeight: 0,
            buttonMarginBottom: 0,
            buttonMarginRight: 0,
            buttonX: 0,
            buttonY: 0,
            buttonRadius: 0,
            buttonTextFontSize: 0,
            buttonTextPositionX: 0,
            buttonTextPositionY: 0,
        };
    }
    const scaleMultiplier = 1 / scale;

    const buttonWidth = 100 * scaleMultiplier;
    const buttonHeight = 60 * scaleMultiplier;
    const buttonMarginBottom = 10 * scaleMultiplier;
    const buttonMarginRight = 40 * scaleMultiplier;
    const buttonX = dimension.x + dimension.width - buttonWidth - buttonMarginRight;
    const buttonY = dimension.y + dimension.height - buttonHeight - buttonMarginBottom;
    const buttonRadius = 5 * scaleMultiplier;
    const buttonTextFontSize = BASE_FONT_SIZE * scaleMultiplier;
    const buttonTextPositionX = dimension.x + dimension.width - buttonWidth / 2 - buttonMarginRight;
    const buttonTextPositionY = dimension.y + dimension.height - buttonHeight / 2 + 6 * scaleMultiplier - buttonMarginBottom;
    return {
        buttonWidth,
        buttonHeight,
        buttonMarginBottom,
        buttonMarginRight,
        buttonX,
        buttonY,
        buttonRadius,
        buttonTextFontSize,
        buttonTextPositionX,
        buttonTextPositionY,
    };
}

function showHighlightBackground(dimension: ReturnType<typeof findGroupBackgroundDimension>) {
    if (!dimension) {
        return;
    }
    const highlightBackground = selectHighlightBackground();
    const detailsButtonRectSelection = selectDetailsButtonRect();
    const detailsButtonTextSelection = selectDetailsButtonText();

    const isBackgroundActive = highlightBackground.style('opacity') === String(BACKGROUND_HIGHLIGHT_OPACITY);

    const scale = ZoomScaleStorage.getScale();

    const {
        buttonWidth,
        buttonHeight,
        buttonX,
        buttonY,
        buttonRadius,
        buttonTextFontSize,
        buttonTextPositionX,
        buttonTextPositionY,
    } = getButtonDimension(dimension, scale);

    const elementsNextAttributes = [
        {
            x: dimension.x,
            y: dimension.y,
            width: dimension.width,
            height: dimension.height,
            opacity: BACKGROUND_HIGHLIGHT_OPACITY,
        },
        {
            x: buttonX,
            y: buttonY,
            rx: buttonRadius,
            ry: buttonRadius,
            width: buttonWidth,
            height: buttonHeight,
            opacity: 1,
        },
        {
            fontSize: buttonTextFontSize,
            x: buttonTextPositionX,
            y: buttonTextPositionY,
            opacity: 1,
        },
    ];

    if (isBackgroundActive) {
        selectAll([highlightBackground.node(), detailsButtonRectSelection.node(), detailsButtonTextSelection.node()])
            .data(elementsNextAttributes)
            .transition()
            .duration(TRANSITION_DURATION)
            .attr('x', data => data.x)
            .attr('y', data => data.y)
            .attr('rx', data => data.rx || 0)
            .attr('ry', data => data.ry || 0)
            .attr('width', data => data.width || 0)
            .attr('height', data => data.height || 0)
            .attr('font-size', data => data.fontSize || 0);
    } else {
        selectDetailsButtonWrapper().raise();
        selectAll([highlightBackground.node(), detailsButtonRectSelection.node(), detailsButtonTextSelection.node()])
            .data(elementsNextAttributes)
            .attr('x', data => data.x)
            .attr('y', data => data.y)
            .attr('rx', data => data.rx || 0)
            .attr('ry', data => data.ry || 0)
            .attr('width', data => data.width || 0)
            .attr('height', data => data.height || 0)
            .attr('font-size', data => data.fontSize || 0)
            .transition()
            .duration(TRANSITION_DURATION)
            .style('opacity', data => data.opacity);
    }
}

export function zoomToHighLightedNodes() {
    const highlightedNodes = selectHighLightedNodes();
    const dimension = findGroupBackgroundDimension(highlightedNodes.data());

    centerScreenToDimension(dimension);
    showHighlightBackground(dimension);
}
