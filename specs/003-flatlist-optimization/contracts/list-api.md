# Contract: List and Row Component API

No external API is exposed. The contracts that matter are internal: the props of row components
and the shape of list configuration. Changing a row's `onPress` signature is a **breaking change**
for its callers, which is why each is recorded here.

## C1 — The `onPress` contract change (the one that actually matters)

`React.memo` on a row is inert while the parent mints a new closure per item
(`research.md` R2). Fixing that means moving the argument into the row, which changes the row's
prop contract:

**Before** — parent builds the closure:
```jsx
renderItem={({ item }) => <Offer onPress={() => onSelectOffer(item)} offer={item} />}
```

**After** — row calls back with its own item:
```jsx
// parent
const renderItem = useCallback(({ item }) => <Offer onPress={onSelectOffer} offer={item} />, [onSelectOffer]);

// row
const Offer = memo(({ offer, onPress }) => (
  <TouchableHighlight onPress={() => onPress(offer)} ... />
));
```

The inner arrow is fine — it lives inside the memoized row and only changes when `offer` changes.

**Rows requiring this change**, each a separate contract update:

| Row component | Called from | New `onPress` signature |
|---|---|---|
| `Offer` (`features/offers/components/offer.component.js`) | `offerList.js` | `(offer) => void` |
| Row in `components/locationcards.js` | instance 24 | `(item) => void` |
| Row in `features/home/components/category.component.js` | instance 27 | `(item) => void` |
| Row in `components/DropDown.js` | instance 12 | `(item) => void` |
| Row in `components/NationalityInput.js` / `PhoneInput.js` | instances 14, 15 | `(item) => void` |

**Every caller of a changed row must be updated in the same commit.** Grep for the component name
before editing; several rows are used in more than one list.

## C2 — Props that must not change

Converting a list's internals must not alter what its parent passes.

| Component | Preserved |
|---|---|
| `OfferList` | `offers`, `location`, `distance`, `minItems`. Collapsed height stays `minItems` rows; expand/collapse stays 300ms; `showAll` still flips **after** the collapse completes (this is `runOnJS`-guarded from `002` — do not break it) |
| `locationlist.component` | Pagination behaviour: `onEndReached` semantics and page size unchanged, apart from defect D2's threshold |
| Every row component | Visual output identical. Only identity and keys move |

## C3 — `keyExtractor` contract

Every list MUST supply `keyExtractor` returning a **stable, unique string**.

```jsx
keyExtractor={useCallback((item) => String(item.id), [])}
```

- Use the domain id — `item.id`, `item.post_id`, `item.premium_id` — never the index.
- Coerce to string; a numeric return warns in dev.
- The extractor itself must be `useCallback`-stable, or it defeats the purpose.
- Where no stable id exists in the data, that is a **data problem to raise**, not a licence to use
  the index. Record it rather than silently keeping index keys.

## C4 — `getItemLayout` contract

Supply it **only** where the row height is genuinely fixed, and include the separator:

```jsx
const ROW = ITEM_HEIGHT + SEPARATOR_HEIGHT;
const getItemLayout = useCallback(
  (_, index) => ({ length: ROW, offset: ROW * index, index }), []
);
```

Wrong values produce misaligned scrolling and broken `scrollToIndex`, which is worse than omitting
it. Verify the height against the row's `StyleSheet`, not by guessing — `offerList` is the
cautionary case, where the parent's assumed 120 is really 116.

Do **not** add it to lists with variable-height rows (anything wrapping text that can wrap).

## C5 — Import and prop bans

After this refactor these must hold across `src/`:

1. No `FlatList` without a `data` prop (it is a `ScrollView`).
2. No list without `keyExtractor`.
3. No inline `renderItem={({ item }) => ...}`.
4. No `onEndReachedThreshold` greater than `1`.

Enforced by `npm run audit:lists` (`research.md` R6). The script must strip comments before
matching, or commented-out props register as present.

**Not banned**: `removeClippedSubviews`, `windowSize`, `maxToRenderPerBatch` are simply not to be
added without profiling evidence. They are absent today and should stay absent.
