export type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit]>;

export function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  } as Response;
}

export function mockFetch(): FetchMock {
  const fetchMock: FetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function requestOf(fetchMock: FetchMock, call: number) {
  const [url, init] = fetchMock.mock.calls[call];
  const headers = init.headers as Record<string, string>;
  return { url, method: init.method, authorization: headers.Authorization, body: JSON.parse(init.body as string) };
}

export const tokens = (suffix: string) => ({
  access_token: `access-${suffix}`,
  refresh_token: `refresh-${suffix}`,
  token_type: "bearer",
  expires_in: 1800,
});
