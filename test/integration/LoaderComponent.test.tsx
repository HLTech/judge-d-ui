import * as React from 'react';
import { render } from '@testing-library/react';
import { LoaderComponent } from '../../src/components/LoaderComponent';

describe('LoaderComponent', () => {
    it('should render without error', () => {
        const { container } = render(<LoaderComponent />);
        expect(container.firstChild).toMatchSnapshot();
    });
});
