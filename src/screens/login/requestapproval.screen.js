import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { CompanyLogo, width } from "../../components/styles";
import { Label } from "../../components/typography/label.component";
import { companyLogo } from "../../utils/constants";
import { AnimatedButton } from "../../components/animatedButton";
import { CameraView, useCameraPermissions } from "expo-camera";
import { UploadContext } from "../../services/upload/upload.context";
import { manipulateAsync } from "expo-image-manipulator";
import { navigate } from "../../navigation/navigate";
import { PostCardUpload } from "../../components/postCardUpload";
import { LoadingOverlay } from "../../components/loading/loading.component";
import Background from "../../components/background/background.component";
import moment from "moment";
import { TranslationContext } from "../../services/translation/translation.context";
import useAuth from "../../../hooks/useAuth";
import useUser from "../../../hooks/useUser";
import { showToast } from "../../Toast";

const imageHeightRatio = width * (1 / 1);
const cardRatio = 2.125 / 3.375;

export const RequestApprovalScreen = () => {
  const [haveScrolled, setHaveScrolled] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photo, setPhoto] = useState(null);

  const [permission, requestPermission] = useCameraPermissions();

  const { signout, skipAuth, hasSubmit } = useAuth();
  const { userData, setUserData } = useUser();

  const scrollRef = useRef(null);
  const cameraRef = useRef(null);

  const { uploadCard, loading, setLoading, abortUpload } =
    useContext(UploadContext);
  const { i18n } = useContext(TranslationContext);

  const cameraContainerAnimated = useRef(
    new Animated.Value(width * cardRatio)
  ).current;

  useEffect(() => {
    if (scrollRef.current?.flashScrollIndicators) {
      scrollRef.current.flashScrollIndicators();
    }
  }, []);

  useEffect(() => {
    console.log("userData", userData);
  }, [hasSubmit, userData]);

  const handleEdit = () => {
    navigate("AuthEditProfile");
  };

  const manipulateImage = async (image) => {
    try {
      const manipResult = await manipulateAsync(
        image.uri || image.localUri,
        [
          { resize: { height: 1000, width: 1000 } },
          { crop: { height: 550, originX: 100, originY: 220, width: 800 } },
        ],
        {
          compress: 0.5,
          format: "jpeg",
        }
      );

      setPhoto(manipResult);
    } catch (error) {
      console.error("Failed to manipulate image:", error);
      showToast("error", "Image Error", "Failed to process the captured image.");
    }
  };

  const handleCancel = () => {
    abortUpload();
    setLoading(false);
  };

  const handleSkip = async () => {
    Alert.alert(
      i18n.t("skip-auth-msg.header"),
      i18n.t("skip-auth-msg.message"),
      [
        {
          text: i18n.t("skip-auth-msg.button-order"),
          onPress: () => {
            Linking.openURL(`tel:${encodeURIComponent("+971562050066")}`).catch(
              () => {
                alert("Unable to call this number");
              }
            );
          },
        },
        {
          text: i18n.t("skip-auth-msg.button-proceed"),
          onPress: () => {
            skipAuth();
          },
        },
      ]
    );
  };

  const handleUpload = async () => {
    try {
      if (!photo?.uri) {
        showToast("error", "No Image", "Please capture an image first.");
        return;
      }

      const formData = new FormData();
      formData.append("card_image", {
        name: `${Date.now()}_upload.jpg`,
        uri: photo.uri,
        type: "image/jpeg",
      });

      setLoading(true);
      uploadCard(formData);
    } catch (error) {
      console.error("Failed to upload: ", error);
      setLoading(false);
      showToast("error", "Upload Error", "Failed to upload image.");
    }
  };

  const openCamera = () => {
    Animated.spring(cameraContainerAnimated, {
      toValue: imageHeightRatio + 150,
      speed: 40,
      useNativeDriver: false,
    }).start();
  };

  const closeCamera = () => {
    Animated.spring(cameraContainerAnimated, {
      toValue: width * cardRatio,
      speed: 40,
      delay: 200,
      useNativeDriver: false,
    }).start(() => {
      setIsCameraOpen(false);
    });
  };

  const checkPermission = async () => {
    try {
      if (permission?.granted) {
        return true;
      }

      const response = await requestPermission();
      const granted = response?.granted === true;

      if (!granted) {
        showToast(
          "error",
          "Permission required",
          "Permission for camera not granted. Please change this in phone settings."
        );
      }

      return granted;
    } catch (error) {
      console.error("Camera permission error:", error);
      showToast(
        "error",
        "Permission Error",
        "Could not request camera permission."
      );
      return false;
    }
  };

  const handleOpenCamera = async () => {
    const granted = await checkPermission();
    if (!granted) return;

    setPhoto(null);
    setIsCameraOpen(true);
    openCamera();
  };

  const takePic = async () => {
    try {
      if (!cameraRef.current?.takePictureAsync) {
        showToast("error", "Camera Error", "Camera is not ready yet.");
        return;
      }

      const newPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.1,
        base64: false,
        exif: false,
        skipProcessing: true,
        shutteSound: false
      });

      await manipulateImage(newPhoto);
    } catch (error) {
      console.error("takePictureAsync error:", error);
      showToast("error", "Capture Error", "Failed to capture image.");
    }
  };

  const handleScroll = () => {
    setHaveScrolled(true);
  };

  const handleLogout = () => {
    signout();
    setUserData(null);
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  const cameraContainerAnimatedStyle = {
    height: cameraContainerAnimated,
  };

  return (
    <>
      <Background>
        <LoadingOverlay
          display={loading}
          showCancel={true}
          onCancel={handleCancel}
        />

        <SafeArea>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            persistentScrollbar={true}
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.headerView}>
              <CompanyLogo
                style={{
                  resizeMode: "contain",
                  marginBottom: 15,
                }}
                source={companyLogo}
              />
              <TouchableHighlight onPress={handleLogout}>
                <MaterialCommunityIcons
                  name="logout"
                  size={40}
                  color="orange"
                />
              </TouchableHighlight>
            </View>

            {userData?.remarks != undefined &&
              userData?.remarks.trim() !== "" &&
              !hasSubmit && (
                <View style={{ padding: 20 }}>
                  <Label
                    weight={"regular"}
                    size={"subtitle"}
                    style={{ color: "red" }}
                  >
                    <Label size={"subtitle"} weight={"bold"}>
                      {`Rejected Previous Request `}
                    </Label>
                    ({moment(userData.requestDate).format("DD.MMMM YYYY H:mm A")}
                    ){"\n"}
                    <Label size={"subtitle"} weight={"bold"}>
                      Reason
                    </Label>
                    : {userData.remarks}
                  </Label>

                  <TouchableOpacity onPress={handleEdit}>
                    <Label
                      style={{
                        textDecorationLine: "underline",
                        color: "white",
                      }}
                      size="title"
                    >
                      {i18n.t("card-upload.edit-profile")}
                    </Label>
                  </TouchableOpacity>
                </View>
              )}

            {hasSubmit ? (
              <PostCardUpload />
            ) : (
              <View>
                <View style={{ paddingHorizontal: 20 }}>
                  <Animated.View
                    style={[
                      styles.cardContainer,
                      {
                        margin: 0,
                        backgroundColor: isCameraOpen ? "#333" : "#aaa",
                      },
                      cameraContainerAnimatedStyle,
                    ]}
                  >
                    <TouchableHighlight
                      style={{
                        width: "100%",
                        height: "100%",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                      onPress={handleOpenCamera}
                      underlayColor={"#666"}
                      disabled={isCameraOpen}
                    >
                      <ImageBackground
                        style={[
                          styles.cardPreview,
                          {
                            justifyContent: isCameraOpen
                              ? "flex-start"
                              : "center",
                            height: isCameraOpen
                              ? photo
                                ? width * cardRatio
                                : imageHeightRatio
                              : width * cardRatio,
                          },
                        ]}
                        source={photo ? { uri: photo.uri } : undefined}
                      >
                        <View
                          style={[
                            styles.cardOverlayContainer,
                            {
                              display: isCameraOpen && !photo ? "flex" : "none",
                            },
                          ]}
                        >
                          <View style={styles.cardOverlay}></View>
                        </View>

                        {!isCameraOpen ? (
                          <>
                            <MaterialCommunityIcons
                              color={"#00000088"}
                              name="camera"
                              size={50}
                            />
                            <Label
                              size={"title"}
                              weight={"bold"}
                              style={{ color: "#00000088" }}
                            >
                              {i18n.t("card-upload.click-here").toUpperCase()}
                            </Label>
                          </>
                        ) : (
                          <>
                            <View
                              style={{
                                width: width,
                                height: photo
                                  ? width * cardRatio
                                  : imageHeightRatio,
                                zIndex: 1,
                              }}
                            >
                              {permission?.granted ? (
                                !photo && (
                                  <CameraView
                                    ref={cameraRef}
                                    style={styles.camera}
                                    facing="back"
                                    onMountError={(err) => {
                                      console.error("Camera mount error:", err);
                                      showToast(
                                        "error",
                                        "Camera Error",
                                        "There is an error while loading the camera."
                                      );
                                      closeCamera();
                                      setIsCameraOpen(false);
                                    }}
                                  />
                                )
                              ) : (
                                <View
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <Label
                                    style={{
                                      color: "white",
                                      textAlign: "center",
                                    }}
                                    size={"title"}
                                  >
                                    Needs camera permission.
                                  </Label>
                                  <Label
                                    style={{
                                      color: "white",
                                      textAlign: "center",
                                    }}
                                    size={"title"}
                                  >
                                    Please allow in your phone settings.
                                  </Label>
                                </View>
                              )}
                            </View>

                            <View
                              style={{
                                height: photo ? "100%" : 150,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  justifyContent: "center",
                                  alignItems: "center",
                                  position: "absolute",
                                  top: 0,
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    closeCamera();
                                    setPhoto(null);
                                  }}
                                >
                                  <SimpleLineIcons
                                    name="arrow-up"
                                    color={"white"}
                                    size={30}
                                  />
                                </Pressable>
                              </View>

                              <View
                                style={{
                                  width: width,
                                  alignItems: "center",
                                }}
                              >
                                {!photo ? (
                                  <TouchableHighlight
                                    onPress={takePic}
                                    style={styles.takeShotButton}
                                    underlayColor={"#000"}
                                  >
                                    <View style={styles.takeShotButton}>
                                      <MaterialCommunityIcons
                                        name="camera"
                                        size={35}
                                      />
                                    </View>
                                  </TouchableHighlight>
                                ) : (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      width: "100%",
                                      justifyContent: "space-evenly",
                                    }}
                                  >
                                    <TouchableHighlight onPress={handleRetake}>
                                      <View style={styles.cameraButtons}>
                                        <Label style={{ textAlign: "center" }}>
                                          {i18n.t("card-upload.retake")}
                                        </Label>
                                      </View>
                                    </TouchableHighlight>

                                    <TouchableHighlight onPress={closeCamera}>
                                      <View
                                        style={[
                                          styles.cameraButtons,
                                          {
                                            backgroundColor:
                                              "rgba(230,135,0,1)",
                                          },
                                        ]}
                                      >
                                        <Label
                                          style={{
                                            textAlign: "center",
                                            color: "white",
                                          }}
                                        >
                                          {i18n.t("card-upload.use-image")}
                                        </Label>
                                      </View>
                                    </TouchableHighlight>
                                  </View>
                                )}
                              </View>
                            </View>
                          </>
                        )}
                      </ImageBackground>
                    </TouchableHighlight>
                  </Animated.View>
                </View>

                <View
                  style={{
                    paddingHorizontal: 26,
                    paddingTop: 16,
                  }}
                >
                  <Label
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      marginBottom: 8,
                    }}
                    size={"heading"}
                    weight={"bold"}
                  >
                    {i18n.t("card-upload.heading")}
                  </Label>

                  <View
                    style={{
                      flex: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <Label
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        lineHeight: 30,
                      }}
                      size={"title"}
                      weight={"regular"}
                    >
                      {i18n.t("card-upload.text")}
                    </Label>

                    <View>
                      <Label
                        style={{
                          color: "#fff",
                          textAlign: "left",
                          marginBottom: 20,
                        }}
                        size={"body"}
                        weight={"regular"}
                      >
                        {i18n.t("card-upload.notice")}
                      </Label>
                    </View>

                    <Spacer position={"top"} size={"medium"} />

                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <TouchableOpacity onPress={handleEdit}>
                        <Label
                          style={{
                            textDecorationLine: "underline",
                            color: "white",
                          }}
                          size="title"
                        >
                          {i18n.t("card-upload.edit-profile")}
                        </Label>
                      </TouchableOpacity>
                    </View>

                    <Spacer position={"top"} size={"medium"} />

                    <AnimatedButton
                      onPress={handleUpload}
                      disabled={!photo || isCameraOpen}
                      buttonColorFrom={
                        photo && !isCameraOpen
                          ? "rgba(230,135,0,1)"
                          : "#aaa"
                      }
                      buttonColorTo={"rgba(210,115,0,1)"}
                      iconName={"upload"}
                      iconSize={30}
                      textColor={"#fff"}
                      textSize={"title"}
                      textWeight={"regular"}
                      label={i18n.t("submit")}
                    />
                  </View>
                </View>

                {userData && userData.member ? (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      marginTop: 15,
                    }}
                  >
                    <TouchableOpacity onPress={handleSkip}>
                      <Label
                        style={{
                          textDecorationLine: "underline",
                          color: "white",
                        }}
                        size="title"
                      >
                        {i18n.t("card-upload.skip")}
                      </Label>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
        </SafeArea>
      </Background>

      <StatusBar style="light" />
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    height: imageHeightRatio,
    margin: 20,
    backgroundColor: "#aaa",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    margin: 20,
    backgroundColor: "#333",
    borderRadius: 25,
    overflow: "hidden",
    flexDirection: "row",
  },
  addImage: {
    width: 500,
    height: 500,
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    width: width,
    height: imageHeightRatio,
    overflow: "hidden",
  },
  takeShotButton: {
    width: 70,
    height: 70,
    borderRadius: 70,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  cardPreview: {
    width: width,
    alignItems: "center",
  },
  cameraButtons: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    width: 120,
    alignItems: "center",
  },
  cardOverlayContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardOverlay: {
    width: "85%",
    height: `${85 * cardRatio}%`,
    borderColor: "rgba(0,0,0,0.3)",
    borderWidth: 10,
  },
  headerView: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
  },
});