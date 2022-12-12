export class SocketTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SocketTimeoutError';
    if (Error.hasOwnProperty('captureStackTrace'))
      // Just in V8.
      Error.captureStackTrace(this, SocketTimeoutError);
    else this.stack = new Error(message).stack;
  }
}

export function timeoutCallback(callback) {
  let called = false;

  const interval = setTimeout(
    () => {
      if (called) return;
      called = true;
      callback(new SocketTimeoutError('Request timed out'));
    },
    // default timeout 20s
    20000
  );

  return (...args) => {
    if (called) return;
    called = true;
    clearTimeout(interval);

    callback(...args);
  };
}
