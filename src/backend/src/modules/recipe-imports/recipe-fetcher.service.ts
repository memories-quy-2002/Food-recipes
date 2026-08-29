import { BadRequestException, GatewayTimeoutException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { isIP } from 'node:net';

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 5000;

const isPrivateAddress = (address: string): boolean => {
  address = address.replace(/^\[|\]$/g, '');
  if (isIP(address) === 4) {
    const octets = address.split('.').map(Number);
    return octets[0] === 10 || octets[0] === 127 || (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168);
  }
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb');
  }
  return false;
};

const assertHttpUrl = (rawUrl: string): URL => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestException({ code: 'RECIPE_IMPORT_URL_INVALID', message: 'Enter a valid recipe URL' });
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new BadRequestException({ code: 'RECIPE_IMPORT_URL_INVALID', message: 'Only public http(s) recipe URLs are supported' });
  }
  return url;
};

@Injectable()
export class RecipeFetcherService {
  private async assertPublicHost(url: URL) {
    if (url.hostname.toLowerCase() === 'localhost' || isPrivateAddress(url.hostname)) {
      throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_PRIVATE_HOST', message: 'Private and loopback addresses are not allowed' });
    }
    const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
      throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_PRIVATE_HOST', message: 'The recipe host must resolve to a public address' });
    }
  }

  async fetchHtml(rawUrl: string): Promise<{ url: string; html: string }> {
    let url = assertHttpUrl(rawUrl);
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      await this.assertPublicHost(url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { Accept: 'text/html,application/xhtml+xml' } });
      } catch (error) {
        if (controller.signal.aborted) throw new GatewayTimeoutException({ code: 'RECIPE_IMPORT_TIMEOUT', message: 'The recipe page took too long to respond' });
        throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_FETCH_FAILED', message: 'The recipe page could not be fetched' });
      } finally {
        clearTimeout(timeout);
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location || redirect === MAX_REDIRECTS) throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_REDIRECT_INVALID', message: 'The recipe page redirected too many times' });
        url = assertHttpUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_FETCH_FAILED', message: 'The recipe page could not be fetched' });
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      if (!contentType.includes('text/html')) throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_CONTENT_TYPE_INVALID', message: 'The URL did not return an HTML recipe page' });
      const html = await this.readBody(response);
      return { url: url.toString(), html };
    }
    throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_REDIRECT_INVALID', message: 'The recipe page redirected too many times' });
  }

  private async readBody(response: Response): Promise<string> {
    if (!response.body) {
      const html = await response.text();
      if (Buffer.byteLength(html, 'utf8') > MAX_RESPONSE_BYTES) throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_RESPONSE_TOO_LARGE', message: 'The recipe page is too large to import' });
      return html;
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_RESPONSE_TOO_LARGE', message: 'The recipe page is too large to import' });
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder().decode(result);
  }
}

export { assertHttpUrl, isPrivateAddress };
