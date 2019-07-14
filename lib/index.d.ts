/// <reference types="typescript" />

export interface ServerErrorHandler {
  (err: any): void;
}

export interface NetworkErrorHandler {
  (errorMessage: string, err?: any): void;
}

export interface TokenExpiredHandler {
  (errorMessage: string): void;
}

export interface InitOption {
  pathPrefix: string;
  headers?: object;
  onNetworkError?: NetworkErrorHandler;
  onServerError?: ServerErrorHandler;
  onUnAuthorizedError?: TokenExpiredHandler;
}

export function init(host: string, options?: InitOption): void;

export interface Client {
  init: (host: string, options?: InitOption) => void;
  setHeaders: (header: object) => void;
  get: (path: String) => Client;
  post: (path: String) => Client;
  delete: (path: String) => Client;
  put: (path: String) => Client;
  request: (method: string, path: String) => Client;
  with_param: (params: object) => Client;
  multipart: () => Client;
  body: (content: any) => Client;
  without_credentials: () => Client;
  should_raise_server_error: () => Client;
  should_raise_http_error: () => Client;
  execute: () => Promise<any>;
}

export const client: Client;
