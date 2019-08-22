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
    ],
};
