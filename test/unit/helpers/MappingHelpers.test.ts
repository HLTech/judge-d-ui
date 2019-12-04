import { mapServiceDtoToService, mapServicesToTreeNodes } from '../../../src/utils/helpers/MappingHelpers';
import { ExpectationsDto, ServiceCommunicationDto, ServiceDto } from '../../../src/api/api.types';
import { Service, TreeNode } from '../../../src/components/types';
import { emptyService } from './MappingHelpers.fixture';

describe('mapServiceDtoToService', () => {
    it('should correctly map empty serviceDto to service', () => {
        const serviceDto = {
            name: 'ui',
            version: '1.0.0',
            capabilities: {},
            expectations: {},
        };

        expect(mapServiceDtoToService(serviceDto).name).toBe(serviceDto.name);
        expect(mapServiceDtoToService(serviceDto).version).toBe(serviceDto.version);
        expect(mapServiceDtoToService(serviceDto)).toMatchObject({ capabilities: {}, expectations: {} });
    });

    it('should correctly map serviceDto to service', () => {
        const capabilities = generateConnections(['rest']);
        const expectations = { provider: generateConnections(['jms']) };
        const serviceDto = {
            name: 'ui',
            version: '1.0.0',
            capabilities,
            expectations,
        };

        expect(mapServiceDtoToService(serviceDto).name).toBe(serviceDto.name);
        expect(mapServiceDtoToService(serviceDto).version).toBe(serviceDto.version);
        expect(mapServiceDtoToService(serviceDto).capabilities.rest).toEqual({
            value: JSON.parse(capabilities.rest.value),
            mimeType: capabilities.rest.mimeType,
        });
        expect(mapServiceDtoToService(serviceDto).expectations.provider).toBeDefined();
        expect(mapServiceDtoToService(serviceDto).expectations.provider.jms).toEqual({
            value: JSON.parse(expectations.provider.jms.value),
            mimeType: expectations.provider.jms.mimeType,
        });
    });

    it('should correctly map serviceDto with multiple connection types', () => {
        const capabilities = generateConnections(['rest', 'jms', 'custom']);
        const expectations = { provider: generateConnections(['rest', 'jms', 'custom']) };

        const serviceDto: ServiceDto = {
            name: 'ui',
            version: '1.0.0',
            capabilities,
            expectations,
        };

        ['jms', 'rest', 'custom'].forEach((type: string) => {
            expect(mapServiceDtoToService(serviceDto).capabilities[type]).toBeDefined();
            expect(mapServiceDtoToService(serviceDto).expectations.provider[type]).toBeDefined();
            expect(mapServiceDtoToService(serviceDto)).toMatchObject({
                capabilities: {
                    [type]: {
                        value: JSON.parse(capabilities[type].value),
                        mimeType: capabilities[type].mimeType,
                    },
                },
                expectations: {
                    provider: {
                        [type]: {
                            value: JSON.parse(expectations.provider[type].value),
                            mimeType: expectations.provider.jms.mimeType,
                        },
                    },
                },
            });
        });
    });

    it('should correctly map serviceDto with multiple providers', () => {
        const expectations: ExpectationsDto = {
            firstService: generateConnections(['rest']),
            secondService: generateConnections(['rest']),
            thirdService: generateConnections(['rest']),
        };

        const serviceDto = {
            name: 'ui',
            version: '1.0.0',
            capabilities: {},
            expectations,
        };

        ['firstService', 'secondService', 'thirdService'].forEach((provider: string) => {
            expect(mapServiceDtoToService(serviceDto).expectations[provider]).toBeDefined();
            expect(mapServiceDtoToService(serviceDto).expectations[provider].rest).toEqual({
                value: JSON.parse(expectations[provider].rest.value),
                mimeType: expectations[provider].rest.mimeType,
            });
        });
    });
});

describe('mapServicesToTreeNodes', () => {
    it('should return empty table for given empty table', () => {
        expect(mapServicesToTreeNodes([])).toEqual([]);
    });

    it('should properly map services to tree nodes', () => {
        const services: Service[] = [
            {
                ...emptyService,
                name: 'service-1',
                expectations: {
                    'service-2': {
                        rest: {
                            value: {},
                            mimeType: '',
                        },
                    },
                },
            },
            {
                ...emptyService,
                name: 'service-2',
            },
        ];
        const firstTreeNode: TreeNode = {
            consumers: [],
            name: 'service-1',
            providers: [],
        };
        const secondTreeNode: TreeNode = {
            consumers: [firstTreeNode],
            name: 'service-2',
            providers: [],
        };
        firstTreeNode.providers = [secondTreeNode];
        expect(mapServicesToTreeNodes(services)).toEqual([firstTreeNode, secondTreeNode]);
    });
});

function generateConnections(connection: string[]): ServiceCommunicationDto {
    return connection.reduce(
        (connections: ServiceCommunicationDto, type: string) => ({
            ...connections,
            [type]: {
                value: JSON.stringify(type),
                mimeType: 'application/json',
            },
        }),
        {}
    );
}
