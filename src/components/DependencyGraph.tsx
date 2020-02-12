import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { LoaderComponent } from './LoaderComponent';
import { DependencyNode, Network, Service } from './types';
import { createNetworkFromServices, filterConnectedNodes } from '../utils/helpers/MappingHelpers';
import { Button, CheckboxProps, Icon } from 'semantic-ui-react';
import { Graph } from './Graph';
import { getServicesRequest, getEnvironmentsRequest } from '../api/api';
import 'semantic-ui-css/semantic.css';
import { css } from 'emotion';
import { LeftSideDrawer } from './LeftSideDrawer';

export const DependencyGraph: React.FC = () => {
    const [nodes, setNodes] = useState<DependencyNode[]>([]);
    const [isPending, setIsPending] = useState<boolean>(true);
    const [services, setServices] = useState<Service[]>([]);
    const [env, setEnv] = useState<string>('');
    const [environments, setEnvironments] = useState<string[]>([]);
    const [shouldShowAllNodes, setShouldShowAllNodes] = useState<boolean>(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const graphNetwork: Network = useMemo(() => createNetworkFromServices(services), [services]);
    const onlyNodesWithContracts = useMemo(() => filterConnectedNodes(graphNetwork), [graphNetwork]);

    useEffect(() => {
        setIsPending(true);
        getEnvironmentsRequest()
            .then((environments: string[]) => {
                setEnvironments(environments);
                setEnv(environments[0]);
                setIsPending(false);
            })
            .catch((error: Error) => {
                console.log(error);
                setIsPending(false);
            });
    }, []);

    useEffect(() => {
        if (env) {
            setIsPending(true);
            getServicesRequest(env)
                .then((data: Service[]) => {
                    setServices(data);
                    setIsPending(false);
                })
                .catch((error: Error) => {
                    console.log(error);
                    setIsPending(false);
                });
        }
    }, [env]);

    const onViewSwitchChange = (e: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => setShouldShowAllNodes(Boolean(data.checked));

    useEffect(() => {
        if (shouldShowAllNodes) {
            setNodes(graphNetwork.nodes);
        } else {
            setNodes(onlyNodesWithContracts);
        }
    }, [shouldShowAllNodes, onlyNodesWithContracts, graphNetwork]);

    return (
        <>
            <div className={drawerOpenButtonCls}>
                <Button icon onClick={() => setIsMenuOpen(true)}>
                    <Icon name={'bars'} size={'large'} />
                </Button>
            </div>
            {isPending && <LoaderComponent />}

            <Graph network={{ ...graphNetwork, nodes }} />
            {isMenuOpen && (
                <LeftSideDrawer
                    environmentOptions={environments}
                    selectedEnvironment={env}
                    areControlsDisabled={isPending}
                    onEnvironmentChange={setEnv}
                    onBackgroundClick={() => setIsMenuOpen(false)}
                    shouldShowAllNodes={shouldShowAllNodes}
                    onViewSwitchChange={onViewSwitchChange}
                />
            )}
        </>
    );
};

const drawerOpenButtonCls = css({
    label: 'drawer-open-button',
    position: 'fixed',
    margin: 20,
    zIndex: 5,
});
