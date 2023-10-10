import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
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
    id: 0,
    label: "Forum",
    icon: "forum-outline",
  },
  {
    id: 1,
    label: "Marketplatz",
    icon: "storefront-outline",
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

  const onReturn = () => {
    goback();
  };

  useEffect(() => {
    let isMounted = true;

    if (!categories && selectedType === null) {
      const preloadCategries = async () => {
        try {
          setLoading(true);
          const responseForum = await request(
            "/v2/post/form/categories",
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
            setCategories([responseForum.data, responseMarketplace.data]);
            setLoading(false);
          }
        } catch (error) {}
      };

      preloadCategries();
    } else if (selectedType !== null && categories) {
      setSelectedType(null);
      navigation.removeListener();
      navigate("post-select-category", {
        type: selectedType,
        list: categories[selectedType.id],
      });
    }

    return () => {
      isMounted = false;
    };
  }, [selectedType, categories]);

  const TypeButton = ({ type }) => {
    const onSelect = async () => {
      setSelectedType(type);
    };

    return (
      <TouchableOpacity key={type.id} onPress={onSelect}>
        <View style={styles.categoryButton}>
          <MaterialCommunityIcons
            name={type.icon}
            size={60}
            color={theme.colors.icons.active}
          />
          <Label size={20} weight={"bold"}>
            {type.label}
          </Label>
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
                <Label>Back to Feed</Label>
              </View>
            </TouchableOpacity>
          </View>
          <Spacer size={"large"} position={"top"} />

          {/* Body */}
          <View style={styles.body}>
            <View style={{ gap: 10 }}>
              <Label size={25} weight={"bold"} style={{ textAlign: "center" }}>
                What would you like to do?
              </Label>
              <Label
                size={"subtitle"}
                weight={"medium"}
                style={{ textAlign: "center" }}
              >
                Talk about something or sell something?
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
  },
  categoryButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 16,
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
    flexDirection: "row",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 50,
  },
});
