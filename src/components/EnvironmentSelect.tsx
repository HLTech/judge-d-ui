import * as React from 'react';
import { Dropdown, DropdownProps } from 'semantic-ui-react';
import { Environment } from './types';
import { css } from 'emotion';

export interface EnvironmentSelectProps {
    env: Environment;
    disabled: boolean;

    onEnvironmentChange(type: Environment): void;
}

const dropdownEnvironments = Object.values(Environment).map((type: string) => ({
    text: type,
    value: type,
}));

export const EnvironmentSelect: React.FC<EnvironmentSelectProps> = ({ env, disabled, onEnvironmentChange }) => {
    const handleEnvironmentChange = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
        onEnvironmentChange(data.value as Environment);
    };

    return (
        <div className={dropdownContainerCls}>
            <span>Please Select Environment</span>

            <Dropdown
                className={dropdownCls}
                data-test="environment-select"
                fluid={true}
                multiple={false}
                selection={true}
                options={dropdownEnvironments}
                onChange={handleEnvironmentChange}
                value={env}
                disabled={disabled}
            />
        </div>
    );
};

const dropdownContainerCls = css({
    minWidth: 200,
});

const dropdownCls = css({
    minWidth: 100,
    width: '100%',
    display: 'inline-block',
});
