import { DependencyLink, DependencyNode, Network, Service, TreeNode } from '../../components/types';
import { ServiceDto } from '../../api/api.types';
import { compareNodes } from '../../overview/overview.helpers';

export function mapServiceDtoToService(serviceDto: ServiceDto): Service {
    const service: Service = {
        name: serviceDto.name,
        version: serviceDto.version,
        capabilities: {},
        expectations: {},
    };

    const { expectations, capabilities } = serviceDto;

    const providerServices = Object.keys(expectations);

    providerServices.forEach((serviceName: string) => {
        service.expectations[serviceName] = {};
        const types = Object.keys(expectations[serviceName]);

        types.forEach((type: string) => {
            service.expectations[serviceName][type] = {
                ...expectations[serviceName][type],
                value: JSON.parse(expectations[serviceName][type].value),
            };
        });
    });

    const capabilityTypes = Object.keys(capabilities);

    capabilityTypes.forEach((type: string) => {
        service.capabilities[type] = {
            ...capabilities[type],
            value: JSON.parse(capabilities[type].value),
        };
    });

    return service;
}

export function createLinks(nodes: DependencyNode[], services: Service[]): DependencyLink[] {
    return services.reduce((links: DependencyLink[], service: Service) => {
        const linksWithTypes: DependencyLink[] = [];
        const providerNames = Object.keys(service.expectations);
        const serviceSourceNode = nodes.find((node: DependencyNode) => compareNodes(node, service));

        providerNames.forEach((name: string) => {
            const targetNode = nodes.find((node: DependencyNode) => node.name === name);
            if (serviceSourceNode && targetNode) {
                serviceSourceNode.links.push(targetNode);
                targetNode.links.push(serviceSourceNode);
            }
            Object.keys(service.expectations[name]).forEach((connectionType: string) => {
                if (serviceSourceNode && targetNode) {
                    linksWithTypes.push({
                        source: serviceSourceNode,
                        target: targetNode,
                        type: connectionType,
                    });
                }
            });
        });

        return [...links, ...linksWithTypes];
    }, []);
}

export function createNetworkFromServices(services: Service[]): Network {
    const nodes = services.map((service: Service) => ({
        name: service.name,
        version: service.version,
        isProvider: Object.keys(service.capabilities).length > 0,
        isConsumer: Object.keys(service.expectations).length > 0,
        links: [],
        level: 0,
    }));
    return {
        nodes,
        links: createLinks(nodes, services),
        detailsNodes: mapServicesToTreeNodes(services),
    };
}

export function filterConnectedNodes(network: Network) {
    return network.nodes.filter(
        (node: DependencyNode) =>
            network.links.findIndex((link: DependencyLink) => compareNodes(link.source, node) || compareNodes(link.target, node)) >= 0
    );
}

export function mapServicesToTreeNodes(services: Service[]): TreeNode[] {
    const allNodes: TreeNode[] = services.map(service => ({
        name: service.name,
        consumers: [],
        providers: [],
    }));

    services.forEach(service => {
        const node = allNodes.find(node => node.name === service.name)!;
        const providerNames = Object.keys(service.expectations);

        providerNames.forEach((name: string) => {
            const providerNode = allNodes.find(targetNode => targetNode.name === name);

            if (providerNode) {
                node.providers.push(providerNode);
                providerNode.consumers.push(node);
            }
        });
    });

    return allNodes;
}
