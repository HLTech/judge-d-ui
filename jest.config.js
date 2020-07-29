module.exports = {
    restoreMocks: true,

    projects: [
        {
            displayName: 'unit',
            preset: 'ts-jest',
            testEnvironment: 'jsdom',
            roots: ['test/unit'],
        },
        {
            displayName: 'integration',
            preset: 'ts-jest',
            testEnvironment: 'jsdom',
            roots: ['test/integration'],
            setupFilesAfterEnv: ['./test/integration/setupTests.ts'],
            globals: {
                'ts-jest': {
                    tsConfig: 'test/tsconfig.json',
                },
            },
            moduleNameMapper: {
                '\\.(css|less)$': '<rootDir>/test/__mocks__/styleMock.js',
            },
        },
        {
            displayName: 'functional',
            preset: 'ts-jest',
            roots: ['./test/functional'],
            globalSetup: 'jest-environment-puppeteer/setup',
            globalTeardown: 'jest-environment-puppeteer/teardown',
            testEnvironment: 'jest-environment-puppeteer',
            setupFilesAfterEnv: ['expect-puppeteer'],
        },
    ],
};
