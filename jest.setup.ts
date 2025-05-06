import 'whatwg-fetch';           // polyfill fetch()
import { server } from './src/mocks/server';
// Start MSW before all tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
