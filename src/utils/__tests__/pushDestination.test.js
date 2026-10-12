import { resolvePushDestination } from "../pushDestination";

// The resolver logs a diagnostic for every unresolved payload; silence it so
// the expected-null cases don't flood the test output.
let logSpy;

beforeEach(() => {
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe("resolvePushDestination — accepted payload shapes", () => {
  it("resolves the partner shape that works today", () => {
    expect(resolvePushDestination({ path: "partner", id: 1592 })).toEqual({
      screen: "Location View",
      params: { locId: 1592 },
    });
  });

  it("resolves the event shape", () => {
    expect(resolvePushDestination({ path: "event", id: 720 })).toEqual({
      screen: "Event Detail",
      params: { id: 720 },
    });
  });

  it("resolves the server's destination_type/destination_id naming", () => {
    expect(
      resolvePushDestination({ destination_type: "event", destination_id: 720 })
    ).toEqual({ screen: "Event Detail", params: { id: 720 } });
  });

  it("resolves a string destination_id to a number", () => {
    expect(
      resolvePushDestination({
        destination_type: "event",
        destination_id: "720",
      })
    ).toEqual({ screen: "Event Detail", params: { id: 720 } });
  });

  it("resolves the plural, capitalised type with a string id", () => {
    expect(resolvePushDestination({ path: "Events", id: "720" })).toEqual({
      screen: "Event Detail",
      params: { id: 720 },
    });
  });

  it("resolves the entity_id key", () => {
    expect(
      resolvePushDestination({ type: "partner", entity_id: "1592" })
    ).toEqual({ screen: "Location View", params: { locId: 1592 } });
  });
});

describe("resolvePushDestination — type normalisation", () => {
  it.each([["event"], ["Event"], ["EVENT"], [" EVENT "], ["events"], ["Events"]])(
    "normalises %p to the event destination",
    (rawType) => {
      expect(resolvePushDestination({ path: rawType, id: 720 })).toEqual({
        screen: "Event Detail",
        params: { id: 720 },
      });
    }
  );
});

describe("resolvePushDestination — key precedence", () => {
  it("prefers path over destination_type", () => {
    expect(
      resolvePushDestination({
        path: "partner",
        destination_type: "event",
        id: 1592,
      })
    ).toEqual({ screen: "Location View", params: { locId: 1592 } });
  });

  it("falls through an empty path to destination_type", () => {
    expect(
      resolvePushDestination({
        path: "",
        destination_type: "event",
        destination_id: 720,
      })
    ).toEqual({ screen: "Event Detail", params: { id: 720 } });
  });
});

describe("resolvePushDestination — regression: partner and post unchanged", () => {
  it("keeps partner mapped to Location View with locId", () => {
    expect(resolvePushDestination({ path: "partner", id: 1592 })).toEqual({
      screen: "Location View",
      params: { locId: 1592 },
    });
  });

  it("keeps post mapped to post-detail with the push origin", () => {
    expect(resolvePushDestination({ path: "post", id: 42 })).toEqual({
      screen: "post-detail",
      params: { id: 42, origin: "push" },
    });
  });
});

describe("resolvePushDestination — unresolvable payloads", () => {
  it.each([
    ["an empty object", {}],
    ["undefined", undefined],
    ["null", null],
    ["a non-object", "event"],
    ["an empty path", { path: "" }],
    ["an unknown type", { path: "magazine", id: 5 }],
    ["a missing id", { path: "event" }],
    ["a null id", { path: "event", id: null }],
    ["an empty-string id", { path: "event", id: "" }],
    ["a non-numeric id", { path: "event", id: "abc" }],
  ])("returns null for %s", (_label, payload) => {
    expect(resolvePushDestination(payload)).toBeNull();
  });

  it("does not throw on any malformed payload", () => {
    expect(() => resolvePushDestination(undefined)).not.toThrow();
    expect(() => resolvePushDestination({ path: 720 })).not.toThrow();
  });
});
