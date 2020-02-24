import { NodeSelection } from '../components/types';
import { ElementIds, Colors } from '../utils/AppConsts';
import { createNodeLabelPath, getTextDimensions } from '../overview/graph-nodes';

// these magic numbers(-30, -36.5) are dependant of how node labels are painted relative to label text
const labelPathWidthOffset = -30;
const labelPathHeightOffset = -36.5;

export async function createRootNode(
    container: NodeSelection<any>,
    viewboxWidth: number,
    viexboxHeight: number,
    rootNodeName: string,
    isConsumer: boolean,
    isProvider: boolean
) {
    const nodeContainer = container
        .append('svg')
        .attr('id', ElementIds.DETAILS_ROOT_NODE_CONTAINER)
        .attr('font-size', 15)
        // hard-coded magic numbers that translates root node to position of root of the tree graphs
        .attr('viewBox', `-${viewboxWidth / 3.2} -${viexboxHeight / 2} ${viewboxWidth} ${viexboxHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    const label = nodeContainer.append('path').attr('fill', Colors.CLIFTON_NAVY);
    const text = nodeContainer
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', Colors.WHITE)
        .text(rootNodeName);
    await delayPromise();
    const { height, y } = getTextDimensions(text.node()) || { height: 0, y: 0 };
    const labelPath = createNodeLabelPath(label.node(), isConsumer, isProvider);
    label.attr('d', labelPath).attr('transform', `translate(${labelPathWidthOffset}, ${y + labelPathHeightOffset})`);
    // center text vertically on label
    text.attr('y', y + height + 1);
}

function delayPromise(delay: number = 0) {
    return new Promise(resolve => setTimeout(resolve, delay));
}
