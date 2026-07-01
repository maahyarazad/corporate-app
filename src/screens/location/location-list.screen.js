import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { View, Keyboard } from "react-native";
import styled from "styled-components/native";
import { Searchbar } from "react-native-paper";
import { Label } from "../../components/typography/label.component";
import { LocationList } from "../../features/locations/components/locationlist.component";
import { Suggestion } from "../../components/suggestion";
import { config, searchSource } from "../../utils/constants";
import { io } from "socket.io-client";
import { TranslationContext } from "../../services/translation/translation.context";
import useRequest from "../../../hooks/useRequest";

const Search = styled(Searchbar)`
  margin: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background-color: white;
  border-radius: 12px;
`;

const SUGGESTION_MIN_CHARS = 3;
const SUGGESTION_DEBOUNCE_MS = 300;

export const LocationListScreen = ({ navigation, route, ...props }) => {
  const { type, search, limit, source } = route.params;
  const { lang } = useContext(TranslationContext);

  const request = useRequest();

  // ---- state -------------------------------------------------------------
  const [socket, setSocket] = useState();
  const [suggestedList, setSuggestedList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isEOF, setIsEOF] = useState(false);
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(true); // triggers the very first load
  const [headerTitle, setHeaderTitle] = useState(route.params.headerTitle);

  // ---- refs --------------------------------------------------------------
  const isMounted = useRef(true);
  const searchRef = useRef();
  const socketRef = useRef(null);
  const debounceRef = useRef(null);
  const didInitialFocus = useRef(false);

  // modeRef: 1 = replace list (new search), 0 = append (pagination / default list)
  const modeRef = useRef(0);
  // isShort: the current query is shorter than the suggestion threshold
  const isShort = useRef(true);
  // isDefaultList: we are currently showing the default (non-search) list.
  // This is the single source of truth for "do we need to reload the default
  // list?" — it is set false the moment a search is committed and true once the
  // default list has been (re)loaded. Because it flips to true inside
  // reloadDefaultList, it also naturally collapses paper's double clear
  // callbacks (onChangeText('') + onClearIconPress) into a single reload.
  const isDefaultListRef = useRef(true);

  // The query payload that gets posted to the API.
  const searchData = useRef({
    type,
    value: search,
    page: 1,
    limit,
    source,
  });

  // The default (non-search) query payload. Clearing the search reloads this
  // from the server, so we keep it around to restore the original request.
  const defaultSearchDataRef = useRef({
    type,
    value: search,
    page: 1,
    limit,
    source,
  });

  // ---- mount / unmount ---------------------------------------------------
  useEffect(() => {
    isMounted.current = true;

    const _socket = io(config.WEBSOCKET_URL, { path: "/admin/node/" });
    socketRef.current = _socket;
    setSocket(_socket);

    return () => {
      isMounted.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      _socket.close();
      socketRef.current = null;
    };
  }, []);

  // ---- header ------------------------------------------------------------
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Label
          numberOfLines={1}
          size="title"
          weight="bold"
          style={{ paddingRight: 15 }}
        >
          {headerTitle}
        </Label>
      ),
    });
  }, [navigation, headerTitle]);

  // ---- socket suggestion results ----------------------------------------
  useEffect(() => {
    if (!socket) return;

    const onResults = (result) => {
      // Ignore results that arrive after the query dropped below the
      // threshold (or after unmount).
      if (isMounted.current && !isShort.current) {
        setSuggestedList(result);
      }
    };

    socket.on("search results", onResults);
    return () => {
      socket.off("search results", onResults);
    };
  }, [socket]);

  // ---- data loading ------------------------------------------------------
  const loadLocations = useCallback(
    async (data) => {
      try {
        const response = await request("/v2/partner/", "post", {
          ...data,
          app_id: config.APP_ID,
          lang,
        });

        if (!isMounted.current) return; // guard against setState after unmount

        if (response) {
          if (response.data.length === 0) {
            setIsEOF(true);
            return;
          }
          if (response.data.length < limit) {
            setIsEOF(true);
          }

          if (modeRef.current) {
            // New search -> replace the list, then fall back to append mode so
            // that subsequent "load more" pages are appended, not replaced.
            setLocations(response.data);
            setResultCount(response.data.length);
            modeRef.current = 0;
          } else {
            setLocations((prev) => [...prev, ...response.data]);
            setResultCount((prev) => prev + response.data.length);
          }
        }
      } catch (error) {
        console.log("Failed to load location list:", error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [request, lang, limit]
  );

  // Keep a live reference to loadLocations so the trigger effect can call the
  // latest version without re-running whenever lang/limit change.
  const loadLocationsRef = useRef(loadLocations);
  useEffect(() => {
    loadLocationsRef.current = loadLocations;
  }, [loadLocations]);

  // Fires the initial load, new searches, and pagination.
  useEffect(() => {
    if (hasSubmitted || searchData.current.page !== currentPage) {
      searchData.current.page = currentPage;
      loadLocationsRef.current(searchData.current);
      if (hasSubmitted) {
        setHasSubmitted(false);
      }
    }
  }, [currentPage, hasSubmitted]);

  // ---- live suggestions (properly debounced) ----------------------------
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (filters.length >= SUGGESTION_MIN_CHARS) {
      isShort.current = false;
      debounceRef.current = setTimeout(() => {
        socketRef.current?.emit("search", filters);
        debounceRef.current = null;
      }, SUGGESTION_DEBOUNCE_MS);
    } else {
      isShort.current = true;
      // Only triggers a render if the list isn't already empty.
      setSuggestedList((prev) => (prev.length === 0 ? prev : []));
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [filters]);

  // ---- handlers ----------------------------------------------------------
  const onSearch = useCallback(
    (keyword, mode) => {
      // A committed search (return key or tapping a suggestion). Cancel any
      // pending suggestion lookup so it can't fire after we navigate the list.
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      isDefaultListRef.current = false;
      isShort.current = true;
      modeRef.current = 1; // replace results for the new query

      setSuggestedList([]);
      setLocations([]);
      setResultCount(0);
      setIsEOF(false);
      setIsLoading(true);
      setHeaderTitle(`Keyword: ${keyword}`);

      // The user explicitly asked for results here, so dismissing the keyboard
      // is the expected behaviour.
      Keyboard.dismiss();

      searchData.current = {
        type: 0,
        value: 0,
        page: 1,
        limit,
        source: mode,
        keyword,
      };

      setHasSubmitted(true);
      setCurrentPage(1);
    },
    [limit]
  );

  // Clearing the search reloads the default (non-search) list from the server.
  // The query is reset to the default payload and re-fetched; the keyboard is
  // intentionally left open (only the results reload).
  const reloadDefaultList = useCallback(() => {
    // Cancel any pending suggestion lookup before we reload.
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    isDefaultListRef.current = true;
    isShort.current = true;
    modeRef.current = 1; // replace the current results with the default list

    searchData.current = { ...defaultSearchDataRef.current, page: 1 };

    setHeaderTitle(route.params.headerTitle);
    setSuggestedList([]);
    setLocations([]);
    setResultCount(0);
    setIsEOF(false);
    setIsLoading(true);

    // Trigger the load effect to fetch the default list from the server.
    setCurrentPage(1);
    setHasSubmitted(true);
  }, [route.params.headerTitle]);

  // Reload the default list ONLY when we are currently showing search results.
  // Idempotent: reloadDefaultList flips isDefaultListRef to true, so if the
  // clear fires more than one callback (paper emits BOTH onChangeText('') and
  // onClearIconPress) we still reload exactly once. It also correctly does
  // nothing when the default list is already on screen (e.g. typing then
  // deleting back to empty without ever committing a search).
  const maybeReloadDefaultList = useCallback(() => {
    if (!isDefaultListRef.current) {
      reloadDefaultList();
    }
  }, [reloadDefaultList]);

  const onFilterChange = useCallback(
    (text) => {
      setFilters(text);

      // Whenever the field is emptied — by the clear icon, a manual
      // backspace-to-empty, or paper's own onChangeText('') on clear — reload
      // the default list. The guard above makes this fire once and only when
      // needed, so we no longer depend on detecting an exact edge transition.
      if (text.trim().length === 0) {
        maybeReloadDefaultList();
      }
    },
    [maybeReloadDefaultList]
  );

  const handleClear = useCallback(() => {
    // onClearIconPress handler. Do NOT rely on react-native-paper re-emitting
    // onChangeText('') here — on iOS the clear can be routed around that path,
    // which is why the reload worked on Android but not iOS. Reset and reload
    // explicitly, then keep the keyboard open.
    setFilters("");
    maybeReloadDefaultList();
    searchRef.current?.focus();
  }, [maybeReloadDefaultList]);

  const handleSubmitSearch = useCallback(() => {
    if (filters.trim().length > 0) {
      onSearch(filters, searchSource.searchbar);
    }
  }, [filters, onSearch]);

  const loadMore = useCallback(() => {
    if (!isEOF && !isLoadingMore) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [isEOF, isLoadingMore]);

  const onScroll = useCallback(() => {
    // Scrolling the results is a deliberate user gesture, so collapsing the
    // keyboard here is intentional. Remove this line if you want it to stay open.
    searchRef.current?.blur();
  }, []);

  const onSearchFocus = useCallback(() => setSearchBarFocused(true), []);
  const onSearchBlur = useCallback(() => setSearchBarFocused(false), []);

  // One-shot focus on first layout. Crucially this NO LONGER blurs on every
  // layout pass, which is what used to dismiss the keyboard on the first
  // keystroke (the clear icon appearing re-fires onLayout).
  const handleSearchbarLayout = useCallback(() => {
    if (!didInitialFocus.current && route.params.focus) {
      didInitialFocus.current = true;
      searchRef.current?.focus();
    }
  }, [route.params.focus]);

  // ---- render ------------------------------------------------------------
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: "white" }}>
        <Search
          ref={searchRef}
          numberOfLines={1}
          inputStyle={{ alignSelf: "center" }}
          onClearIconPress={handleClear}
          value={filters}
          enablesReturnKeyAutomatically
          // Force iOS to clear through paper's own clear icon (which fires
          // handleClear) instead of the native clear button, which would clear
          // the field WITHOUT calling any handler and skip the reload.
          clearButtonMode="never"
          onLayout={handleSearchbarLayout}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          onSubmitEditing={handleSubmitSearch}
          onChangeText={onFilterChange}
          autoCorrect={false}
          placeholder="Search"
        />
        <View style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
          <Label weight="bold">{resultCount} Results</Label>
        </View>
      </View>

      <LocationList
        onScrollBegin={onScroll}
        navigation={navigation}
        locations={locations}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        onMomentumScrollEnd={loadMore}
      />

      {suggestedList.length > 0 && searchBarFocused && (
        <Suggestion onPress={onSearch} suggestedList={suggestedList} />
      )}
    </View>
  );
};