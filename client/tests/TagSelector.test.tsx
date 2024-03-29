import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react-native'
import config from '../config.json';
import { setupStore } from '../utils/store';
import { Provider } from 'react-redux';
import TagSelector from '../Components/TagSelector';

const BASE_URL = config.SERVER_URL;
export const handlers = [
    rest.get(`${BASE_URL}/tags`, (_req, res, ctx) => {
        return res(ctx.json(['tag 1', 'tag 2']), ctx.status(200));
    })
]

const server = setupServer(...handlers);

const TIMEOUT = 50000;
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close(), TIMEOUT);
test('renders component', async () => {
    const store = setupStore();
    render(
        <Provider store={store}>
            <TagSelector />
        </Provider>
    );
    await screen.findByTestId('received-tag', {}, { timeout: TIMEOUT });
    expect(screen.toJSON()).toMatchSnapshot()
}, TIMEOUT);
