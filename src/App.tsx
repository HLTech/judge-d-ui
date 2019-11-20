import React from 'react';
import { DependencyGraph } from './components/DependencyGraph';
import { injectGlobal } from 'emotion';

injectGlobal`
* {
    font-family: 'LiberationSansBold';
}
`;

export const App = () => <DependencyGraph />;
