import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SpecialTags } from "../features/home/components/specialtags";
import { navigate } from "../navigation/navigate";
import { config, typeEnum } from "../utils/constants";
import { Skeleton } from "../components/skeleton";
import { width } from "../components/styles";
import { SearchButton } from "../components/searchbutton";
import { TranslationContext } from "../services/translation/translation.context";
import useRequest from "../../hooks/useRequest";
import { isCancel } from "../utils/cancellation";

export const SpecialsScreen = () => {
  const [specialTagList, setSpecialTagList] = useState([]);
  const { i18n, lang } = useContext(TranslationContext);
  const request = useRequest();

  // `width` is a module constant, so this only ever needs to compute once.
  const cellSize = useMemo(() => (width - 60) / 4, []);

  const getAvailableTags = useCallback(
    async (signal) => {
      try {
        const response = await request(
          `/v2/partner/tags-available?app_id=${config.APP_ID}&lang=${lang}`,
          "get",
          undefined,
          undefined,
          signal
        );
        if (response) {
          setSpecialTagList(response.result);
        }
      } catch (error) {
        if (isCancel(error)) return;
        console.log("Failed to get available tags: ", error);
      }
    },
    [request, lang]
  );

  useEffect(() => {
    const controller = new AbortController();

    getAvailableTags(controller.signal);

    return () => controller.abort();
    // Fetch once on mount (matches the original behaviour). If you want the
    // list to refetch when the language changes, add `getAvailableTags` here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = useCallback((item) => {
    navigate("LocationList", {
      type: typeEnum.specialtags,
      search: item.id,
      page: 1,
      limit: 10,
      source: 2,
      headerTitle: item.specialtags_en,
    });
  }, []);

  const handleSearch = useCallback(() => {
    navigate("LocationList", {
      type: typeEnum.category,
      search: 0,
      page: 1,
      limit: 10,
      source: 2,
      headerTitle: i18n.t("search-all"),
    });
  }, [i18n]);

  // This used to be a one-screen stack navigator whose `component` was a
  // useCallback, so its identity turned over every time `specialTagList`
  // arrived. React treats a new component type as a different component and
  // unmounts the old tree - a full native teardown and rebuild inside the
  // Entertainer tab pager, on nothing more than a finished fetch. The stack
  // routed nowhere (nothing navigates to "Offers1") and rendered no header, so
  // the content is rendered directly instead.
  return (
    <View style={styles.centeredView}>
      <ScrollView>
        <View style={styles.searchContainer}>
          <SearchButton onPress={handleSearch} />
        </View>
        {specialTagList.length > 0 ? (
          <SpecialTags handlePress={handlePress} data={specialTagList} />
        ) : (
          <SkeletonTags cellSize={cellSize} />
        )}
      </ScrollView>
    </View>
  );
};

const SkeletonCell = React.memo(({ cellSize }) => (
  <View style={styles.skeletonCell}>
    <Skeleton
      width={cellSize}
      height={cellSize}
      borderRadius={10}
      opacityMax={0.2}
      opacityMin={0.1}
    />
    <Skeleton
      width={cellSize - 20}
      height={20}
      borderRadius={10}
      opacityMax={0.2}
      opacityMin={0.1}
      style={styles.skeletonLabel}
    />
  </View>
));

const SkeletonRow = React.memo(({ cellSize }) => (
  <View style={styles.skeletonRow}>
    {[0, 1, 2, 3].map((i) => (
      <SkeletonCell key={i} cellSize={cellSize} />
    ))}
  </View>
));

const SkeletonTags = React.memo(({ cellSize }) => (
  <View style={styles.skeletonContainer}>
    <Skeleton
      variant="square"
      height={30}
      width={200}
      borderRadius={10}
      opacityMax={0.2}
      opacityMin={0.1}
    />
    <SkeletonRow cellSize={cellSize} />
    <SkeletonRow cellSize={cellSize} />
  </View>
));

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 80,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
  },
  skeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  skeletonCell: {
    alignItems: "center",
  },
  skeletonLabel: {
    marginTop: 16,
  },
});