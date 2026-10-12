# Follow-ups from the list audit

## F1 — `offer_types` has no confirmed id field (T019)

`src/features/locations/components/locationlist.component.js:164` renders a chip row from
`item.offer_types`. Those entries expose only `premium_en` at this call site. The keyExtractor uses
`String(item.premium_id ?? item.premium_en)` — it prefers a real id when present and falls back to
the label, never the index (`contracts/list-api.md` §C3).

**Action**: confirm with the API whether `offer_types` entries carry `premium_id`. If they do, drop
the fallback. If they do not, chip labels must be unique within a location or keys will collide.

Related: `src/components/myCard.component.js:199` and `src/components/locationcards.js:168` already
render `offer_types` with `.map((type, index) => ...)` using the index. Same data, same question.

## F2 — Inventory correction: 26 real instances, not 27

The plan and `data-model.md` state 27 list instances. The true figure is **26**. Instance 17,
`src/features/profile/profSettings.js:438`, is an entire `<FlatList>` inside a `{/* ... */}` JSX
comment — it is not a list and never renders.

The first audit script stripped comments when reading *props* but not when finding *instances*,
so it inventoried a commented-out list. Fixed by blanking comments (offsets preserved, so line
numbers still match) before any scanning. `data-model.md` instance 17 should be struck.

Current audit baseline after the Phase 3 removals: **24 instances**.

## F3 — Dead memo in toppartners (fixed in passing)

`src/features/home/components/toppartners.component.js` declared
`const MemoizedLocationCard = React.memo(LocationCards)` at module scope and then never used it —
`renderItem` rendered the unmemoized `LocationCards`. Now wired up.

The same list also passed `key={item.id}` where each `item` is an **array** of locations, so
`item.id` was always `undefined`; and a `key` on the element returned from `renderItem` is ignored
by FlatList regardless. Now iterates group labels, which are genuinely unique.

## F4 — `Offer` onPress contract changed (breaking, contracts C1)

`src/features/offers/components/offer.component.js` is now `memo`-wrapped and its `onPress` takes
the offer: `(offer) => void`. Callers must pass a stable handler, not a per-item closure.

Consumers checked at time of change:
- `src/components/offerList.js` — updated
- `src/features/offers/components/offerModalForm.js:136` — passes no `onPress`, safe
- `src/features/offers/components/offerRedeemForm.js:180` — passes no `onPress`, safe

The call is optional (`onPress?.(offer)`) so the two display-only consumers cannot crash.

## F5 — FlashList deferred (T058)

Not adopted. It would mean a new native dependency, a prebuild, and per-list `estimatedItemSize`
tuning, for an unmeasured benefit (`research.md` R5). Reconsider for the three paginated lists —
`posts.screen`, `postSearch.screen`, `locationlist.component` — only after profiling shows
`FlatList` is the bottleneck.

## F6 — Device verification outstanding

No task requiring a physical device, profiler, or network inspector has been run. That covers the
entire baseline (T003, T004), every sweep (T009, T011, T020, T029, T030, T044, T052), and the
final checks (T055, T056). **No performance claim in this branch has been verified.**

The highest-risk item is T008: `src/screens/location/location-view.screen.js` swapped
`Animated.FlatList` for `Animated.ScrollView`, and that component drives the `002` sticky header.
Quickstart scenarios A2–A4 must pass before this merges.

## F7 — `getItemLayout` skipped everywhere (T043, US5 not delivered)

`contracts/list-api.md` §C4 requires that `getItemLayout` be supplied only where the row size is
**genuinely fixed**, because wrong values misalign scrolling and break `scrollToIndex` — worse than
omitting it. Every candidate was checked against its `StyleSheet` and **none qualified**:

| Candidate | Why skipped |
|---|---|
| `components/events/eventList.js` | `styles.cardButton` declares only shadow/elevation. Cards size to their content (title, date, guest count) — variable height |
| `components/NationalityInput.js`, `components/PhoneInput.js` | `styles.itemRow` is `paddingVertical: 11` + hairline border. Height is *derived* from the text line height, never declared. `numberOfLines={1}` makes it effectively uniform, but the value would be a guess |
| `features/home/components/category.component.js` | `snapToInterval={100 + 16}` implies a 16px gap, but `itemSeparatorHM` is `marginLeft: 8`. The two disagree, so the true item pitch is ambiguous — resolve that first |
| `components/slideshow.js` | Items are full screen width (`width: width`), so this is derivable. Skipped anyway: it is a short, full-bleed carousel with no `scrollToIndex`, so `getItemLayout` buys essentially nothing against a non-zero misalignment risk |

**The codebase still has zero `getItemLayout` uses.** That is a deliberate outcome, not an
oversight. Revisit per list once row heights are measured on a device — the `category`
`snapToInterval`/separator disagreement is worth fixing regardless.

## F8 — US6 `.map()` conversions blocked on T045

T045 requires confirming the realistic maximum item count for each `scrollEnabled={false}` list
**against the API**, and it gates T046, T049, T050 and T051. That is a product/data question that
cannot be answered from the source tree, so no `.map()` conversion was made.

What was done instead:
- **T048 delivered** (independent of T045): `src/components/offerList.js` set `shortOfferList` in a
  `useEffect(..., [])`, so the collapsed list never updated if the `offers` prop changed without a
  remount. Dependencies corrected to `[offers, minItems]`.
- **T049 is void**: the `profSettings.js` list does not exist (see F2).
- **T046, T047, T050, T051 remain open.**

Also still open from the original `offerList` review: `OFFER_COMPONENT_HEIGHT` is `120`, but a real
row is `110` (`ticketContainer`) + `6` (`itemSeparatorVS`) = **116**, so the animated container runs
~4px per row too tall. Left alone because changing it alters the `002` expand/collapse geometry,
which needs device verification to confirm.
