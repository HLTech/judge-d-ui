import { Mockiavelli } from 'mockiavelli';
import { mockGetEnvironments, mockGetServices } from './requests-mocks';
import config from '../../jest-puppeteer.config';

describe('App', () => {
    let mockiavelli: Mockiavelli;

    beforeEach(async () => {
        await jestPuppeteer.resetPage();

        mockiavelli = await Mockiavelli.setup(page);
        mockGetEnvironments(mockiavelli);
        mockGetServices(mockiavelli);

        await page.goto(`http://localhost:${config.server.port}`);
    });

    test('Basic test', async () => {
        await page.waitForSelector(byTestId('label'));
    });
});

function byTestId(testId: string) {
    return `[data-test-id="${testId}"]`;
}
