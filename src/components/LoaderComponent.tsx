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
    height: '80vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
});
