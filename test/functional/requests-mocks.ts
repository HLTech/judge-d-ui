import { Mockiavelli } from 'mockiavelli';
import { apiBasePath } from '../../src/api/api';

export function mockGetEnvironments(mockiavelli: Mockiavelli) {
    return mockiavelli.mockGET(
        {
            url: `${apiBasePath}/environments`,
        },
        {
            status: 200,
            body: ['Demo'],
        }
    );
}

export function mockGetServices(mockiavelli: Mockiavelli) {
    return mockiavelli.mockGET(
        {
            url: `${apiBasePath}/interrelationship/Demo`,
        },
        {
            status: 200,
            body: interrelationshipMock,
        }
    );
}

const interrelationshipMock = {
    environment: 'Demo',
    serviceContracts: [
        {
            name: 'service-1',
            version: '1.1.0',
            capabilities: {
                rest: {
                    value: '{}',
                    mimeType: 'application/json',
                },
            },
            expectations: {},
        },
        {
            name: 'service-2',
            version: '1.2.0',
            capabilities: {
                rest: {
                    value: '{}',
                    mimeType: 'application/json',
                },
            },
            expectations: {
                'service-1': {
                    rest: {
                        value: '{}',
                        mimeType: 'application/json',
                    },
                },
            },
        },
        {
            name: 'service-3',
            version: '1.3.0',
            capabilities: {},
            expectations: {
                'service-2': {
                    rest: {
                        value: '{}',
                        mimeType: 'application/json',
                    },
                },
            },
        },
    ],
};
