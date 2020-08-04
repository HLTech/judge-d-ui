import { byTestId } from '../selectors';
import { ElementHandle } from 'puppeteer';
import { getElementBBox } from '../graph.helpers';

export class Overview {
    public async getNodes() {
        await page.waitForSelector(byTestId('node'));
        return page.$$(byTestId('node'));
    }

    public async getNodesText(nodes: ElementHandle[]) {
        return Promise.all(nodes.map(this.getNodeText));
    }

    public async getNodesTooltipText(nodes: ElementHandle[]) {
        // hover each node sequentially
        let tooltipTexts = [];
        for (const node of nodes) {
            await node.hover();
            await page.waitForSelector(byTestId('tooltip'), { visible: true });
            const tooltip = await page.$(byTestId('tooltip'));
            const tooltipText = await tooltip?.getProperty('textContent');
            tooltipTexts.push(await tooltipText?.jsonValue());
        }
        return tooltipTexts;
    }

    public async getHighlightedClickedNodeText() {
        const allNodes = await this.getNodes();

        let clickedNode: ElementHandle | undefined;

        for (const node of allNodes) {
            const { labelColor, textColor } = await this.getNodeColors(node);

            if (labelColor === '#071D49' && textColor === '#FFFFFF') {
                clickedNode = node;
                break;
            }
        }

        if (clickedNode === undefined) {
            return '';
        }

        return this.getNodeText(clickedNode);
    }

    public async getHighlightedConnectedNodesTexts() {
        const allNodes = await this.getNodes();

        const highlightedNodes = [];

        for (const node of allNodes) {
            const { labelColor, textColor } = await this.getNodeColors(node);

            if (labelColor === '#00C29E' && textColor === '#FFFFFF') {
                highlightedNodes.push(node);
            }
        }

        return this.getNodesText(highlightedNodes);
    }

    public async isHighlightBackgroundVisible() {
        const background = await this.getHighlightBackground();
        return Number(await background?.evaluate(el => (el as SVGRectElement).style.opacity)) > 0;
    }

    public async clickOutsideNode() {
        const background = await this.getHighlightBackground();
        await background?.click();
    }

    public async dragNode(node: ElementHandle) {
        const { x, y, width, height } = await getElementBBox(node);

        await page.mouse.move(x + width / 2, y + height / 2);
        await page.mouse.down();
        await page.mouse.move(x - 100, y - 100);
        await page.waitFor(100);
        await page.mouse.up();
    }

    private async getNodeText(node: ElementHandle) {
        const textContent = await node.getProperty('textContent');
        return textContent.jsonValue();
    }

    private async getNodeColors(node: ElementHandle) {
        const labelColor = await node.$eval('path', el => el.getAttribute('fill'));
        const textColor = await node.$eval('text', el => el.getAttribute('fill'));

        return { labelColor, textColor };
    }

    private async getHighlightBackground() {
        return page.$(byTestId('highlight-background'));
    }
}
