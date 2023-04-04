import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import {
  ApprovalBackground,
  ApprovalContainer,
  CompanyLogo,
  width,
} from "../../components/styles";
import { Label } from "../../components/typography/label.component";
import { companyLogo, config, loginBGImage } from "../../utils/constants";
import { AnimatedButton } from "../../components/animatedButton";
import { Camera, CameraType } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { UploadContext } from "../../services/upload/upload.context";
import { manipulateAsync } from "expo-image-manipulator";
import { navigate } from "../../navigation/navigate";
import { AuthContext } from "../../services/auth/auth.context";
import { PostCardUpload } from "../../components/postCardUpload";
import { LoadingOverlay } from "../../components/loading/loading.component";
import Background from "../../components/background/background.component";
import moment from "moment";
import * as SecureStore from "expo-secure-store";
import { TranslationContext } from "../../services/translation/translation.context";

const imageHeightRatio = width * (1 / 1);
const cardRatio = 2.125 / 3.375;

export const RequestApprovalScreen = () => {
  //useStates
  const [haveScrolled, setHaveScrolled] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [type, setType] = useState(CameraType.back);
  const [photo, setPhoto] = useState();

  //useRefs
  const scrollRef = useRef();
  const cameraRef = useRef();

  //context
  const { uploadCard, loading, setLoading, abortUpload } =
    useContext(UploadContext);
  const { user, setUser, setSkip } = useContext(AuthContext);
  const { i18n } = useContext(TranslationContext);

  const cameraContainerAnimated = useRef(
    new Animated.Value(width * cardRatio)
  ).current;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.flashScrollIndicators();
  }, []);

  const handleEdit = () => {
    navigate("AuthEditProfile");
  };

  const manipulateImage = async (image) => {
    const manipResult = await manipulateAsync(
      image.uri || image.localUri,
      [
        // { crop: { height: 100, originX: 10, originY: 90, width: 100 } },
        { resize: { height: 1000, width: 1000 } },
        { crop: { height: 550, originX: 100, originY: 220, width: 800 } },
      ],
      {
        compress: 0.5,
        format: "jpeg",
      }
    );

    setPhoto(manipResult);
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
            Linking.openURL(`tel:+971562050066`).catch((err) => {
              alert("Unable to call this number");
            });
          },
        },
        {
          text: i18n.t("skip-auth-msg.button-proceed"),
          onPress: () => {
            setSkip(1);
          },
        },
      ]
    );

    console.log(user);
  };

  const handleUpload = async () => {
    const formData = new FormData();

    formData.append("card_image", {
      name: new Date() + "_upload",
      uri: photo.uri,
      type: "image/jpeg",
    });
    formData.append("user_id", user.user_id);
    formData.append("app_id", config.APP_ID);
    formData.append("ip_address", user.ip_address);
    formData.append("device_id", user.device_id);
    formData.append("version", user.version);
    formData.append("platform", user.platform);
    formData.append("request_id", user.requestId);

    setLoading(true);
    uploadCard(formData);
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
      delay: 400,
      useNativeDriver: false,
    }).start(() => {
      setIsCameraOpen(false);
    });
  };

  const checkPermission = () => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await MediaLibrary.requestPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");

      if (hasCameraPermission === undefined) {
        <Text>Requesting camera permission</Text>;
      } else if (hasCameraPermission === false) {
        <Text>
          Permission for camera not granted. Please change this in phone
          settings.
        </Text>;
      }
    })();
  };

  const takePic = async () => {
    const options = {
      quality: 0.1,
      base64: false,
      exif: false,
      skipProcessing: true,
      fixOrientation: true,
    };

    const newPhoto = await cameraRef.current.takePictureAsync(options);
    manipulateImage(newPhoto);
    // setPhoto(newPhoto);
  };
  const cameraContainerAnimatedStyle = {
    height: cameraContainerAnimated,
  };

  const handleScroll = () => {
    setHaveScrolled(true);
  };

  const handleLogout = () => {
    navigate("Logout");
  };

  const handleUseImage = () => {
    setPhoto();
  };

  return (
    <>
      <Background>
        {
          <LoadingOverlay
            display={loading}
            showCancel={true}
            onCancel={() => handleCancel()}
          />
        }
        <SafeArea>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            persistentScrollbar={true}
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={0}
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
            {user.remarks != undefined &&
              user.remarks.trim() !== "" &&
              !user.submitCard && (
                <View style={{ padding: 20 }}>
                  <Label
                    weight={"regular"}
                    size={"subtitle"}
                    style={{ color: "red" }}
                  >
                    <Label size={"subtitle"} weight={"bold"}>
                      {`Rejected Previous Request `}
                    </Label>
                    ({moment(user.requestDate).format("l")}){"\n"}
                    <Label size={"subtitle"} weight={"bold"}>
                      Reason
                    </Label>
                    : {user.remarks}
                  </Label>
                </View>
              )}
            {user.submitCard ? (
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
                      onPress={async () => {
                        openCamera();
                        setTimeout(() => {
                          setIsCameraOpen(true);

                          checkPermission();
                        }, 100);
                      }}
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
                        source={photo !== undefined ? { uri: photo.uri } : {}}
                      >
                        <View
                          style={[
                            styles.cardOverlayContainer,
                            {
                              display: isCameraOpen
                                ? photo
                                  ? "none"
                                  : "flex"
                                : "none",
                            },
                          ]}
                        >
                          <View style={styles.cardOverlay}></View>
                        </View>
                        {!isCameraOpen ? (
                          <MaterialCommunityIcons
                            color={"#00000088"}
                            name="camera"
                            size={50}
                          />
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
                              {hasCameraPermission ? (
                                photo === undefined && (
                                  <Camera
                                    ratio="1:1"
                                    ref={cameraRef}
                                    style={styles.camera}
                                    type={type}
                                    // onCameraReady={async () => {}}
                                    onMountError={(err) => {
                                      alert(
                                        "There is an error while loading the camera."
                                      );
                                      closeCamera();
                                      setIsCameraOpen(false);
                                    }}
                                  ></Camera>
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
                                    setPhoto();
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
                                {photo === undefined ? (
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
                                    <TouchableHighlight onPress={closeCamera}>
                                      <View style={styles.cameraButtons}>
                                        <Label style={{ textAlign: "center" }}>
                                          {i18n.t("card-upload.use-image")}
                                        </Label>
                                      </View>
                                    </TouchableHighlight>
                                    <TouchableHighlight
                                      onPress={handleUseImage}
                                    >
                                      <View style={styles.cameraButtons}>
                                        <Label style={{ textAlign: "center" }}>
                                          {i18n.t("card-upload.retake")}
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
                    style={{ color: "#fff", textAlign: "center" }}
                    size={"heading"}
                    weight={"bold"}
                  >
                    {i18n.t("card-upload.heading")}
                  </Label>
                  <Spacer position={"top"} size={"medium"} />
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
                    <Spacer position={"top"} size={"large"} />
                    <View>
                      <Label
                        style={{
                          color: "#fff",
                          textAlign: "left",
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
                      }}
                    >
                      <TouchableOpacity onPress={handleEdit}>
                        {/* <Text style={{textDecorationLine}}></Text> */}
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
                      disabled={
                        photo !== undefined && !isCameraOpen ? false : true
                      }
                      buttonColorFrom={
                        photo !== undefined && !isCameraOpen
                          ? "rgba(230,135,0,1)"
                          : "#aaa"
                      }
                      buttonColorTo={"rgba(210,115,0,1)"}
                      iconName={"upload"}
                      iconSize={30}
                      textColor={"#fff"}
                      textSize={"title"}
                      textWeight={"regular"}
                      label={i18n.t("card-upload.upload")}
                    ></AnimatedButton>
                  </View>
                </View>
                {console.log("Member:", user)}
                {user.member ? (
                  <>
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
                  </>
                ) : (
                  <></>
                )}
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
