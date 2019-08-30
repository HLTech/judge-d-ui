import * as React from 'react';
import { EnvironmentSelect, EnvironmentSelectProps } from '../../src/components/EnvironmentSelect';
import { Environment } from '../../src/components/types';
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

        const optionUAT = within(environmentSelect).getByText(Environment.UAT);
        fireEvent.click(optionUAT);

        expect(mockedProps.onEnvironmentChange).toHaveBeenCalledWith(Environment.UAT);
    });
});

function generateProps(props?: EnvironmentSelectProps): EnvironmentSelectProps {
    return {
        env: Environment.DEMO,
        disabled: false,
        onEnvironmentChange: jest.fn(),
        ...props,
    };
}
