import { DependencyNode, RenderedDependencyNode } from '../../../src/components/types';
import { getRenderedNodes } from '../../../src/utils/helpers/GraphHelpers';

const emptyDependencyNode: DependencyNode = {
    name: '',
    version: '',
    isProvider: false,
    isConsumer: false,
    links: [],
    level: 0,
};

const nodeWithPositionAndSize: RenderedDependencyNode = {
    ...emptyDependencyNode,
    x: 0,
    y: 0,
    width: 0,
};

describe('getRenderedNodes', () => {
    it('should filter nodes that dont have x, y or width props', () => {
        const nodeWithoutX: DependencyNode = {
            ...nodeWithPositionAndSize,
            x: undefined,
        };
        const nodeWithoutY: DependencyNode = {
            ...nodeWithPositionAndSize,
            y: undefined,
        };
        const nodeWithoutWidth: DependencyNode = {
            ...nodeWithPositionAndSize,
            width: undefined,
        };
        const inputArray = [nodeWithoutX, nodeWithoutY, nodeWithoutWidth, nodeWithPositionAndSize];
        expect(getRenderedNodes(inputArray)).toEqual([nodeWithPositionAndSize]);
    });
});
