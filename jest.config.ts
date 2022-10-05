import type { JestConfigWithTsJest } from 'ts-jest/dist/types';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
        jsdom: 'ts-jest',
    },
    roots: ['tests'],
};

export default config;
