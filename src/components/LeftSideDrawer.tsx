import React from 'react';
import { EnvironmentSelect } from './EnvironmentSelect';
import { css } from 'emotion';
import { CheckboxProps, Radio } from 'semantic-ui-react';

interface LeftSideDrawerProps {
    selectedEnvironment: string;
    environmentOptions: string[];
    areControlsDisabled: boolean;
    shouldShowAllNodes: boolean;

    onBackgroundClick(): void;
    onViewSwitchChange(e: React.FormEvent<HTMLInputElement>, data: CheckboxProps): void;
    onEnvironmentChange(env: string): void;
}

export const LeftSideDrawer: React.FC<LeftSideDrawerProps> = ({
    selectedEnvironment,
    environmentOptions,
    areControlsDisabled,
    onEnvironmentChange,
    onBackgroundClick,
    shouldShowAllNodes,
    onViewSwitchChange,
}) => (
    <div className={containerCls}>
        <div className={drawerCls}>
            <h1 className={headerCls}>judge-d</h1>
            <p className={descriptionCls}>Contract testing tool for microservices architecture</p>
            <EnvironmentSelect
                env={selectedEnvironment}
                disabled={areControlsDisabled}
                options={environmentOptions}
                onEnvironmentChange={onEnvironmentChange}
            />
            {process.env.NODE_ENV === 'development' && (
                <div>
                    <Radio onChange={onViewSwitchChange} toggle checked={shouldShowAllNodes} label={'Show all nodes'} />
                </div>
            )}
        </div>
        <div className={shadowCls} onClick={onBackgroundClick} />
    </div>
);

const containerCls = css({
    position: 'fixed',
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    zIndex: 10,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
});

const headerCls = css({
    fontSize: 40,
});

const descriptionCls = css({
    fontSize: 13,
});

const drawerCls = css({
    display: 'grid',
    gridTemplateRows: '60px 60px 80px auto',
    borderTop: '15px solid #E5E5E6',
    backgroundColor: '#ffffff',
    padding: '32px 38px',
    boxShadow: '0px 0px 60px #00000010',
});

const shadowCls = css({
    backgroundColor: '#00000040',
});
