/**
 * Tests for the navigation helpers in ../navigate.js — specifically
 * `returnToMain`, which is specs/012-dispose-profile-and US1 and US6.
 *
 * What is asserted here is the *dispatched action*, not the resulting
 * navigation state. That is deliberate: the truncation behaviour belongs to
 * @react-navigation/routers' StackRouter (see specs/012 research.md R1, which
 * verifies it against the installed source), and re-testing a third-party
 * reducer here would buy nothing. What this file guards is the one thing this
 * repo owns — the shape of the action we hand it.
 */

// The identifier must start with `mock` or babel-plugin-jest-hoist rejects the
// out-of-scope reference inside the jest.mock factory below.
const mockRef = {
  isReady: jest.fn(() => true),
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  getRootState: jest.fn(),
};

// Only two things are needed from the real package, and pulling the whole of
// @react-navigation/native through requireActual drags in the RN renderer for
// no benefit. CommonActions comes from routers, which is where native
// re-exports it from anyway.
jest.mock("@react-navigation/native", () => ({
  createNavigationContainerRef: () => mockRef,
  CommonActions: jest.requireActual("@react-navigation/routers").CommonActions,
}));

const { returnToMain } = require("../navigate");

// The key React Navigation would have assigned the mounted Main. Preserving it
// is the whole of US6, so it is asserted by identity, not by shape.
const MOUNTED_MAIN_KEY = "Main-p0Qx7";

const stateOf = (...names) => ({
  index: names.length - 1,
  routes: names.map((name, i) => ({
    key: name === "Main" ? MOUNTED_MAIN_KEY : `${name}-${i}`,
    name,
  })),
});

// US6 makes returnToMain read the tree before dispatching, so each test stages
// the state it wants first.
const given = (...names) => mockRef.getRootState.mockReturnValue(stateOf(...names));

const resetPayload = () => mockRef.dispatch.mock.calls[0][0].payload;

beforeEach(() => {
  jest.clearAllMocks();
  mockRef.isReady.mockReturnValue(true);
  given("Main");
});

describe("returnToMain — the single-route guarantee (US1)", () => {
  // T005 — FR-001, data-model.md V1
  it("dispatches a stack containing exactly one route, named Main", () => {
    given("Main", "Map", "Location View", "AvailOffer", "TransactionSummary");

    returnToMain();

    const state = resetPayload();

    expect(state.routes).toHaveLength(1);
    expect(state.routes[0].name).toBe("Main");
  });

  // T050 — US1 must survive US6. Five deep, and the reused route still reduces
  // to one.
  it("truncates a five-deep stack even while reusing the mounted Main", () => {
    given("Main", "Map", "Location View", "AvailOffer", "TransactionSummary");

    returnToMain();

    const state = resetPayload();

    expect(state.routes).toHaveLength(1);
    expect(state.routes[0].key).toBe(MOUNTED_MAIN_KEY);
  });

  // T006 — data-model.md V4. This is the research.md R8 failure mode: the two
  // existing resets in this app (availOffer.screen.js:168, offerRedeemForm.js:111)
  // omit `index`, which makes it derive to routes.length - 1. That is correct by
  // accident while there is one route and wrong the moment there are two, so the
  // assertion is on presence, not on value alone.
  it("writes index explicitly rather than letting it be derived", () => {
    returnToMain();

    const state = resetPayload();

    expect(Object.prototype.hasOwnProperty.call(state, "index")).toBe(true);
    expect(state.index).toBe(0);
  });

  // T009 — contracts/screen-lifecycle.md G6. Matches how `navigate` and
  // `goback` already behave: a no-op before the container mounts, never a throw.
  it("does nothing when the navigation container is not ready", () => {
    mockRef.isReady.mockReturnValue(false);

    returnToMain();

    expect(mockRef.dispatch).not.toHaveBeenCalled();
  });
});

describe("returnToMain — reusing the mounted Main (US6)", () => {
  // T050 — the load-bearing assertion. Without the key, React Navigation treats
  // the route as new, unmounts Entertainer and Home, and the home screen
  // refetches. That is the regression this story exists to close.
  it("carries the mounted Main's key so the screen is not remounted", () => {
    given("Main", "Profile");

    returnToMain();

    expect(resetPayload().routes[0].key).toBe(MOUNTED_MAIN_KEY);
  });

  // A reused route keeps its nested navigator state, and existing state beats
  // `params` - so the tab cannot ride along on the reset. It goes in a second
  // dispatch.
  it("selects the tab in a second dispatch, not on the reset", () => {
    returnToMain("Offers");

    expect(mockRef.dispatch).toHaveBeenCalledTimes(2);

    const tabAction = mockRef.dispatch.mock.calls[1][0];

    expect(tabAction.payload).toEqual({
      name: "Main",
      params: { screen: "Entertainer", params: { screen: "Offers" } },
    });
  });

  // T007 — FR-003. Home remains the default.
  it("defaults to the Home tab", () => {
    returnToMain();

    expect(mockRef.dispatch.mock.calls[1][0].payload.params).toEqual({
      screen: "Entertainer",
      params: { screen: "Home" },
    });
  });
});

describe("returnToMain — no mounted Main (US6 fallback)", () => {
  // T049. Real case, not defensive: a cold start, or a return from the auth or
  // no-connection roots, which reset the whole tree. Losing this path would
  // break returning home from them.
  it("builds the route when no Main is mounted", () => {
    given("NoConnection");

    returnToMain();

    const state = resetPayload();

    expect(state.routes).toHaveLength(1);
    expect(state.routes[0].name).toBe("Main");
    expect(state.routes[0].key).toBeUndefined();
  });

  // T008 — data-model.md E2/V5/V6. With nothing to reuse there is no nested
  // state to lose, so params are the right way to address the tab and no second
  // dispatch is needed.
  it("addresses each navigator level through params, with no second dispatch", () => {
    given("NoConnection");

    returnToMain("Events");

    const state = resetPayload();

    expect(state.routes[0].params).toEqual({
      screen: "Entertainer",
      params: { screen: "Events" },
    });
    expect(mockRef.dispatch).toHaveBeenCalledTimes(1);
  });
});
