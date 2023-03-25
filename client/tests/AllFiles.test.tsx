import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react-native'
import config from '../config.json';
import { setupStore } from '../utils/store';
import { Provider } from 'react-redux';
import TagSelector from '../Components/TagSelector';
import AllFiles from '../Components/AllFiles';

const BASE_URL = config.SERVER_URL;
const TIMEOUT = 50000;

export const handlers = [
    rest.get(`${BASE_URL}/tags`, (_req, res, ctx) => {
        return res(ctx.json(['tag 1', 'tag 2']), ctx.status(200));
    }),
    rest.get(`${BASE_URL}/files`, (_req, res, ctx) => {
        return res(ctx.json([
            {
                name: 'file 1.txt',
                id: '1',
                ty: 'txt',
                tags: []
            },
            {
                name: 'file 2.txt',
                id: '2',
                ty: 'txt',
                tags: ['tag 1']
            },
            {
                name: 'file 3.txt',
                id: '3',
                ty: 'txt',
                tags: ['tag 1', 'tag 2']
            },
        ]), ctx.status(200));
    })
]

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close(), TIMEOUT);
test('renders component', async () => {
    const store = setupStore();
    render(
        <Provider store={store}>
            <AllFiles />
        </Provider>
    );
    await screen.findByTestId('received-tag', {}, { timeout: TIMEOUT });
    await screen.findByTestId('received-files', {}, { timeout: TIMEOUT });
    expect(screen.toJSON()).toMatchSnapshot()
}, TIMEOUT);
