import { makeCacheKey } from "../apiCache";

// makeCacheKey is pure, so it needs no database. The mocks exist only because
// importing apiCache pulls in cacheDb, which imports the native modules.
jest.mock("expo-sqlite", () => ({ openDatabaseAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({
  Directory: jest.fn(),
  File: jest.fn(),
  Paths: { cache: "/tmp" },
}));

describe("makeCacheKey", () => {
  it("is stable for the same endpoint and body", () => {
    expect(makeCacheKey("/v2/a", { p: 1 })).toBe(makeCacheKey("/v2/a", { p: 1 }));
  });

  it("separates different endpoints and different bodies", () => {
    expect(makeCacheKey("/v2/a", undefined)).not.toBe(
      makeCacheKey("/v2/b", undefined)
    );
    expect(makeCacheKey("/v2/a", { p: 1 })).not.toBe(
      makeCacheKey("/v2/a", { p: 2 })
    );
  });

  // The prefix is what clearCacheByPolicy deletes on, so it has to survive as
  // readable text rather than being folded into the hash.
  it("prefixes the key with the policy id when given one", () => {
    const key = makeCacheKey("/v2/a", undefined, "partner-top");

    expect(key.startsWith("partner-top::")).toBe(true);
  });

  it("omits the prefix entirely when no policy id is given", () => {
    const key = makeCacheKey("/v2/a", undefined);

    expect(key).not.toContain("::");
  });

  // Two policies must never share a row, or one mutation evicts the other's.
  it("produces different keys for the same url under different policies", () => {
    expect(makeCacheKey("/v2/a", undefined, "one")).not.toBe(
      makeCacheKey("/v2/a", undefined, "two")
    );
  });
});

// The privacy property. Cache keys carried no account dimension, and signout did
// not clear the cache, so a user-scoped response could be served to whoever
// signed in next on the same device. This cannot be observed on a screen - if it
// regresses, only this test will say so.
describe("makeCacheKey - cross-account isolation", () => {
  it("gives two accounts different keys for the same url", () => {
    const a = makeCacheKey("/v2/user/history", undefined, "user-history", "111");
    const b = makeCacheKey("/v2/user/history", undefined, "user-history", "222");

    expect(a).not.toBe(b);
  });

  it("keeps one account's key stable across calls", () => {
    expect(
      makeCacheKey("/v2/user/history", undefined, "user-history", "111")
    ).toBe(makeCacheKey("/v2/user/history", undefined, "user-history", "111"));
  });

  it("keeps a scoped key inside its policy prefix so eviction still finds it", () => {
    const key = makeCacheKey("/v2/user/history", undefined, "user-history", "111");

    expect(key.startsWith("user-history::")).toBe(true);
  });

  it("does not collide a scoped key with an unscoped one", () => {
    expect(makeCacheKey("/v2/a", undefined, "p", "111")).not.toBe(
      makeCacheKey("/v2/a", undefined, "p")
    );
  });
});
