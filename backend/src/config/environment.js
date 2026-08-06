const requiredString = (name) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const toBoolean = (value) => value?.toString().toLowerCase() === 'true';

if (process.env.NODE_ENV !== 'production') {
  try {
    await import('dotenv/config');
  } catch (err) {
    if (err?.code !== 'ERR_MODULE_NOT_FOUND') {
      throw err;
    }
  }
}

const rawPort = process.env.APP_PORT || '3000';
const port = Number(rawPort);
if (Number.isNaN(port) || port < 0 || port > 65535) {
  throw new Error(`Invalid APP_PORT value: ${rawPort}`);
}

const rawDbPort = process.env.DB_PORT || '4000';
const dbPort = Number(rawDbPort);
if (Number.isNaN(dbPort) || dbPort <= 0 || dbPort > 65535) {
  throw new Error(`Invalid DB_PORT value: ${rawDbPort}`);
}

export const config = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: port,
  DB_HOST: requiredString('DB_HOST'),
  DB_PORT: dbPort,
  DB_USER: requiredString('DB_USER'),
  DB_PASSWORD: requiredString('DB_PASSWORD'),
  DB_NAME: requiredString('DB_NAME'),
  DB_SSL: toBoolean(process.env.DB_SSL),
  FRONTEND_URL: process.env.FRONTEND_URL || '',
  ADMIN_PANEL_URL: process.env.ADMIN_PANEL_URL || '',
  JAMENDO_CLIENT_ID: requiredString('JAMENDO_CLIENT_ID'),
  JAMENDO_API_URL: process.env.JAMENDO_API_URL || 'https://api.jamendo.com/v3.0',
  YOUTUBE_API_KEY: requiredString('YOUTUBE_API_KEY'),
  YOUTUBE_API_URL: process.env.YOUTUBE_API_URL || 'https://www.googleapis.com/youtube/v3',
});
