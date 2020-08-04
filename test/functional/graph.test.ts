import { Mockiavelli } from 'mockiavelli';
import { mockGetEnvironments, mockGetServices } from './requests-mocks';
import config from '../../jest-puppeteer.config';
import { byTestId } from './selectors';
import { Overview } from './views/overview';
import { getElementBBox, waitForAllTransitions, waitForGraphStabilization } from './graph.helpers';

describe('Graph', () => {
    let mockiavelli: Mockiavelli;

    const overview = new Overview();

    beforeEach(async () => {
        await jestPuppeteer.resetPage();

        mockiavelli = await Mockiavelli.setup(page);
        mockGetEnvironments(mockiavelli);
        mockGetServices(mockiavelli);

        await page.goto(`http://localhost:${config.server.port}`);
        await page.waitForSelector(byTestId('node'));
    });

    test('shows nodes with service name in label and version in tooltip visible on hover', async () => {
        const nodes = await overview.getNodes();

        expect(await overview.getNodesText(nodes)).toEqual(['service-1', 'service-2', 'service-3']);
        expect(await overview.getNodesTooltipText(nodes)).toEqual(['1.1.0', '1.2.0', '1.3.0']);
    });

    test('highlights connected nodes on click with range expansion via arrow keys', async () => {
        const nodes = await overview.getNodes();

        expect(await overview.getHighlightedClickedNodeText()).toBe('');
        expect(await overview.getHighlightedConnectedNodesTexts()).toEqual([]);
        expect(await overview.isHighlightBackgroundVisible()).toBeFalsy();

        await nodes[0].click();
        expect(await overview.getHighlightedClickedNodeText()).toBe('service-1');
        expect(await overview.getHighlightedConnectedNodesTexts()).toEqual(['service-2']);

        expect(await overview.isHighlightBackgroundVisible()).toBeTruthy();

        await nodes[0].press('ArrowRight');
        expect(await overview.getHighlightedConnectedNodesTexts()).toEqual(['service-2', 'service-3']);

        // press again to make sure state doesnt change if range is max already
        await nodes[0].press('ArrowRight');
        expect(await overview.getHighlightedConnectedNodesTexts()).toEqual(['service-2', 'service-3']);

        await nodes[0].press('ArrowLeft');
        expect(await overview.getHighlightedConnectedNodesTexts()).toEqual(['service-2']);

        // press again to make sure state doesnt change if range is min already
        await nodes[0].press('ArrowLeft');
        expect(await overview.getHighlightedConnectedNodesTexts()).toEqual(['service-2']);

        await overview.clickOutsideNode();

        expect(await overview.getHighlightedClickedNodeText()).toBe('');
        expect(await overview.getHighlightedConnectedNodesTexts()).toEqual([]);

        await waitForAllTransitions();
        expect(await overview.isHighlightBackgroundVisible()).toBeFalsy();
    });

    test('allows nodes dragging when no node is in clicked state', async () => {
        const nodes = await overview.getNodes();

        await waitForGraphStabilization();

        let firstNodeBBox = await getElementBBox(nodes[0]);

        await overview.dragNode(nodes[0]);
        await waitForGraphStabilization();
        expect(await getElementBBox(nodes[0])).not.toEqual(firstNodeBBox);

        await nodes[0].click();
        await waitForGraphStabilization();

        firstNodeBBox = await getElementBBox(nodes[0]);
        await overview.dragNode(nodes[0]);
        expect(await getElementBBox(nodes[0])).toEqual(firstNodeBBox);

        // assert that other nodes cant be moved either
        const secondNodeBBox = await getElementBBox(nodes[1]);
        await overview.dragNode(nodes[1]);
        expect(await getElementBBox(nodes[1])).toEqual(secondNodeBBox);

        await overview.clickOutsideNode();

        await overview.dragNode(nodes[0]);
        expect(await nodes[0].boundingBox()).not.toEqual(firstNodeBBox);
        expect(await nodes[1].boundingBox()).not.toEqual(secondNodeBBox);
    });
});
