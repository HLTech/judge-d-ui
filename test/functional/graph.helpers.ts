import { ElementHandle } from 'puppeteer';
import { TRANSITION_DURATION } from '../../src/utils/AppConsts';

export async function waitForGraphStabilization() {
    await page.waitFor(500);
}

export async function waitForAllTransitions() {
    await page.waitFor(TRANSITION_DURATION);
}

// Replacement of element.boundingBox() - we need to get node positions within SVG container, not relative to main frame
export async function getElementBBox(element: ElementHandle<SVGGraphicsElement>) {
    return await element.evaluate(el => {
        const { x, y, width, height } = el.getBBox();
        return { x, y, width, height };
    });
}
