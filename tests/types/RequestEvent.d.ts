// Define the RequestEvent type used in API endpoint tests

// Define the Cookies type to match SvelteKit's interface
interface Cookie {
  name: string;
  value: string;
}

interface CookieOptions {
  domain?: string;
  encode?: (value: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | 'lax' | 'none' | 'strict';
  secure?: boolean;
}

// Cookie parse options type for SvelteKit compatibility
interface CookieParseOptions {
  decode?: (value: string) => string;
}

interface Cookies {
  get: (name: string) => string | undefined;
  getAll: (opts?: CookieParseOptions) => { name: string; value: string }[];
  set: (name: string, value: string, options?: CookieOptions) => void;
  delete: (name: string, options?: CookieOptions) => void;
  serialize: (name: string, value: string, options?: CookieOptions) => string;
}

// Define Platform interface for SvelteKit compatibility
interface Platform {
  [key: string]: unknown;
}

// Define the RouteParams type that SvelteKit uses
type RouteParams = Record<string, string>;

// Define RequestEvent type with proper interfaces
export type RequestEvent<Params = RouteParams, RouteId extends string = string> = {
  request: Request;
  cookies: Cookies;
  fetch: typeof fetch;
  getClientAddress: () => string;
  locals: Record<string, unknown>;
  params: Params;
  platform: Readonly<Platform> | undefined;
  route: {
    id: RouteId;
  };
  setHeaders: (headers: Record<string, string>) => void;
  url: URL;
  isDataRequest: boolean;
  isSubRequest: boolean;
};
