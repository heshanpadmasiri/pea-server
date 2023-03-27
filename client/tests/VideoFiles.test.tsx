import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react-native'
import config from '../config.json';
import { setupStore } from '../utils/store';
import { Provider } from 'react-redux';
import VideoFiles from '../Components/VideoFiles/VideoFiles';

const BASE_URL = config.SERVER_URL;
const TIMEOUT = 50000;

export const handlers = [
    rest.get(`${BASE_URL}/tags`, (_req, res, ctx) => {
        return res(ctx.json(['tag 1', 'tag 2']), ctx.status(200));
    }),
    rest.get(`${BASE_URL}/files/mp4`, (_req, res, ctx) => {
        return res(ctx.json([
            {
                name: 'file 1.mp4',
                id: '1',
                ty: 'mp4',
                tags: []
            },
            {
                name: 'file 2.mp4',
                id: '2',
                ty: 'mp4',
                tags: ['tag 1']
            },
            {
                name: 'file 3.mp4',
                id: '3',
                ty: 'mp4',
                tags: ['tag 1', 'tag 2']
            },
        ]), ctx.status(200));
    }),
    rest.post(`${BASE_URL}/query`, async (req, res, ctx) => {
        const data = (await req.json())['data'];
        const ty: string = data['ty'] as string;
        const tags: string[] = data['tags'] as string[];
        if (tags.length == 1 && tags[0] == 'tag 1' && ty == 'mp4') {
            return res(ctx.json([
                {
                    name: 'file 2.mp4',
                    id: '2',
                    ty: 'mp4',
                    tags: ['tag 1']
                },
                {
                    name: 'file 3.mp4',
                    id: '3',
                    ty: 'mp4',
                    tags: ['tag 1', 'tag 2']
                },
            ]), ctx.status(200));
        }
        else {
            return res(ctx.json('unexpected request'), ctx.status(500));
        }
    })
]

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close(), TIMEOUT);

describe('VideoFiles', () => {

    test('renders component', async () => {
        const store = setupStore();
        render(
            <Provider store={store}>
                <VideoFiles />
            </Provider>
        );
        await screen.findByTestId('received-tag', {}, { timeout: TIMEOUT });
        await screen.findByTestId('received-files', {}, { timeout: TIMEOUT });
        expect(screen.toJSON()).toMatchSnapshot()
    }, TIMEOUT);

    test('tag selection works', async () => {
        const store = setupStore();
        render(
            <Provider store={store}>
                <VideoFiles />
            </Provider>
        );
        await screen.findByTestId('received-tag', {}, { timeout: TIMEOUT });
        const tag1_selector = await screen.findByTestId('switch-tag 1', {}, { timeout: TIMEOUT });
        fireEvent(tag1_selector, 'onValueChange', true);
        await screen.findByTestId('received-files', {}, { timeout: TIMEOUT });
        const file_1 = await screen.queryByText('file 1.txt');
        if (file_1 != null) {
            await waitForElementToBeRemoved(() => file_1, { timeout: TIMEOUT });
        }
        expect(screen.toJSON()).toMatchSnapshot()
    }, TIMEOUT);
});
