import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { LoaderComponent } from './LoaderComponent';
import { DependencyNode, Network, Service } from './types';
import { createNetworkFromServices, filterConnectedNodes } from '../utils/helpers/MappingHelpers';
import { EnvironmentSelect } from './EnvironmentSelect';
import { CheckboxProps, Radio } from 'semantic-ui-react';
import { Graph } from './Graph';
import { getServicesRequest, getEnvironmentsRequest } from '../api/api';
import 'semantic-ui-css/semantic.css';
import { css } from 'emotion';

export const DependencyGraph: React.FC = () => {
    const [nodes, setNodes] = useState<DependencyNode[]>([]);
    const [isPending, setIsPending] = useState<boolean>(true);
    const [services, setServices] = useState<Service[]>([]);
    const [env, setEnv] = useState<string>('');
    const [environments, setEnvironments] = useState<string[]>([]);
    const [areOnlyConnectedNodesShown, setAreOnlyConnectedNodesShown] = useState<boolean>(false);

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

    const handleViewSwitchChange = (e: React.FormEvent<HTMLInputElement>, data: CheckboxProps) =>
        setAreOnlyConnectedNodesShown(Boolean(data.checked));

    useEffect(() => {
        if (areOnlyConnectedNodesShown) {
            setNodes(onlyNodesWithContracts);
        } else {
            setNodes(graphNetwork.nodes);
        }
    }, [areOnlyConnectedNodesShown, onlyNodesWithContracts, graphNetwork]);

    return (
        <>
            <div className={optionsCls}>
                <h1 className={headerCls}>Judge-Dredd UI</h1>
                {process.env.NODE_ENV === 'development' && (
                    <Radio onChange={handleViewSwitchChange} toggle checked={areOnlyConnectedNodesShown} />
                )}
                <EnvironmentSelect disabled={isPending} options={environments} env={env} onEnvironmentChange={setEnv} />
            </div>
            {isPending && <LoaderComponent />}

            <Graph network={{ ...graphNetwork, nodes }} />
        </>
    );
};

const optionsCls = css({
    display: 'flex',
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    padding: '10px 10px 10px 30px',
    flexDirection: 'column',
    justifyContent: 'center',
});

const headerCls = css({
    margin: 0,
});
