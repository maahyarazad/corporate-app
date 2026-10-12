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
// Preserving the mounted `Main` is what separates US1 from US6. A reset whose
// route object carries no `key` is a *new* route as far as React Navigation is
// concerned, so it tears the old one down - and `Main` owns Entertainer, which
// owns Home. That unmount is what made returning from Profile refetch the home
// screen, because RenderHome's load guard is per-instance.
//
// Reusing the existing route's key gives the same single-route stack US1 asks
// for while leaving the screen mounted.
export const returnToMain = (tab = "Home") => {
  if (!navigationRef.isReady()) return;

  // Read the tree up front rather than through the function form of `dispatch`.
  // That form hands the reducer a callback, so anything it assigns is only
  // observable once the reducer has run - which makes a flag set inside it a
  // race, not a value. getRootState is synchronous and says the same thing.
  const mounted = navigationRef
    .getRootState()
    ?.routes?.find((route) => route.name === "Main");

  // No mounted Main is a real case, not a defensive branch: a cold start, or a
  // return from the auth / no-connection roots, which reset the whole tree.
  // There the route has to be built, and params are the only way to address the
  // nested tab.
  const route = mounted
    ? { ...mounted }
    : {
        name: "Main",
        // The params are nested twice because the tab is two navigators down:
        // `Home` is a Tab.Screen inside `Entertainer`, which is a route of
        // `Main`. A flat { screen: "Home" } searches the current navigator and
        // its parents, never sideways into an unfocused branch, and resolves to
        // nothing.
        params: { screen: "Entertainer", params: { screen: tab } },
      };

  navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [route] }));

  // The tab needs a second dispatch, and only when a mounted Main was reused.
  // Keeping that route's key also keeps its nested navigator state, and
  // existing state beats `params` - so the tab the caller asked for would be
  // ignored if this were folded into the reset above. In the freshly-built case
  // the params already carry it.
  if (mounted) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: "Main",
        params: { screen: "Entertainer", params: { screen: tab } },
      })
    );
  }
};
