import { personalInfo, heartrate } from './oura';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('personalInfo', () => {
  it('calls correct URL with Bearer token', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await personalInfo('test-token-123');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/usercollection/personal_info'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token-123' },
      })
    );
  });
});

describe('heartrate', () => {
  it('calls URL with start_datetime and end_datetime query params', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) });
    await heartrate('token', '2025-02-01T00:00:00Z', '2025-02-02T23:59:59Z');
    const callUrl = global.fetch.mock.calls[0][0];
    expect(callUrl).toContain('start_datetime=2025-02-01T00%3A00%3A00Z');
    expect(callUrl).toContain('end_datetime=2025-02-02T23%3A59%3A59Z');
  });
});
