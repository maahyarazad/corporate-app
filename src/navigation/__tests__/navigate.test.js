/**
 * Tests for the navigation helpers in ../navigate.js — specifically
 * `returnToMain`, which is the whole of specs/012-dispose-profile-and US1.
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

// The action CommonActions.reset produces is `{ type: "RESET", payload: state }`
// (@react-navigation/routers/lib/commonjs/CommonActions.js:36-41), so the state
// under test is always `dispatch`'s first argument's `payload`.
const dispatchedState = () => mockRef.dispatch.mock.calls[0][0].payload;

beforeEach(() => {
  jest.clearAllMocks();
  mockRef.isReady.mockReturnValue(true);
});

describe("returnToMain", () => {
  // T005 — FR-001, data-model.md V1
  it("dispatches a stack containing exactly one route, named Main", () => {
    returnToMain();

    expect(mockRef.dispatch).toHaveBeenCalledTimes(1);

    const state = dispatchedState();
    expect(state.routes).toHaveLength(1);
    expect(state.routes[0].name).toBe("Main");
  });

  // T006 — data-model.md V4. This is the research.md R8 failure mode: the two
  // existing resets in this app (availOffer.screen.js:168, offerRedeemForm.js:111)
  // omit `index`, which makes it derive to routes.length - 1. That is correct by
  // accident while there is one route and wrong the moment there are two, so the
  // assertion is on presence, not on value alone.
  it("writes index explicitly rather than letting it be derived", () => {
    returnToMain();

    const state = dispatchedState();
    expect(Object.prototype.hasOwnProperty.call(state, "index")).toBe(true);
    expect(state.index).toBe(0);
  });

  // T007 — FR-003, data-model.md V5. The nesting is not optional: `Home` is a
  // Tab.Screen inside `Entertainer`, which is itself a route of the `Main`
  // navigator, so a flat { screen: "Home" } resolves to nothing. See the comment
  // this replaced at profile.screen.js:38-42.
  it("selects the Home tab by default, addressing each navigator level", () => {
    returnToMain();

    expect(dispatchedState().routes[0].params).toEqual({
      screen: "Entertainer",
      params: { screen: "Home" },
    });
  });

  // T008 — data-model.md E2 parameterisation, V6
  it("puts a caller-supplied tab in the innermost screen", () => {
    returnToMain("Offers");

    expect(dispatchedState().routes[0].params).toEqual({
      screen: "Entertainer",
      params: { screen: "Offers" },
    });
  });

  // T009 — contracts/screen-lifecycle.md G6. Matches how `navigate` and
  // `goback` already behave: a no-op before the container mounts, never a throw.
  it("does nothing when the navigation container is not ready", () => {
    mockRef.isReady.mockReturnValue(false);

    returnToMain();

    expect(mockRef.dispatch).not.toHaveBeenCalled();
  });
});
