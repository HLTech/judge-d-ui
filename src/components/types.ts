import { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';
import { BaseType, Selection } from 'd3-selection';

export interface Network {
    nodes: DependencyNode[];
    links: DependencyLink[];
}

export interface DependencyNode extends SimulationNodeDatum {
    name: string;
    version: string;
    isProvider: boolean;
    isConsumer: boolean;
    width?: number;
    height?: number;
    links: Array<DependencyNode>;
    level: number;
}

export interface DependencyLink extends SimulationLinkDatum<DependencyNode> {
    source: DependencyNode;
    target: DependencyNode;
    type: string;
}

export interface Service {
    name: string;
    version: string;
    capabilities: ServiceCommunication;
    expectations: Expectations;
}

export interface Expectations {
    [key: string]: ServiceCommunication;
}

export interface ServiceCommunication {
    [key: string]: {
        value: object;
        mimeType: string;
    };
}

export type NodeSelection<T extends BaseType> = Selection<T, DependencyNode, Element, HTMLElement>;

export type LinkSelection = Selection<SVGPathElement, DependencyLink, SVGGElement, DependencyNode>;
