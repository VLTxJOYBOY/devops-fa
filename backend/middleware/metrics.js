'use strict';

const client = require('prom-client');

// ─── Registry ────────────────────────────────────────────────────────────────
// Use the default global registry so prom-client's collectDefaultMetrics()
// shares the same registry as our custom metrics.
const register = client.register;

// ─── Default Node.js / Process Metrics ───────────────────────────────────────
// Collects: heap, RSS, event-loop lag, CPU, GC, active handles, etc.
client.collectDefaultMetrics({ register });

// ─── Custom Metrics ───────────────────────────────────────────────────────────

/**
 * http_requests_total
 * Counter — total number of HTTP requests received.
 * Labels are low-cardinality: method, route, status_code.
 */
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

/**
 * http_request_duration_seconds
 * Histogram — duration of each HTTP request in seconds.
 * Buckets cover typical API latency ranges: 5ms to 10s.
 */
const httpRequestDurationSeconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
});

/**
 * http_active_requests
 * Gauge — number of requests currently being processed.
 */
const httpActiveRequests = new client.Gauge({
    name: 'http_active_requests',
    help: 'Number of HTTP requests currently being processed',
    registers: [register],
});

// ─── Route Normalisation ──────────────────────────────────────────────────────
/**
 * Converts a matched Express route pattern to a safe label value.
 * Falls back to a sanitised pathname when no route is matched yet.
 *
 * Examples:
 *   req.route.path = '/:id/status'  → used as-is (low-cardinality)
 *   req.baseUrl     = '/api/issues'
 *   → combined: '/api/issues/:id/status'
 *
 * Raw query strings, JWT tokens and actual ObjectId values are never included.
 */
function normaliseRoute(req) {
    let routePath = '';
    if (req.route) {
        // Express has matched a route — use the parameterised pattern
        routePath = (req.baseUrl || '') + req.route.path;
    } else {
        // Fallback for unmatched routes (e.g. 404s) — use raw pathname
        const url = req.url || '/';
        routePath = url.split('?')[0];
    }
    // Remove trailing slash if length > 1 (e.g. '/api/issues/' -> '/api/issues')
    if (routePath.length > 1 && routePath.endsWith('/')) {
        routePath = routePath.slice(0, -1);
    }
    return routePath;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
/**
 * Express middleware that records HTTP metrics for every request.
 *
 * Excluded from self-counting:
 *   GET /metrics  — prevents a Prometheus scrape feedback loop.
 *
 * Metric recording happens on the 'finish' event so we capture the
 * final HTTP status code (after res.status() / res.json() etc.).
 */
function metricsMiddleware(req, res, next) {
    // Skip the /metrics endpoint itself to avoid a self-referential loop.
    if (req.path === '/metrics') {
        return next();
    }

    httpActiveRequests.inc();
    const end = httpRequestDurationSeconds.startTimer();

    res.on('finish', () => {
        const route = normaliseRoute(req);
        const labels = {
            method: req.method,
            route,
            status_code: String(res.statusCode),
        };

        httpRequestsTotal.inc(labels);
        end(labels);
        httpActiveRequests.dec();
    });

    next();
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
    metricsMiddleware,
    register,
    // Expose individual metrics for testing
    httpRequestsTotal,
    httpRequestDurationSeconds,
    httpActiveRequests,
};
