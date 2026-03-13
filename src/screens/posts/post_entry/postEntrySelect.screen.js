import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "../../../components/typography/label.component";
import { goback, navigate } from "../../../navigation/navigate";
import { SafeArea } from "../../../components/safearea.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { theme } from "../../../infrastructure/theme";
import useRequest from "../../../../hooks/useRequest";
import { LoadingOverlay } from "../../../components/loading/loading.component";
import { useNavigation } from "@react-navigation/native";

const POST_TYPE = [
  {
    id: 1,
    label: "Forum",
    subtitle: "Ich möchte mich austauschen!",
    icon: "forum-outline",
  },
  {
    id: 2,
    label: "Angebot",
    subtitle: "Ich möchte etwas verkaufen!",
    icon: "storefront-outline",
  },

  {
    id: 3,
    label: "Gesuch",
    subtitle: "Ich möchte etwas kaufen!",
    icon: "text-box-search-outline",
  },
];

const SCREEN_WIDTH = Dimensions.get("window").width;
const BUTTON_SIZE = SCREEN_WIDTH / 2 - 40;

const PostEntrySelect = () => {
  const request = useRequest();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(null);
  const [hasPressed, setHasPressed] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const isMounted = useRef(true);

  const onReturn = () => {
    goback();
  };

  useEffect(() => {
    isMounted.current = true;

    if (!categories && selectedType === null) {
      const preloadCategries = async () => {
        try {
          setLoading(true);
          const responseForum = await request(
            "/v2/post/forum/categories",
            "get"
          );
          const responseMarketplace = await request(
            "/v2/post/marketplace/categories",
            "get"
          );
          if (
            responseMarketplace.success &&
            responseForum.success &&
            isMounted
          ) {
            console.log("SAVING CATEGORIES");
            setCategories([responseForum.data, responseMarketplace.data]);
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to preload categories: ", error);
        }
      };

      preloadCategries();
    } else if (selectedType !== null && categories) {
      setSelectedType(null);
      navigate("post-select-category", {
        type: selectedType,
        list: categories[selectedType.id === 1 ? 0 : 1],
      });
    }

    return () => {
      isMounted.current = false;
    };
  }, [selectedType, categories]);

  const TypeButton = ({ type }) => {
    const onSelect = async () => {
      setSelectedType(type);
    };

    return (
      <TouchableOpacity
        key={type.id}
        onPress={onSelect}
        // style={{ width: "100%" }}
      >
        <View style={styles.categoryButton}>
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              gap: 12,
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name={type.icon}
              size={50}
              color={theme.colors.icons.active}
            />
            <View style={{ flex: 1 }}>
              <Label size={20} weight={"bold"}>
                {type.label}
              </Label>
              <Label size={16} weight={"medium"} color={"#999"}>
                {type.subtitle}
              </Label>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {loading && selectedType !== null && <LoadingOverlay display={true} />}
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          {/* Header */}
          <View>
            <TouchableOpacity onPress={onReturn}>
              <View style={styles.backButton}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color="black"
                />
                <Label>Zurück zum Feed</Label>
              </View>
            </TouchableOpacity>
          </View>
          <View style={{marginTop: 10}}/>

          {/* Body */}
          <View style={styles.body}>
            <View style={{ gap: 10 }}>
              <Label size={25} weight={"bold"} style={{ textAlign: "center" }}>
                Was möchten Sie tun?
              </Label>
            </View>
            <View style={styles.typeButtonContainer}>
              {POST_TYPE.map((_type, index) => {
                return <TypeButton key={_type.id} type={_type} />;
              })}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default PostEntrySelect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  categoryButton: {
    width: "100%",
    backgroundColor: "white",
    flexDirection: "row",
    borderRadius: 50,
    padding: 16,
    paddingHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    elevation: 12,
  },
  typeButtonContainer: {
    gap: 20,
    // flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 50,
  },
});
