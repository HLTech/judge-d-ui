import * as React from 'react';
import { EnvironmentSelect, EnvironmentSelectProps } from '../../src/components/EnvironmentSelect';
import { render, fireEvent, within } from '@testing-library/react';

describe('EnvironmentSelect', () => {
    it('should render', () => {
        const mockedProps = generateProps();
        render(<EnvironmentSelect {...mockedProps} />);
    });

    it('should change environment', () => {
        const mockedProps = generateProps();
        const { getByTestId } = render(<EnvironmentSelect {...mockedProps} />);
        const environmentSelect = getByTestId('environment-select') as HTMLDivElement;
        expect(environmentSelect.children[0].textContent).toBe(mockedProps.env);

        const selectedEnvironment = mockedProps.options[1];
        const selectedOption = within(environmentSelect).getByText(selectedEnvironment);
        fireEvent.click(selectedOption);

        expect(mockedProps.onEnvironmentChange).toHaveBeenCalledWith(selectedEnvironment);
    });
});

function generateProps(props?: EnvironmentSelectProps): EnvironmentSelectProps {
    return {
        env: 'DEMO',
        disabled: false,
        onEnvironmentChange: jest.fn(),
        options: ['DEMO', 'SIT', 'UAT'],
        ...props,
    };
}
