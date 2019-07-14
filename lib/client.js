import qs from "qs";
import _ from "lodash";
import { trim } from "./util";

// const BASE_URL= {
//     development: '',
//     production: 'http://api.01snail.com'
// };

const GET = "GET";
const POST = "POST";
const PUT = "PUT";
const DELETE = "DELETE";

export const Constants = {
  GET,
  POST,
  PUT,
  DELETE
};

export class ServerError {
  errorName() {
    return "ServerError";
  }

  constructor(error_code, message, json) {
    this.error_code = error_code;
    this.message = message;
    this.json = json;
  }
}

class HttpError {
  errorName() {
    return "HttpError";
  }

  constructor(status_code, message = "网络错误") {
    this.status_code = status_code;
    this.message = message;
  }
}

class AuthorizedError {
  errorName() {
    return "AuthorizeError";
  }

  constructor(status_code, message = "未登录或登录已过期") {
    this.status_code = status_code;
    this.message = message;
  }
}

class Call {
  constructor(client, method, path) {
    this.client = client;
    this.method = method;
    this.path = path;
    this.headers = client.headers;
    this.secure = false;
    this.is_multipart = false;
    this.raise_server_error = false;
    this.raise_http_error = false;
    this.ignore_result = false;
    this.bodyContent = null;
    this.contentTypeStr = null;
    this.credentials = true;
  }

  without_credentials() {
    this.credentials = false;
    return this;
  }

  with_param(p = {}) {
    console.log("with_param");
    console.log(p);
    this.params = p;
    return this;
  }

  multipart() {
    this.is_multipart = true;
    return this;
  }

  body(content) {
    this.bodyContent = content;
    return this;
  }

  contentType(type) {
    this.contentTypeStr = type;
    return this;
  }

  get_body() {
    if (this.bodyContent != null) {
      return this.bodyContent;
    }
    if (GET === this.method) {
      return null;
    }
    if (!this.is_multipart) {
      return buildQueryString(this.params);
    } else {
      return multipartBody(this.params);
    }
  }

  real_path() {
    if (GET === this.method && this.params) {
      const query_str = buildQueryString(this.params);
      let url = `${this.client.baseUrl()}${this.path}`;
      if (query_str.length > 0) {
        url = url + "?" + query_str;
      }
      return url;
    }
    return this.client.baseUrl() + this.path;
  }

  should_raise_server_error() {
    this.raise_server_error = true;
    return this;
  }

  should_raise_http_error() {
    this.raise_http_error = true;
    return this;
  }

  should_ignore_result() {
    this.ignore_result = true;
  }

  checkStatus(response) {
    console.log(`check status: ${response.status}`);
    return new Promise((resolve, reject) => {
      if (response.status >= 200 && response.status < 300) {
        resolve(response);
      } else {
        const error = new AuthorizedError(response.status);
        if (response.status === 498) {
          this.client.onUnAuthorizedError(error.message);
        } else {
          response
            .json()
            .then(res => {
              const error = new HttpError(response.status, res.message);
              error.response = response;
              reject(error);
            })
            .catch(e => {
              const error = new HttpError(response.status);
              error.response = response;
              error.e = e;
              reject(error);
            });
        }
      }
    });
  }

  build_headers() {
    console.log("Client: headers = ");
    console.log(this.headers);
    const headers = Object.assign({}, this.getContentType(), this.headers);

    return headers;
  }

  getContentType() {
    if (this.contentTypeStr !== null) {
      return { "Content-Type": this.contentTypeStr };
    }

    if (this.is_multipart) {
      return {};
    }

    if (GET !== this.method) {
      // return { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF8'};
      return {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
      };
    }

    return {};
  }

  execute() {
    // const url = build_url(this.real_path(), this.secure);
    const url = this.real_path();
    console.log(`${this.method} ${url}`);
    return new Promise((resolve, reject) => {
      const request = {
        method: this.method,
        body: this.get_body(),
        credentials: "include",
        headers: this.build_headers()
      };
      if (!this.credentials) {
        request.credentials = "omit";
        console.log(this.headers);
        if (this.headers && this.headers["X-Authorization"]) {
          const {
            "X-Authorization": XAuthorization,
            ...headers
          } = this.headers;
          request.headers = headers;
        }
      }
      console.log(request);
      fetch(url, request)
        .then(resp => this.checkStatus(resp))
        .then(resp => resp.json())
        .then(json => {
          try {
            resolve(this.client.onResponse(json));
          } catch (err) {
            if (this.raise_server_error) {
              reject(err);
            } else {
              this.client.onServerError(err);
            }
          }
        })
        .catch(err => {
          console.log(`caught ${err}`);
          if (this.raise_http_error) {
            console.log(`reject {$err}.`);
            reject(err);
          } else {
            // alert('网络错误，请检查网络设置和状态，或稍后再试。');
            console.log("catch err: ", { err });
            let errMsg = this.path + "\n";
            if (err.message) {
              errMsg = errMsg + err.message + "\n";
            } else {
              errMsg = errMsg + err.toString() + "\n";
            }
            if (err.stack && "string" === typeof err.stack) {
              const length = Math.min(err.stack.length, 100);
              errMsg += err.stack.substr(0, length);
            }
            this.client.onNetworkError(errMsg);
          }
        });
    });
  }
}

export class Client {
  init(host, options = {}) {
    this.host = host;
    const { pathPrefix, headers, ...handlers } = options;
    this.pathPrefix = pathPrefix || "";
    this.headers = headers;
    this.handlers = handlers;
    return init;
  }

  setHeaders(headers) {
    console.log("set headers: ", headers);
    this.headers = headers;
  }

  get(path) {
    return new Call(this, GET, path);
  }

  post(path) {
    return new Call(this, POST, path);
  }

  put(path) {
    return new Call(this, PUT, path);
  }

  delete(path) {
    return new Call(this, DELETE, path);
  }

  request(method, path) {
    return new Call(this, method, path);
  }

  baseUrl() {
    return `${this.host}${this.pathPrefix}`;
  }

  onResponse(resp) {
    if (this.handlers.onResponse) {
      return this.handlers.onResponse(resp);
    } else {
      const { success, error_code, message, ...otherData } = resp;
      console.log(`error_code = ${error_code}`);
      if (success) {
        return otherData;
      } else {
        throw new ServerError(error_code, message);
      }
    }
  }

  onServerError(err) {
    if (this.handlers.onServerError) {
      this.handlers.onServerError(err);
    } else {
      this.defaultOnServerError();
    }
  }

  defaultOnServerError() {}

  onUnAuthorizedError(err) {
    if (this.handlers.onUnAuthorizedError) {
      this.handlers.onUnAuthorizedError(err);
    } else {
      this.defaultOnUnAuthorizedError();
    }
  }

  defaultOnUnAuthorizedError() {}

  onNetworkError(err) {
    if (this.handlers.onNetworkError) {
      this.handlers.onNetworkError(err);
    } else {
      this.defaultOnUnNetworkError();
    }
  }

  defaultOnUnNetworkError() {}
}

function multipartBody(params) {
  if (null == params) return null;

  let result = new FormData();
  var new_data = trim(params);
  for (let key in new_data) {
    const value = params[key];
    if (undefined !== value && null !== value) {
      if (_.isArray(value)) {
        parse_array_param(value, key, result);
      } else if (typeof value === "object" && !value instanceof File) {
        // not file object
        parse_object(value, key, result);
      } else {
        result.append(key, value);
      }
    }
  }
  return result;
}

function parse_object(obj, prefix, result) {
  for (let key in obj) {
    const value = obj[key];
    result.append(`${prefix}[${key}]`, value);
  }
}

function parse_array_param(array, prefix, result) {
  array.forEach(item => result.append(prefix, item));
}

export var defaultClient = new Client();

export function init(host, options = {}) {
  defaultClient.init(host, options);
}

function buildQueryString(params) {
  return qs.stringify(params, { arrayFormat: "repeat" });
}
