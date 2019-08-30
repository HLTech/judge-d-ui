import { DependencyLink, DependencyNode, Network, Service } from '../../components/types';
import { ServiceDto } from '../../api/api.types';

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
        const sourceNode = nodes.find((node: DependencyNode) => node.name === service.name && node.version === service.version);
        providerNames.forEach((name: string) => {
            const targetNode = nodes.find((node: DependencyNode) => node.name === name);

            Object.keys(service.expectations[name]).forEach((connectionType: string) => {
                if (sourceNode && targetNode) {
                    linksWithTypes.push({
                        source: sourceNode,
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
    }));
    return {
        nodes,
        links: createLinks(nodes, services),
    };
}

export function filterConnectedNodes(network: Network) {
    return network.nodes.filter(
        (node: DependencyNode) =>
            network.links.findIndex(
                (link: DependencyLink) =>
                    (link.source.name === node.name && link.source.version === node.version) ||
                    (link.target.name === node.name && link.target.version === node.version)
            ) >= 0
    );
}
