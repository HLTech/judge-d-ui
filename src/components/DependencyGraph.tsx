import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { css } from 'emotion';
import { LoaderComponent } from './LoaderComponent';
import { DependencyNode, Environment, Network, Service } from './types';
import { createNetworkFromServices, filterConnectedNodes } from '../helpers/MappingHelpers';
import { EnvironmentSelect } from './EnvironmentSelect';
import { CheckboxProps, Radio } from 'semantic-ui-react';
import { Graph } from './Graph';
import { getEnvironmentServicesRequest } from '../api/api';

export const DependencyGraph: React.FC = () => {
    const [nodes, setNodes] = useState<DependencyNode[]>([]);
    const [isPending, setIsPending] = useState<boolean>(true);
    const [services, setServices] = useState<Service[]>([]);
    const [env, setEnv] = useState<Environment>(Environment.DEMO);
    const [showOnlyConnectedNodes, setShowOnlyConnectedNodes] = useState<boolean | undefined>(false);

    const graphNetwork: Network = useMemo(() => createNetworkFromServices(services), [services]);
    const onlyNodesWithContracts = useMemo(() => filterConnectedNodes(graphNetwork), [graphNetwork]);

    useEffect(() => {
        setIsPending(true);
        getEnvironmentServicesRequest(env)
            .then((data: Service[]) => {
                setServices(data);
                setIsPending(false);
            })
            .catch((error: Error) => {
                console.log(error);
            });
    }, [env]);

    useEffect(() => {
        if (showOnlyConnectedNodes) {
            setNodes(onlyNodesWithContracts);
        } else {
            setNodes(graphNetwork.nodes);
        }
    }, [showOnlyConnectedNodes, onlyNodesWithContracts, graphNetwork]);

    return (
        <div className={containerCls}>
            <Radio
                onChange={(e: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => setShowOnlyConnectedNodes(data.checked)}
                toggle
                checked={showOnlyConnectedNodes}
            />

            <EnvironmentSelect disabled={isPending} env={env} onEnvironmentChange={setEnv} />

            {isPending && <LoaderComponent />}

            <Graph nodes={nodes} links={graphNetwork.links} />
        </div>
    );
};

const containerCls = css({
    padding: 20,
});
