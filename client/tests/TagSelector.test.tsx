// import { fetch } from 'cross-fetch';
// const { Headers, Request, Response } = fetch;

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react-native'
import config from '../config.json';
import { setupStore } from '../utils/store';
import { Provider } from 'react-redux';
import TagSelector from '../Components/TagSelector';

// No idea why I need these but some how even after giving a fetchFn I am getting errors without these
// global.Headers = Headers;
// global.Request = Request;
// global.Response = Response;

const BASE_URL = config.SERVER_URL;
export const handlers = [
    rest.get(`${BASE_URL}/tags`, (_req, res, ctx) => {
        return res(ctx.json(['tag 1', 'tag 2']), ctx.status(200));
    })
]

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
test('renders component', async () => {
    const store = setupStore();
    render(
        <Provider store={store}>
            <TagSelector />
        </Provider>
    );
    // This line is not working in github and due to some reason hanging in both local and github why?
    await screen.findByTestId('recieved-tag');
    // delay(1000); 
    expect(screen.toJSON()).toMatchSnapshot()
});
