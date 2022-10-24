import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { View, Keyboard } from "react-native";
import styled from "styled-components/native";
import { Searchbar } from "react-native-paper";
import { Label } from "../../components/typography/label.component";
import { LocationContext } from "../../services/location/location.context";
import { LocationList } from "../../features/locations/components/locationlist.component";
import { SocketContext } from "../../services/socket/socket.context";
import { Suggestion } from "../../components/suggestion";
import { config, searchSource } from "../../utils/constants";
import { io } from "socket.io-client";

const Search = styled(Searchbar)`
  margin: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
`;

export const LocationListScreen = ({ navigation, route, ...props }) => {
  const { type, search, limit, source } = route.params;
  const { getLocations } = useContext(LocationContext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [socket, setSocket] = useState();
  const [suggestedList, setSuggestedList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState("");
  const [isEOF, setIsEOF] = useState(false);
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const [resultCount, setResultCount] = useState();
  const [hasSubmitted, setHasSubmitted] = useState(true);
  const isMounted = useRef(true);
  const searchRef = useRef();
  const modeRef = useRef(0);
  const searchData = useRef({
    type: type,
    value: search,
    page: currentPage,
    limit: limit,
    source: source,
  });
  const isShort = useRef(false);

  useEffect(() => {
    let mounted = true;
    isMounted.current = true;
    const _socket = io(config.WEBSOCKET_URL, { path: "/admin/node/" });
    // const testSocket = new WebSocket(
    //   "http://staging.german-emirates-club.com/admin/node/"
    // );
    // testSocket.onopen = () => socket.send(new Date().toLocaleString());

    // testSocket.onmessage = ({ data }) => {
    //   console.log(data);
    //   this.setState({ echo: data });
    // };

    // console.log(_socket);
    // const _socket = io(config.WEBSOCKET_URL, {});
    // console.log(_socket);
    if (mounted) {
      setSocket(_socket);
    }

    setIsLoading(true);
    changeHeader(route.params.headerTitle);
    return () => {
      _socket.close();
      mounted = false;
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!socket) return;

    socket.on("search results", (result) => {
      if (mounted && !isShort.current) {
        setSuggestedList(result);
      }
    });
    return () => {
      mounted = false;
    };
  }, [socket]);

  const changeHeader = (title) => {
    navigation.setOptions({
      headerTitle: () => {
        return (
          <Label numberOfLines={1} size={"title"} weight={"bold"}>
            {title}
          </Label>
        );
      },
    });
  };

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      if (hasSubmitted || searchData.current.page !== currentPage) {
        searchData.current.page = currentPage;

        loadData();
        setHasSubmitted(false);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [currentPage, hasSubmitted]);

  const loadData = () => {
    loadLocations(searchData.current);
  };

  const loadLocations = (data) => {
    getLocations({ ...data, app_id: config.APP_ID })
      .then((response) => {
        if (isMounted.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          if (response.data.length === 0) {
            setIsEOF(true);
            return;
          } else if (response.data.length < limit) {
            setIsEOF(true);
          }
          if (modeRef.current) {
            setResultCount(response.totalCount);
            setLocations(response.data);
          } else {
            setLocations([...locations, ...response.data]);
          }
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  };

  useLayoutEffect(() => {
    let mounted = true;

    if (filters.length >= 3) {
      isShort.current = false;
      if (mounted) {
        socket.emit("search", filters);
      }
    } else {
      isShort.current = true;
      if (mounted) {
        setSuggestedList([]);
      }
    }

    return () => {
      mounted = false;
    };
    // onSearch(filters);
  }, [filters]);

  const loadMore = () => {
    if (!isEOF) {
      setIsLoadingMore(true);
      setCurrentPage(currentPage + 1);
    }
  };

  const onSearch = async (keyword, mode) => {
    setHasSubmitted(true);
    setSuggestedList([]);
    setLocations([]);
    setResultCount(undefined);
    setIsLoading(true);
    setFilters(keyword);
    setIsEOF(false);
    modeRef.current = 1;
    changeHeader(`Keyword: ${keyword}`);
    Keyboard.dismiss();
    searchData.current = {
      type: 0,
      value: 0,
      page: 1,
      limit: limit,
      source: mode,
      keyword: keyword,
    };
    setCurrentPage(1);
  };

  const onFilterChange = (e) => {
    setFilters(e);
  };

  const onScroll = () => {
    searchRef.current.blur();
  };

  const onSearchFocus = () => {
    setSearchBarFocused(true);
  };

  const onSearchBlur = () => {
    setSearchBarFocused(false);
  };

  const focusSearchbar = () => {
    // alert("atay");
    searchRef.current.focus();
  };

  const handleSubmitSearch = () => {
    if (filters.trim().length > 0) {
      setIsLoading(true);
      onSearch(filters, searchSource.searchbar);
    }
  };

  return (
    <>
      <View style={{ flex: 1 }}>
        <View style={{ backgroundColor: "white" }}>
          <Search
            ref={searchRef}
            numberOfLines={1}
            inputStyle={{
              alignSelf: "center",
            }}
            value={filters}
            enablesReturnKeyAutomatically
            onLayout={focusSearchbar}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            onSubmitEditing={handleSubmitSearch}
            onChangeText={onFilterChange}
            autoCorrect={false}
            placeholder={"Search"}
          ></Search>
          <View style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
            {resultCount != undefined && (
              <Label weight={"bold"}>{resultCount} Results</Label>
            )}
          </View>
        </View>

        <LocationList
          // onLayout={() => {
          //   alert("atay");
          //   searchRef.current.focus();
          // }}
          onScrollBegin={onScroll}
          navigation={navigation}
          locations={locations}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          // loadMore={loadMore}
          onMomentumScrollEnd={loadMore}
        />

        {suggestedList.length > 0 && searchBarFocused && (
          <Suggestion onPress={onSearch} suggestedList={suggestedList} />
        )}
      </View>
    </>
  );
};
