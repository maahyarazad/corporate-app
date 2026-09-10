import {
  CommonActions,
  createNavigationContainerRef,
} from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

export const goback = () => {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
};

// Go home and leave nothing behind.
//
// Every route of the `Main` navigator above `Main` itself is dropped and
// unmounted, whatever the stack happened to be. Screens lose their state; that
// is the point, not a side effect - see specs/012-dispose-profile-and.
//
// WHY `reset` AND NOT `navigate("Main", ...)`:
//
// navigate() pops only when the target is already in the stack
// (@react-navigation/routers StackRouter.js, the NAVIGATE case, which returns
// `routes.slice(0, index)` on a hit). When it is not, navigate PUSHES. And
// `Main` is genuinely absent from the stack after a redemption - both
// availOffer.screen.js and offerRedeemForm.js reset to `[TransactionSummary]`
// - so from there navigate("Main") would produce [TransactionSummary, Main],
// leaving the receipt mounted underneath the home screen indefinitely.
//
// popToTop() has the mirror-image problem: it is a no-op at index 0, and it
// cannot address the nested tab either.
//
// reset states the stack it wants instead of deriving it, so it is correct for
// all three cases rather than for the common one.
//
// `index` is written out even though a single-route state derives the same 0.
// The two resets named above omit it, which is correct by accident today and
// wrong the moment anyone adds a second route.
//
// The params are nested twice because the tab is two navigators down: `Home`
// is a Tab.Screen inside `Entertainer`, which is a route of `Main`. A flat
// { screen: "Home" } searches the current navigator and its parents, never
// sideways into an unfocused branch, and resolves to nothing.
export const returnToMain = (tab = "Home") => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            params: { screen: "Entertainer", params: { screen: tab } },
          },
        ],
      })
    );
  }
};