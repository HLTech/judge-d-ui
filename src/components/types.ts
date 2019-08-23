import { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';

export enum Environment {
    SIT = 'SIT',
    UAT = 'UAT',
}

export interface Network {
    nodes: DependencyNode[];
    links: DependencyLink[];
}

export interface DependencyNode extends SimulationNodeDatum {
    name: string;
    version: string;
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
