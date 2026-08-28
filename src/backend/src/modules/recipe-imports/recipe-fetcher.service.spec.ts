import { UnprocessableEntityException } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { RecipeFetcherService } from './recipe-fetcher.service';

describe('RecipeFetcherService', () => {
  const fetcher = new RecipeFetcherService();
  const originalFetch = global.fetch;
  let lookup: jest.SpiedFunction<typeof dns.lookup>;

  beforeEach(() => {
    lookup = jest.spyOn(dns, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }), text: async () => '<html />', body: null }) as never;
  });
  afterEach(() => { lookup.mockRestore(); global.fetch = originalFetch; });

  it.each(['http://127.0.0.1/recipe', 'http://localhost/recipe', 'http://10.0.0.5/recipe', 'http://172.16.2.4/recipe', 'http://192.168.1.4/recipe', 'http://169.254.1.1/recipe', 'http://[::1]/recipe'])('rejects private URL %s', async (url) => {
    await expect(fetcher.fetchHtml(url)).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('revalidates redirects before fetching the target', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 302, headers: new Headers({ location: 'http://127.0.0.1/private', 'content-type': 'text/html' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'text/html' }), text: async () => '<html />', body: null });
    await expect(fetcher.fetchHtml('https://example.com/recipe')).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects non-HTML and oversized responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/pdf' }), text: async () => 'pdf', body: null });
    await expect(fetcher.fetchHtml('https://example.com/recipe')).rejects.toMatchObject({ response: { code: 'RECIPE_IMPORT_CONTENT_TYPE_INVALID' } });
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'text/html' }), text: async () => 'x'.repeat(2 * 1024 * 1024 + 1), body: null });
    await expect(fetcher.fetchHtml('https://example.com/recipe')).rejects.toMatchObject({ response: { code: 'RECIPE_IMPORT_RESPONSE_TOO_LARGE' } });
  });
});
