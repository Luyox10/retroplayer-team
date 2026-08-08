import { config } from './config/environment.js';
import { checkDatabaseConnection } from './database/pool.js';
import { sendSuccess, sendNotFound } from './utils/response.js';
import { handleError } from './middleware/errorHandler.js';
import { parseJsonBody } from './middleware/parseJsonBody.js';
import { register, login, logout, me } from './modules/auth.js';
import { getProfile, updateProfile } from './modules/users.js';
import { search, getTrack, getRecommended } from './modules/explore.js';
import { search as youtubeSearch } from './modules/youtube/search.js';
import { getTrackVideo, createTrackVideo, updateTrackVideo, deleteTrackVideo } from './modules/track_videos.js';
import { getFavorites, addFavorite, removeFavorite } from './modules/favorites.js';
import { getHistory, addHistory, updateHistory } from './modules/history.js';
import {
  getFeaturedTracks,
  adminGetFeaturedTracks,
  adminCreateFeaturedTrack,
  adminUpdateFeaturedTrack,
  adminDeleteFeaturedTrack,
} from './modules/featured.js';
import {
  getEnvironments,
  getFreeEnvironments,
  getEnvironmentById,
  adminGetEnvironments,
  adminCreateEnvironment,
  adminUpdateEnvironment,
  adminDeleteEnvironment,
} from './modules/environments.js';
import {
  getRoomObjects,
  getRoomObjectById,
  adminGetRoomObjects,
  adminCreateRoomObject,
  adminUpdateRoomObject,
  adminDeleteRoomObject,
} from './modules/room_objects.js';
import {
  getProducts,
  getProductById,
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from './modules/products.js';
import {
  createOrder,
  getOrders,
  getOrderById,
  adminGetOrders,
  adminUpdateOrder,
  adminDeleteOrder,
} from './modules/orders.js';
import { getUserAssets } from './modules/user_assets.js';
import {
  adminGetDashboard,
  adminGetUsers,
  adminGetUserById,
  adminUpdateUserStatus,
} from './modules/admin.js';
import {
  createReport,
  adminGetReports,
  adminGetReportById,
  adminUpdateReport,
} from './modules/reports.js';

function getAllowedOrigins() {
  const origins = [config.FRONTEND_URL, config.ADMIN_PANEL_URL].filter(Boolean);
  if (config.NODE_ENV === 'development') {
    origins.push('http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173');
  }
  return origins;
}

function setCorsHeaders(res, origin, allowedOrigins) {
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
}

function logRequest(req) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
}

export async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;

  logRequest(req);
  setCorsHeaders(res, origin, allowedOrigins);

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      ...(origin && allowedOrigins.includes(origin)
        ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            Vary: 'Origin',
          }
        : {}),
      'Content-Type': 'application/json',
    });
    res.end();
    return;
  }

  try {
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      req.body = await parseJsonBody(req);
    }

    if (pathname === '/' && method === 'GET') {
      sendSuccess(res, 200, { message: 'RetroPlayer API' });
      return;
    }

    if (pathname === '/api/health' && method === 'GET') {
      sendSuccess(res, 200, { status: 'ok', service: 'retroplayer-api' });
      return;
    }

    if (pathname === '/api/health/database' && method === 'GET') {
      await checkDatabaseConnection();
      sendSuccess(res, 200, { status: 'ok', database: 'connected' });
      return;
    }

    if (pathname === '/api/auth/register' && method === 'POST') {
      await register(req, res);
      return;
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      await login(req, res);
      return;
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      await logout(req, res);
      return;
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      await me(req, res);
      return;
    }

    if (pathname === '/api/profile' && method === 'GET') {
      await getProfile(req, res);
      return;
    }

    if (pathname === '/api/profile' && method === 'PUT') {
      await updateProfile(req, res);
      return;
    }

    if (pathname === '/api/explore' && method === 'GET') {
      await search(req, res);
      return;
    }

    if (pathname.startsWith('/api/explore/tracks/') && method === 'GET') {
      await getTrack(req, res);
      return;
    }

    if (pathname === '/api/explore/recommended' && method === 'GET') {
      await getRecommended(req, res);
      return;
    }

    if (pathname === '/api/youtube/search' && method === 'GET') {
      await youtubeSearch(req, res);
      return;
    }

    const trackVideoMatch = pathname.match(/^\/api\/tracks\/([^\/]+)\/([^\/]+)\/video$/);
    if (trackVideoMatch && method === 'GET') {
      await getTrackVideo(req, res);
      return;
    }

    if (pathname === '/api/admin/track-videos' && method === 'POST') {
      await createTrackVideo(req, res);
      return;
    }

    const adminTrackVideoMatch = pathname.match(/^\/api\/admin\/track-videos\/([^\/]+)$/);
    if (adminTrackVideoMatch) {
      if (method === 'PUT') {
        await updateTrackVideo(req, res);
        return;
      }
      if (method === 'DELETE') {
        await deleteTrackVideo(req, res);
        return;
      }
    }

    if (pathname === '/api/favorites' && method === 'GET') {
      await getFavorites(req, res);
      return;
    }

    if (pathname === '/api/favorites' && method === 'POST') {
      await addFavorite(req, res);
      return;
    }

    const favoriteMatch = pathname.match(/^\/api\/favorites\/([^\/]+)\/([^\/]+)$/);
    if (favoriteMatch && method === 'DELETE') {
      await removeFavorite(req, res);
      return;
    }

    if (pathname === '/api/history' && method === 'GET') {
      await getHistory(req, res);
      return;
    }

    if (pathname === '/api/history' && method === 'POST') {
      await addHistory(req, res);
      return;
    }

    const historyMatch = pathname.match(/^\/api\/history\/([^\/]+)$/);
    if (historyMatch && method === 'PUT') {
      await updateHistory(req, res);
      return;
    }

    if (pathname === '/api/featured-tracks' && method === 'GET') {
      await getFeaturedTracks(req, res);
      return;
    }

    if (pathname === '/api/admin/featured-tracks' && method === 'GET') {
      await adminGetFeaturedTracks(req, res);
      return;
    }

    if (pathname === '/api/admin/featured-tracks' && method === 'POST') {
      await adminCreateFeaturedTrack(req, res);
      return;
    }

    const adminFeaturedMatch = pathname.match(/^\/api\/admin\/featured-tracks\/([^\/]+)$/);
    if (adminFeaturedMatch) {
      if (method === 'PUT') {
        await adminUpdateFeaturedTrack(req, res);
        return;
      }
      if (method === 'DELETE') {
        await adminDeleteFeaturedTrack(req, res);
        return;
      }
    }

    if (pathname === '/api/environments' && method === 'GET') {
      await getEnvironments(req, res);
      return;
    }

    if (pathname === '/api/environments/free' && method === 'GET') {
      await getFreeEnvironments(req, res);
      return;
    }

    const environmentMatch = pathname.match(/^\/api\/environments\/([^\/]+)$/);
    if (environmentMatch && method === 'GET' && environmentMatch[1] !== 'free') {
      await getEnvironmentById(req, res);
      return;
    }

    if (pathname === '/api/admin/environments' && method === 'GET') {
      await adminGetEnvironments(req, res);
      return;
    }

    if (pathname === '/api/admin/environments' && method === 'POST') {
      await adminCreateEnvironment(req, res);
      return;
    }

    const adminEnvironmentMatch = pathname.match(/^\/api\/admin\/environments\/([^\/]+)$/);
    if (adminEnvironmentMatch) {
      if (method === 'PUT') {
        await adminUpdateEnvironment(req, res);
        return;
      }
      if (method === 'DELETE') {
        await adminDeleteEnvironment(req, res);
        return;
      }
    }

    if (pathname === '/api/room-objects' && method === 'GET') {
      await getRoomObjects(req, res);
      return;
    }

    const roomObjectMatch = pathname.match(/^\/api\/room-objects\/([^\/]+)$/);
    if (roomObjectMatch && method === 'GET') {
      await getRoomObjectById(req, res);
      return;
    }

    if (pathname === '/api/admin/room-objects' && method === 'GET') {
      await adminGetRoomObjects(req, res);
      return;
    }

    if (pathname === '/api/admin/room-objects' && method === 'POST') {
      await adminCreateRoomObject(req, res);
      return;
    }

    const adminRoomObjectMatch = pathname.match(/^\/api\/admin\/room-objects\/([^\/]+)$/);
    if (adminRoomObjectMatch) {
      if (method === 'PUT') {
        await adminUpdateRoomObject(req, res);
        return;
      }
      if (method === 'DELETE') {
        await adminDeleteRoomObject(req, res);
        return;
      }
    }

    if (pathname === '/api/products' && method === 'GET') {
      await getProducts(req, res);
      return;
    }

    const productMatch = pathname.match(/^\/api\/products\/([^\/]+)$/);
    if (productMatch && method === 'GET') {
      await getProductById(req, res);
      return;
    }

    if (pathname === '/api/admin/products' && method === 'GET') {
      await adminGetProducts(req, res);
      return;
    }

    if (pathname === '/api/admin/products' && method === 'POST') {
      await adminCreateProduct(req, res);
      return;
    }

    const adminProductMatch = pathname.match(/^\/api\/admin\/products\/([^\/]+)$/);
    if (adminProductMatch) {
      if (method === 'PUT') {
        await adminUpdateProduct(req, res);
        return;
      }
      if (method === 'DELETE') {
        await adminDeleteProduct(req, res);
        return;
      }
    }

    if (pathname === '/api/orders' && method === 'POST') {
      await createOrder(req, res);
      return;
    }

    if (pathname === '/api/orders' && method === 'GET') {
      await getOrders(req, res);
      return;
    }

    const orderMatch = pathname.match(/^\/api\/orders\/([^\/]+)$/);
    if (orderMatch && method === 'GET') {
      await getOrderById(req, res);
      return;
    }

    if (pathname === '/api/admin/orders' && method === 'GET') {
      await adminGetOrders(req, res);
      return;
    }

    const adminOrderMatch = pathname.match(/^\/api\/admin\/orders\/([^\/]+)$/);
    if (adminOrderMatch) {
      if (method === 'PUT') {
        await adminUpdateOrder(req, res);
        return;
      }
      if (method === 'DELETE') {
        await adminDeleteOrder(req, res);
        return;
      }
    }

    if (pathname === '/api/user/assets' && method === 'GET') {
      await getUserAssets(req, res);
      return;
    }

    if (pathname === '/api/reports' && method === 'POST') {
      await createReport(req, res);
      return;
    }

    if (pathname === '/api/admin/dashboard' && method === 'GET') {
      await adminGetDashboard(req, res);
      return;
    }

    if (pathname === '/api/admin/users' && method === 'GET') {
      await adminGetUsers(req, res);
      return;
    }

    const adminUserMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)$/);
    if (adminUserMatch) {
      if (method === 'GET') {
        await adminGetUserById(req, res);
        return;
      }
      if (method === 'PUT') {
        await adminUpdateUserStatus(req, res);
        return;
      }
    }

    if (pathname === '/api/admin/reports' && method === 'GET') {
      await adminGetReports(req, res);
      return;
    }

    const adminReportMatch = pathname.match(/^\/api\/admin\/reports\/([^\/]+)$/);
    if (adminReportMatch) {
      if (method === 'GET') {
        await adminGetReportById(req, res);
        return;
      }
      if (method === 'PUT') {
        await adminUpdateReport(req, res);
        return;
      }
    }

    sendNotFound(res, `Resource not found: ${method} ${pathname}`, 'NOT_FOUND');
  } catch (err) {
    console.error('Request error:', err.message);
    handleError(res, err);
  }
}
