import { AppError } from '../utils/errors.js';

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

export function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') {
      return resolve(null);
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return resolve(null);
    }

    let body = '';
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new AppError('Request body too large', 413, 'PAYLOAD_TOO_LARGE'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (!body) {
        return resolve(null);
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new AppError('Invalid JSON body', 400, 'INVALID_JSON'));
      }
    });

    req.on('error', (err) => {
      reject(new AppError('Error reading request body', 400, 'BODY_READ_ERROR'));
    });
  });
}
