import * as React from 'react';
import { Loader } from 'semantic-ui-react';
import { css } from 'emotion';

export const LoaderComponent: React.FC = () => {
    return (
        <div className={loaderCls} data-test="loader">
            <Loader active inline="centered" size="large" />
        </div>
    );
};

const loaderCls = css({
    label: 'loader',
    position: 'fixed',
    top: 75,
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    overflow: 'hidden',
});
