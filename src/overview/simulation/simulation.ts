import { DependencyLink, DependencyNode } from '../../components/types';
import { forceCenter, forceCollide, forceLink, forceSimulation, forceY, Simulation } from 'd3-force';
import { drag } from 'd3-drag';
import { selectHighLightedNodes } from '../../utils/helpers/Selectors';
import { event } from 'd3-selection';
import { hideTooltip, showTooltip } from '../tooltip/tooltip';

export function createSimulation(nodes: DependencyNode[], links: DependencyLink[], width: number, height: number) {
    return forceSimulation(nodes)
        .force(
            'dependency',
            forceLink<DependencyNode, DependencyLink>(links)
                .distance(180)
                .id((node: DependencyNode) => node.name)
        )
        .force('center', forceCenter(width / 2, height / 2))
        .force('y', forceY(0.5))
        .force('collide', forceCollide(140))
        .force('nodeCollide', forceCollide(140));
}

export function addNodesDrag(simulation: Simulation<DependencyNode, DependencyLink>) {
    let isDragStarted = false;
    return drag<SVGGElement, DependencyNode>()
        .on('start', (node: DependencyNode) => {
            if (!selectHighLightedNodes().data().length) {
                dragStarted(node, simulation);
                isDragStarted = true;
                hideTooltip();
            }
        })
        .on('drag', (node: DependencyNode) => {
            if (isDragStarted) {
                dragged(node);
            }
        })
        .on('end', (node: DependencyNode) => {
            dragEnded(node, simulation);
            isDragStarted = false;
            showTooltip();
        });
}

function dragStarted(node: DependencyNode, simulation: Simulation<DependencyNode, DependencyLink>) {
    if (!event.active) {
        simulation.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
}

function dragged(node: DependencyNode) {
    node.fx = event.x;
    node.fy = event.y;
}

function dragEnded(node: DependencyNode, simulation: Simulation<DependencyNode, DependencyLink>) {
    if (!event.active) {
        simulation.alphaTarget(0);
    }
    node.fx = null;
    node.fy = null;
}
