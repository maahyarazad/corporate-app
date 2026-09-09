// Which GET endpoints may be cached, for how long, and what invalidates them.
//
// Every GET is cached. The table exists to give each endpoint a sensible TTL
// and scope, not to decide whether it is cached at all - the catch-all at the
// bottom picks up anything not named above it, including endpoints added later.
//
// That default is only safe because of two things that landed first:
//
//   1. Keys carry an account id (makeCacheKey's `scopeId`), so two users on one
//      device cannot read each other's rows.
//   2. signout() clears api_cache outright, so a departing user leaves nothing.
//
// Without both, a cache-everything default would leak one account's data to the
// next person to sign in on the same device. The catch-all is therefore
// user-scoped: an unrecognised endpoint is assumed to be personal until someone
// declares otherwise, which fails safe rather than fast.
//
// See specs/011-api-get-cache/ for the full reasoning, and data-model.md E3 for
// the endpoints deliberately excluded and why.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * @typedef {Object} CachePolicy
 * @property {string}   id             stable prefix written into every key of
 *                                     this policy, so `clearCacheByPolicy` can
 *                                     evict them all at once
 * @property {string}   id             stable prefix written into every key of
 *                                     this policy, so clearCacheByPolicy can
 *                                     evict them all at once
 * @property {RegExp}   match          tested against the request url
 * @property {number}   ttlMs          how long a stored entry stays fresh
 * @property {"shared"|"user"} scope   "shared" = one row serves every account
 * @property {RegExp[]} invalidatedBy  mutation urls that evict this entry
 */

export const CACHE_POLICIES = [
  // Reference data. Changes rarely, identical for every account.
  {
    id: "partner-categories",
    match: /^\/v2\/partner\/category-available2\b/,
    ttlMs: 24 * HOUR,
    scope: "shared",
    invalidatedBy: [],
  },
  {
    id: "partner-tags",
    match: /^\/v2\/partner\/tags-available\b/,
    ttlMs: 24 * HOUR,
    scope: "shared",
    invalidatedBy: [],
  },
  {
    id: "forum-categories",
    match: /^\/v2\/post\/forum\/categories\b/,
    ttlMs: 24 * HOUR,
    scope: "shared",
    invalidatedBy: [/^\/v2\/post\/create\b/, /^\/v2\/post\/delete\b/],
  },
  {
    id: "marketplace-categories",
    match: /^\/v2\/post\/marketplace\/categories\b/,
    ttlMs: 24 * HOUR,
    scope: "shared",
    invalidatedBy: [/^\/v2\/post\/create\b/, /^\/v2\/post\/delete\b/],
  },

  // Partner content. Moves with merchandising rather than with the user.
  {
    id: "partner-top",
    match: /^\/v2\/partner\/top-per-category\b/,
    ttlMs: 1 * HOUR,
    scope: "shared",
    invalidatedBy: [],
  },
  // Partner detail: /v2/partner/{id}. Anchored on a numeric id so it cannot
  // swallow the named partner routes above.
  {
    id: "partner-detail",
    match: /^\/v2\/partner\/\d+(\?|$)/,
    ttlMs: 1 * HOUR,
    scope: "shared",
    invalidatedBy: [],
  },

  // User-scoped. Requires an account id in the key (see makeCacheKey) - the
  // request path skips the cache entirely when it cannot supply one, rather
  // than falling back to a shared row.
  //
  // /v2/auth/me is deliberately absent even though scoped keys would make it
  // safe from collision: it feeds the forced re-verification path, where an
  // hour-stale `expired` flag means an expired card still reads as valid.
  {
    id: "user-history",
    match: /^\/v2\/user\/history\b/,
    ttlMs: 15 * MINUTE,
    scope: "user",
    invalidatedBy: [/^\/v2\/offer\/redeem\b/],
  },

  // Promotional. Short TTL because it is curated and expected to move.
  {
    id: "offer-hotpicks",
    match: /^\/v2\/offer\/hotpicks\b/,
    ttlMs: 15 * MINUTE,
    scope: "shared",
    invalidatedBy: [],
  },
  {
    id: "post-magazine",
    match: /^\/v2\/post\/magazine\/latest\b/,
    ttlMs: 15 * MINUTE,
    scope: "shared",
    invalidatedBy: [],
  },

  // Feed and search. These paginate on a timestamp cursor generated at call
  // time, so most requests are a URL never seen before and will simply miss.
  // Caching them is close to a no-op on hit rate; it is safe now only because
  // the startup sweep and row ceiling in cacheDb.js bound the dead rows they
  // write. Short TTLs keep a feed from reading as frozen.
  {
    id: "post-feed",
    match: /^\/v2\/post\/(latest|old)\b/,
    ttlMs: 5 * MINUTE,
    scope: "shared",
    invalidatedBy: [/^\/v2\/post\/create\b/, /^\/v2\/post\/delete\b/],
  },
  {
    id: "post-search",
    match: /^\/v2\/post\/search\b/,
    ttlMs: 5 * MINUTE,
    scope: "shared",
    invalidatedBy: [],
  },
  {
    id: "post-comments",
    match: /^\/v2\/post\/comments\b/,
    ttlMs: 2 * MINUTE,
    scope: "shared",
    invalidatedBy: [/^\/v2\/post\/comment\b/],
  },
  // Post detail: /v2/post/{id}. Anchored on a numeric id so it cannot swallow
  // the named routes above.
  {
    id: "post-detail",
    match: /^\/v2\/post\/\d+(\?|$)/,
    ttlMs: 5 * MINUTE,
    scope: "shared",
    invalidatedBy: [/^\/v2\/post\/create\b/, /^\/v2\/post\/delete\b/],
  },

  // The caller's own profile. Scoped keys remove the cross-account risk, but
  // not the staleness risk: this response drives the forced re-verification
  // path at useRequest.js:62-83, where a stale `expired` flag means a card that
  // has expired still reads as valid. One minute bounds that window to
  // something a screen transition would not notice while still absorbing the
  // repeat calls a single navigation makes.
  {
    id: "auth-me",
    match: /^\/v2\/auth\/me\b/,
    ttlMs: 1 * MINUTE,
    scope: "user",
    invalidatedBy: [
      /^\/v2\/auth\//,
      /^\/v2\/user\//,
      /^\/v2\/profile\//,
    ],
  },

  // Outside the /v2 namespace, which is why an endpoint survey based on /v2/
  // missed it. Found by scripts/check-cache-coverage.js. A partner's title
  // keyed on partner_id: shared, and about as static as reference data gets.
  {
    id: "partner-title",
    match: /^\/partners\/partner-title\//,
    ttlMs: 24 * HOUR,
    scope: "shared",
    invalidatedBy: [],
  },

  // Catch-all. Anything not named above - including endpoints added after this
  // was written - is cached briefly and scoped to the account, because an
  // unrecognised response cannot be assumed to be shareable.
  {
    id: "default-get",
    match: /^\//,
    ttlMs: 5 * MINUTE,
    scope: "user",
    invalidatedBy: [],
  },
];

// Consumed by the startup sweep in cacheDb.js: nothing in the table can still
// be fresh beyond this age, so anything older is safe to drop unread.
export const LONGEST_TTL_MS = Math.max(
  ...CACHE_POLICIES.map((policy) => policy.ttlMs)
);

const isGet = (method) => typeof method === "string" && method.toLowerCase() === "get";

/**
 * The policy for a request, or null if it must not be cached.
 * Null is the default: only GETs, and only listed endpoints.
 */
export const policyFor = (url, method) => {
  if (!url || !isGet(method)) return null;

  return CACHE_POLICIES.find((policy) => policy.match.test(url)) ?? null;
};

/**
 * The policies a successful mutation dirties. Empty for GETs and for any
 * mutation no policy declares.
 */
export const invalidationsFor = (url, method) => {
  if (!url || !method || isGet(method)) return [];

  return CACHE_POLICIES.filter((policy) =>
    policy.invalidatedBy.some((pattern) => pattern.test(url))
  );
};
