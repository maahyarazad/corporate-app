import {
  CACHE_POLICIES,
  invalidationsFor,
  LONGEST_TTL_MS,
  policyFor,
} from "../cachePolicy";

// The allowlist is the security boundary of this feature: an endpoint that ends
// up in it by accident is a stale read at best and a cross-account leak at
// worst. These tests assert the boundary, not the plumbing.

describe("policyFor - method gate", () => {
  it("returns null for every non-GET method, even on a named path", () => {
    const allowlisted = "/v2/partner/tags-available?app_id=1&lang=en";

    expect(policyFor(allowlisted, "get")).not.toBeNull();
    for (const method of ["post", "put", "delete", "patch"]) {
      expect(policyFor(allowlisted, method)).toBeNull();
    }
  });

  it("matches each allowlisted endpoint", () => {
    const urls = [
      "/v2/partner/category-available2?app_id=1&lang=en",
      "/v2/partner/tags-available?app_id=1&lang=en",
      "/v2/partner/top-per-category?app_id=1&lang=en&count=5",
      "/v2/offer/hotpicks?app_id=1&lang=en&limit=10",
      "/v2/partner/1592?app=1&lang=en",
      "/v2/post/forum/categories",
      "/v2/post/marketplace/categories",
      "/v2/post/magazine/latest?limit=10",
    ];

    for (const url of urls) {
      expect(policyFor(url, "get")).not.toBeNull();
    }
  });
});

describe("policyFor - every GET is covered", () => {
  // The rule is now cache-everything, so the catch-all has to actually catch.
  // A GET that fell through would be a silent hole in the policy.
  it("returns a policy for every GET endpoint the app calls", () => {
    const urls = [
      "/v2/auth/me",
      "/v2/user/history?lang=en",
      "/v2/offer/hotpicks?app_id=1&lang=en&limit=10",
      "/v2/partner/category-available2?app_id=1&lang=en",
      "/v2/partner/tags-available?app_id=1&lang=en",
      "/v2/partner/top-per-category?app_id=1&lang=en&count=5",
      "/v2/partner/1592?app=1&lang=en",
      "/v2/post/comments?id=5&prev=2&mode=1",
      "/v2/post/forum/categories",
      "/v2/post/latest?page=2",
      "/v2/post/latest/more?limit=10&status=1&last_post=2026-09-08T10:00:00Z",
      "/v2/post/magazine/latest?limit=10",
      "/v2/post/marketplace/categories",
      "/v2/post/old?last=2026-09-08T10:00:00Z&limit=10&status=1",
      "/v2/post/search?keyword=x",
      "/v2/post/8123",
      "/partners/partner-title/42",
    ];

    for (const url of urls) {
      expect(policyFor(url, "get")).not.toBeNull();
    }
  });

  // Outside the /v2 namespace; a survey based on /v2/ missed it entirely and
  // scripts/check-cache-coverage.js is what surfaced it.
  it("covers the non-/v2 partner-title endpoint by name, not the catch-all", () => {
    expect(policyFor("/partners/partner-title/42", "get").id).toBe(
      "partner-title"
    );
  });

  it("catches an endpoint nobody has written a policy for", () => {
    const policy = policyFor("/v2/some/endpoint/invented/later", "get");

    expect(policy).not.toBeNull();
    // Unrecognised responses are assumed personal until declared otherwise.
    expect(policy.scope).toBe("user");
  });

  // Ordering matters: `find` takes the first match, so a named policy must win
  // over the catch-all or every TTL collapses to the default.
  it("prefers a named policy over the catch-all", () => {
    expect(policyFor("/v2/partner/tags-available", "get").id).toBe(
      "partner-tags"
    );
    expect(policyFor("/v2/auth/me", "get").id).toBe("auth-me");
  });

  // The numeric-id policies must not swallow their sibling named routes.
  it("does not let the id policies shadow the named routes", () => {
    expect(policyFor("/v2/post/latest?page=1", "get").id).toBe("post-feed");
    expect(policyFor("/v2/post/8123", "get").id).toBe("post-detail");
    expect(policyFor("/v2/partner/tags-available", "get").id).toBe(
      "partner-tags"
    );
    expect(policyFor("/v2/partner/1592", "get").id).toBe("partner-detail");
  });

  // The one thing widening must not change: caching is still GET-only.
  it("still refuses every non-GET, catch-all included", () => {
    for (const method of ["post", "put", "delete", "patch"]) {
      expect(policyFor("/v2/anything/at/all", method)).toBeNull();
    }
  });
});

describe("CACHE_POLICIES - shape", () => {
  it("gives every policy a positive TTL", () => {
    for (const policy of CACHE_POLICIES) {
      expect(typeof policy.ttlMs).toBe("number");
      expect(policy.ttlMs).toBeGreaterThan(0);
    }
  });

  it("declares a valid scope on every policy", () => {
    for (const policy of CACHE_POLICIES) {
      expect(["shared", "user"]).toContain(policy.scope);
    }
  });

  // A user-scoped policy is only safe once the key carries an account id. If a
  // policy is marked "user", the request path must be able to supply one - and
  // when it cannot, the correct behaviour is to skip the cache entirely rather
  // than fall back to a shared key.
  it("marks the user-scoped endpoints as such", () => {
    const history = policyFor("/v2/user/history?lang=en", "get");

    expect(history).not.toBeNull();
    expect(history.scope).toBe("user");
  });

  // Scoped keys make it safe from collision; the short TTL is what bounds the
  // staleness on the forced re-verification path. Both matter, so both are
  // asserted.
  it("keeps /v2/auth/me user-scoped and short-lived", () => {
    const policy = policyFor("/v2/auth/me", "get");

    expect(policy.scope).toBe("user");
    expect(policy.ttlMs).toBeLessThanOrEqual(60 * 1000);
  });

  // Ids become the key prefix that clearCacheByPolicy deletes on. A duplicate
  // would make one mutation silently evict an unrelated policy's rows.
  it("gives every policy a unique, wildcard-free id", () => {
    const ids = CACHE_POLICIES.map((p) => p.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("exposes the longest TTL for the startup sweep", () => {
    const max = Math.max(...CACHE_POLICIES.map((p) => p.ttlMs));
    expect(LONGEST_TTL_MS).toBe(max);
  });
});

describe("invalidationsFor", () => {
  it("returns nothing for a GET", () => {
    expect(invalidationsFor("/v2/post/create", "get")).toEqual([]);
  });

  it("returns nothing for a mutation nothing declares", () => {
    expect(invalidationsFor("/v2/unrelated/thing", "post")).toEqual([]);
  });

  it("returns the policies a declared mutation dirties", () => {
    const dirtied = invalidationsFor("/v2/post/create", "post");

    expect(dirtied.length).toBeGreaterThan(0);
    for (const policy of dirtied) {
      expect(CACHE_POLICIES).toContain(policy);
    }
  });

  // Creating a post dirties the category listings, the feed and post detail -
  // everything that could show the new post - and nothing else.
  it("dirties exactly the entries a post create can change", () => {
    const ids = invalidationsFor("/v2/post/create", "post").map((p) => p.id);

    expect(ids.sort()).toEqual([
      "forum-categories",
      "marketplace-categories",
      "post-detail",
      "post-feed",
    ]);
  });

  // The catch-all declares no invalidations, so it must never appear here -
  // otherwise every mutation would evict every unnamed endpoint's rows.
  it("never returns the catch-all", () => {
    const ids = invalidationsFor("/v2/post/create", "post").map((p) => p.id);

    expect(ids).not.toContain("default-get");
  });
});
