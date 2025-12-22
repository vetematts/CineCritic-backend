import { EventEmitter } from 'events';

export function createRequest({ method = 'GET', url = '/', query = {} } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.query = query;
  req.params = {};
  req.headers = {};
  req.ip = '127.0.0.1';
  req.socket = { remoteAddress: '127.0.0.1' };
  req.connection = { remoteAddress: '127.0.0.1' };
  req.get = (name) => req.headers[name.toLowerCase()];
  return req;
}

export function createResponse() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.body = undefined;

  res.setHeader = (name, value) => {
    res.headers[name.toLowerCase()] = value;
  };

  res.getHeader = (name) => res.headers[name.toLowerCase()];
  res.getHeaders = () => res.headers;
  res.removeHeader = (name) => {
    delete res.headers[name.toLowerCase()];
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data) => {
    res.body = data;
    res.emit('end');
    return res;
  };

  res.send = res.json;

  res.end = (data) => {
    if (data !== undefined) {
      res.body = data;
    }
    res.emit('end');
    return res;
  };

  res._getStatusCode = () => res.statusCode;
  res._getJSONData = () => res.body;

  return res;
}
