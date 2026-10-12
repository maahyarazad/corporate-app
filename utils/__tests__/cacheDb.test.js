import { clearApiCache, sweepApiCache } from "../cacheDb";

// cacheDb opens a real SQLite handle through expo-sqlite, which does not exist
// under jest. The driver is mocked at the boundary so these tests exercise the
// SQL we issue and the decisions around it, not sqlite itself.
//
// The `mock` prefix is required: jest hoists mock factories above the imports,
// so anything they close over must be recognisably a mock.
const mockDb = {
  execAsync: jest.fn(async () => {}),
  runAsync: jest.fn(async () => ({ changes: 0 })),
  getFirstAsync: jest.fn(async () => null),
  getAllAsync: jest.fn(async () => []),
  withTransactionAsync: jest.fn(async (fn) => fn()),
};

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(async () => mockDb),
}));

jest.mock("expo-file-system", () => ({
  Directory: jest.fn(() => ({ create: jest.fn(), list: () => [] })),
  File: jest.fn(() => ({ exists: false })),
  Paths: { cache: "/tmp" },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.runAsync.mockImplementation(async () => ({ changes: 0 }));
});

const statementsIssued = () =>
  mockDb.runAsync.mock.calls.map(([sql]) => sql).join("\n");

describe("clearApiCache", () => {
  it("empties api_cache", async () => {
    await clearApiCache();
    expect(statementsIssued()).toMatch(/DELETE FROM api_cache/);
  });

  // Signout must not pay to delete image bytes off disk, and the image cache is
  // not user-scoped anyway.
  it("leaves image_cache alone", async () => {
    await clearApiCache();
    expect(statementsIssued()).not.toMatch(/image_cache/);
  });

  // A cache failure must never be able to block a signout.
  it("resolves rather than throwing when the database is unavailable", async () => {
    mockDb.runAsync.mockRejectedValueOnce(new Error("database is locked"));
    await expect(clearApiCache()).resolves.toBeUndefined();
  });
});

describe("sweepApiCache", () => {
  it("deletes rows older than the cutoff", async () => {
    const before = Date.now();
    await sweepApiCache(1000);

    const call = mockDb.runAsync.mock.calls.find(([sql]) =>
      /saved_at\s*<\s*\?/.test(sql)
    );

    expect(call).toBeDefined();
    expect(call[0]).toMatch(/DELETE FROM api_cache/);
    expect(typeof call[1]).toBe("number");
    // The cutoff is "now minus maxAge", so it must sit at or before that point.
    expect(call[1]).toBeLessThanOrEqual(before - 1000 + 5);
  });

  it("trims to the row ceiling, oldest-first", async () => {
    await sweepApiCache(1000, 50);

    const call = mockDb.runAsync.mock.calls.find(([sql]) =>
      /ORDER BY saved_at/.test(sql)
    );

    expect(call).toBeDefined();
    // Newest kept, oldest dropped: DESC with an OFFSET of the ceiling.
    expect(call[0]).toMatch(/ORDER BY saved_at DESC/);
    expect(call[1]).toBe(50);
  });

  it("never throws", async () => {
    mockDb.runAsync.mockRejectedValue(new Error("no such table"));
    await expect(sweepApiCache(1000)).resolves.toBeUndefined();
  });
});
