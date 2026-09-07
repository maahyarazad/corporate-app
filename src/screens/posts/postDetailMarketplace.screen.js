import {
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeArea } from "../../components/safearea.component";
import { goback } from "../../navigation/navigate";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "../../components/typography/label.component";
import SlideshowV2 from "../../components/slideshowV2.component";
import { useRoute } from "@react-navigation/native";
import { theme } from "../../infrastructure/theme";
import { Button } from "react-native-paper";
import moment from "moment";
import Avatar from "./avatar/avatar.component";
import CustomButton from "../../components/customButton.component";
import useRequest from "../../../hooks/useRequest";
import {
  carInclusions,
  motorcycleInclusions,
  realEstateOffers,
} from "../../utils/marketplaceConstants";
import { Skeleton } from "../../components/skeleton";
import PostPromptMessage from "./post_card/postPromptMessage/postPromptMessage.component";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../utils/listPerf";

const PostDetailMarketplace = ({ item }) => {
  const router = useRoute();
  const { post } = router.params;
  const [images, setImages] = useState(null);
  const request = useRequest();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // if (images) console.log(images);

    return () => {};
  }, [images]);

  useEffect(() => {
    // reorganize images

    //fetch marketplace post
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await request(
          `/v2/post/marketplace?id=${post.post_id}`,
          "GET"
        );

        if (response.success) {
          setState(response.data);
          if (response.data && response.data.images) {
            const _images = response.data.images.split(",");
            const media_types = response.data.types.split(",");

            setImages(
              _images.map((image, index) => {
                return { uri: image, type: media_types[index] };
              })
            );
          }
        }
      } catch (error) {
        console.log("Failed to get post", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    return () => {};
  }, []);

  const onReturn = () => {
    goback();
  };

  const handlePressSMS = () => {
    const phoneNumber = state.mobile;
    const link = `https://www.german-emirates-club.com/Marketplace/${state.id}`;
    const message = `Hello, I am interested in your post about the ${state.title}. Is it still available?\n\n${link}`;
    const url = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`; // The 'sms:' scheme followed by the phone number
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          console.log("Can't handle url: " + url);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.log("An error occurred", err));
  };

  const handlePressCall = () => {
    const phoneNumber = state.mobile;
    const url = `tel:${phoneNumber}`; // The 'sms:' scheme followed by the phone number
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          console.log("Can't handle url: " + url);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.log("An error occurred", err));
  };

  const ModeChip = () => {
    const [mode, setMode] = useState(state.mode);

    switch (mode) {
      case "offer":
        return (
          <View
            style={[
              styles.chip,
              { backgroundColor: "#f0932b", paddingHorizontal: 12 },
            ]}
          >
            <Label color="white" weight="bold">
              Angebote
            </Label>
          </View>
        );
      case "search":
        return (
          <View
            style={[
              styles.chip,
              { backgroundColor: "#436885", paddingHorizontal: 12 },
            ]}
          >
            <Label color="white" weight="bold">
              Gesuche
            </Label>
          </View>
        );
      default:
        return <></>;
    }
  };

  const Specifications = () => {
    switch (state.category_id) {
      case 2:
        //Car
        return (
          <>
            <View style={styles.container}>
              <View style={styles.header}>
                <Label weight="bold" size="title">
                  Spezifikation
                </Label>
              </View>
              <View>
                {car_fields.map((field, index) => {
                  return (
                    <DetailRow
                      key={index}
                      label={field.label}
                      value={
                        field.value === "month"
                          ? moment()
                              .month(state[field.value] - 1)
                              .format("MMMM")
                          : field.value === "milage_from"
                          ? `${Intl.NumberFormat("de-DE").format(
                              state[field.value]
                            )} ${
                              state.mode === "search"
                                ? "- " +
                                  Intl.NumberFormat("de-DE").format(
                                    state["milage_to"]
                                  )
                                : ""
                            }`
                          : field.value === "year_from" &&
                            state.mode === "search"
                          ? `${state["year_from"]} - ${state["year_to"]}`
                          : state[field.value]
                      }
                      count={index}
                      highlightColor="#eaeaea"
                      style={styles.detailRow}
                    />
                  );
                })}
              </View>
            </View>
            <View style={styles.container}>
              <View style={styles.header}>
                <Label weight="bold" size="title">
                  Ausstattung
                </Label>
              </View>
              <FlatList
                removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
                scrollEnabled={false}
                data={
                  state.art === "car"
                    ? carInclusions
                    : state.art === "bike"
                    ? motorcycleInclusions
                    : []
                }
                renderItem={RenderInclusions}
                keyExtractor={(item) => item.value.toString()}
                numColumns={2}
                initialNumToRender={40}
                windowSize={40}
              />
            </View>
          </>
        );

      case 5:
        // Property
        return (
          <>
            <View style={styles.container}>
              <View style={styles.header}>
                <Label size="title" weight="bold">
                  Spezifikation
                </Label>
              </View>
              <View>
                {property_fields.map((field, index) => {
                  return (
                    <DetailRow
                      key={index}
                      label={field.label}
                      value={
                        field.value === "offer"
                          ? realEstateOffers[
                              realEstateOffers.findIndex(
                                (offer) => offer.value === state[field.value]
                              )
                            ]?.label
                          : field.value === "living_space_start"
                          ? Intl.NumberFormat("de-DE").format(
                              state[field.value]
                            )
                          : state[field.value]
                      }
                      count={index}
                      highlightColor="#eaeaea"
                      style={styles.detailRow}
                    />
                  );
                })}
              </View>
            </View>
          </>
        );
      case 6:
        // Jobs
        return (
          <>
            <View style={styles.container}>
              <View style={styles.header}>
                <Label size="title" weight="bold">
                  Spezifikation
                </Label>
              </View>
              <View>
                {job_fields.map((field, index) => {
                  return (
                    <DetailRow
                      key={index}
                      label={field.label}
                      value={state[field.value]}
                      count={index}
                      highlightColor="#eaeaea"
                      style={styles.detailRow}
                    />
                  );
                })}
              </View>
            </View>
          </>
        );
    }
  };

  const RenderInclusions = ({ item }) => {
    return (
      <View style={styles.row}>
        <MaterialCommunityIcons
          name={state[item.value] > 0 ? "check-bold" : "close-thick"}
          color={state[item.value] > 0 ? "green" : "red"}
          size={20}
        />
        <Label>{item.label}</Label>
      </View>
    );
  };

  const PostSkeleton = () => {
    return (
      <>
        <View
          style={[
            {
              paddingHorizontal: 12,
              paddingVertical: 0,
              backgroundColor: "white",
              gap: 8,
            },
          ]}
        >
          {Array(5)
            .fill("")
            .map((item, index) => {
              return (
                <Skeleton
                  key={index}
                  width={index === 0 ? "50%" : "100%"}
                  height={15}
                  variant="circle"
                  opacityMax={0.4}
                  opacityMin={0.2}
                />
              );
            })}
        </View>
      </>
    );
  };

  const DetailRow = ({
    icon,
    label,
    children,
    value,
    count = 1,
    style,
    highlightColor = "#ccc",
  }) => {
    return (
      <View
        style={[
          styles.rows,
          {
            justifyContent: "space-between",
            backgroundColor: count % 2 > 0 ? "white" : highlightColor,
          },
          style,
        ]}
      >
        <View style={[styles.rowCenter, { flex: 1 }]}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={theme.colors.icons.active}
            />
          )}
          <Label>{label}</Label>
        </View>
        <View
          style={[
            styles.rowCenter,
            {
              flexWrap: "wrap",
              width: "50%",
              paddingVertical: 10,
              justifyContent: "flex-end",
            },
          ]}
        >
          {value ? <Label>{value}</Label> : <>{children}</>}
        </View>
      </View>
    );
  };

  return (
    <SafeArea style={styles.container}>
      {!loading ? (
        <>
          {!state ? (
            <View style={styles.unavailableContainer}>
              <MaterialCommunityIcons name="tools" size={80} />
              <Label weight="bold" size="h5">
                Page Unavailable
              </Label>
              <Button
                mode="contained"
                style={[styles.button, { backgroundColor: theme.colors.icons.active }]}
                onPress={goback}
              >
                <Label size={18} color="white" weight="bold">
                  Return
                </Label>
              </Button>
            </View>
          ) : (
            <>
              <ScrollView
                style={[
                  { gap: 8, backgroundColor: "#eee" },
                  Platform.OS === "android" && { margin: -14 },
                ]}
                contentContainerStyle={styles.contentContainer}
              >
                {router.params.showPrompt && (
                  <PostPromptMessage
                    severity={
                      state.approved === 1 || state.approved === 2
                        ? "info"
                        : state.approved === -1
                        ? "warning"
                        : null
                    }
                    title={
                      state.approved === 1 || state.approved === 2
                        ? "Dein Beitrag wurde genehmigt"
                        : state.approved === -1
                        ? "Dein Beitrag wurde abgelehnt"
                        : ""
                    }
                    message={
                      state.approved === 1 || state.approved === 2
                        ? "Herzlichen Glückwunsch! Dein Beitrag ist jetzt veröffentlicht und kann von allen gesehen werden."
                        : state.response_msg
                    }
                  />
                )}

                {/* Slideshow Section */}

                <View>
                  {images && state.mode === "offer" && (
                    <SlideshowV2 images={images} />
                  )}
                  <View style={[styles.container]}>
                    <View style={styles.rows}>
                      <ModeChip />
                    </View>
                    <Label weight="bold" size="heading">
                      {state.title}
                    </Label>
                    {state.price_from && (
                      <Label
                        weight="bold"
                        size={18}
                        color={theme.colors.icons.active}
                      >
                        {`${Intl.NumberFormat("de-DE").format(
                          state.price_from
                        )}${
                          state.mode === "search"
                            ? ` - ${Intl.NumberFormat("de-DE").format(
                                state.price_to
                              )}`
                            : ""
                        } AED`}
                      </Label>
                    )}
                  </View>
                </View>
                {state && <Specifications />}

                {/* Details Section */}
                <View style={[styles.container]}>
                  <View style={styles.header}>
                    <Label weight="bold" size="title">
                      Details
                    </Label>
                  </View>
                  <DetailRow
                    icon="format-list-bulleted-type"
                    label="Kategorie"
                    value={state.category}
                  ></DetailRow>
                  <DetailRow
                    icon="calendar"
                    label="Datum der Veröffentlichung"
                    value={moment(state.date_requested).format("LL")}
                  ></DetailRow>
                  <DetailRow icon="account" label="Gepostet von">
                    {/* Posted By */}
                    <View style={[styles.title]}>
                      {/* avatar */}
                      <Avatar size={30} image={state.prof_image} />
                      <View style={styles.authorContainer}>
                        <View style={styles.rowBetween}>
                          <View>
                            {/* name */}
                            <View style={styles.rows}>
                              <View>
                                <Label size="body" weight="bold">
                                  {`${state.first_name} ${state.last_name}`}
                                </Label>
                              </View>
                            </View>
                          </View>
                        </View>
                        {/* <Label size="caption" weight="regular">
                {data.category}
              </Label> */}
                        {/* Category */}
                      </View>
                    </View>
                  </DetailRow>
                </View>

                {/* Description Section */}
                <View style={[styles.container]}>
                  <View style={styles.header}>
                    <Label weight="bold" size="title">
                      Detaillierte Beschreibung
                    </Label>
                  </View>
                  <Label>{state.body}</Label>
                </View>
              </ScrollView>
              <View
                style={[
                  styles.rows,
                  { padding: 8, backgroundColor: "white", gap: 8 },
                ]}
              >
                <CustomButton
                  icon="message-outline"
                  onPress={handlePressSMS}
                  iconSize={18}
                  style={styles.customButton}
                  color={theme.colors.icons.active}
                  label="SMS"
                />
                <CustomButton
                  icon="phone"
                  onPress={handlePressCall}
                  iconSize={18}
                  style={styles.customButton}
                  color={theme.colors.icons.active}
                  label="Call"
                />
              </View>
            </>
          )}
        </>
      ) : (
        <View style={styles.box}>
          <PostSkeleton />
          <PostSkeleton />
        </View>
      )}
    </SafeArea>
  );
};

export default PostDetailMarketplace;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 18,
    backgroundColor: "white",
    gap: 8,
  },
  rows: {
    flexDirection: "row",
  },

  chip: {
    backgroundColor: "#ddd",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 50,
    // opacity: 0.6,
  },
  header: {
    borderBottomWidth: 2,
    paddingBottom: 4,
    borderColor: "#ccc",
    marginBottom: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  authorContainer: {
    justifyContent: "center",
    // flex: 1,
  },
  title: {
    // backgroundColor: "red",
    flexDirection: "row",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    // height: 40,
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    gap: 16,
  },
  detailRow: {
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    gap: 4,
  },
  contentContainer: {
    gap: 10,
  },
  rowBetween: {
    alignSelf: "stretch",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  customButton: {
    flex: 1,
  },
  box: {
    paddingVertical: 10,
    gap: 20,
  },
  button: {
    borderRadius: 8,
    marginTop: 16,
  },
});

const car_fields = [
  {
    label: "Maker",
    value: "label",
  },
  {
    label: "Modell",
    value: "class",
  },
  {
    label: "Kilometer",
    value: "milage_from",
  },
  {
    label: "Farbe",
    value: "color",
  },

  {
    label: "Baumonat",
    value: "month",
  },
  {
    label: "Baujahr",
    value: "year_from",
  },
];

const property_fields = [
  {
    label: "Angebot",
    value: "offer",
  },
  {
    label: "Ort/Region/Land",
    value: "place",
  },
  {
    label: "Stadtteil/Straße",
    value: "street",
  },
  {
    label: "Art",
    value: "art",
  },
  {
    label: "Schlafräume",
    value: "sleep_rooms_start",
  },
  {
    label: "Wohnfläche",
    value: "living_space_start",
  },
];

const job_fields = [
  {
    label: "Arbeitszeit",
    value: "time",
  },
  {
    label: "Ort",
    value: "place",
  },
  {
    label: "Bereich",
    value: "occupational_area",
  },
  {
    label: "Branche",
    value: "branche",
  },
  {
    label: "Erfahrung",
    value: "work_experience",
  },
];
// , occupational_area , position, time, work	work_experience, branche
