import * as React from 'react';
import { Dropdown, DropdownProps } from 'semantic-ui-react';
import { css } from 'emotion';
import { useMemo } from 'react';

export interface EnvironmentSelectProps {
    env: string;
    disabled: boolean;
    options: string[];

    onEnvironmentChange(env: string): void;
}

export const EnvironmentSelect: React.FC<EnvironmentSelectProps> = ({ env, options, disabled, onEnvironmentChange }) => {
    const dropdownOptions = useMemo(
        () =>
            options.map((type: string) => ({
                text: type,
                value: type,
            })),
        [options]
    );

    const handleEnvironmentChange = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
        if (data.value) {
            onEnvironmentChange(data.value as string);
        }
    };

    return (
        <div className={dropdownContainerCls}>
            <span>Select Environment</span>

            <Dropdown
                className={dropdownCls}
                data-test="environment-select"
                fluid={true}
                multiple={false}
                selection={true}
                options={dropdownOptions}
                onChange={handleEnvironmentChange}
                value={env}
                disabled={disabled}
            />
        </div>
    );
};

const dropdownContainerCls = css({
    label: 'env-select-container',
    minWidth: 100,
});

const dropdownCls = css({
    label: 'env-select',
    minWidth: 100,
    display: 'inline-block',
});
