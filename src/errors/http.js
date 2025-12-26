export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', code = 'bad_request') {
    super(400, message, code);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', code = 'unauthorized') {
    super(401, message, code);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', code = 'forbidden') {
    super(403, message, code);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', code = 'not_found') {
    super(404, message, code);
  }
}
