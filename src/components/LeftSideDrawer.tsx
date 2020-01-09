import React from 'react';
import { EnvironmentSelect } from './EnvironmentSelect';
import { css } from 'emotion';
import { CheckboxProps, Radio } from 'semantic-ui-react';

interface LeftSideDrawerProps {
    selectedEnvironment: string;
    environmentOptions: string[];
    areControlsDisabled: boolean;
    areOnlyConnectedNodesShown: boolean;

    closeMenu(): void;
    handleViewSwitchChange(e: React.FormEvent<HTMLInputElement>, data: CheckboxProps): void;
    onEnvironmentChange(env: string): void;
}

export const LeftSideDrawer: React.FC<LeftSideDrawerProps> = ({
    selectedEnvironment,
    environmentOptions,
    areControlsDisabled,
    onEnvironmentChange,
    closeMenu,
    areOnlyConnectedNodesShown,
    handleViewSwitchChange,
}) => (
    <div className={backgroundCls}>
        <div className={containerCls}>
            <h1 className={headerCls}>judge-d</h1>
            <p className={descriptionCls}>Contract testing tool for microservices architecture</p>
            <EnvironmentSelect
                env={selectedEnvironment}
                disabled={areControlsDisabled}
                options={environmentOptions}
                onEnvironmentChange={onEnvironmentChange}
            />
            {process.env.NODE_ENV === 'development' && (
                <Radio onChange={handleViewSwitchChange} toggle checked={areOnlyConnectedNodesShown} />
            )}
        </div>
        <div className={shadowCls} onClick={() => closeMenu()} />
    </div>
);

const backgroundCls = css({
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

const containerCls = css({
    display: 'grid',
    gridTemplateRows: '60px 60px auto',
    borderTop: '15px solid #E5E5E6',
    backgroundColor: '#ffffff',
    padding: '32px 38px',
    boxShadow: '0px 0px 60px #00000010',
});

const shadowCls = css({
    backgroundColor: '#00000040',
});
