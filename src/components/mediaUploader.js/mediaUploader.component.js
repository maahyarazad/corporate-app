import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";
import { CacheImage } from "../cacheImage";
import { Label } from "../typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../infrastructure/theme";
import GalleryView from "react-native-image-viewing";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";
import { companyLogo } from "../../utils/constants";
import { CustomModal } from "../modal/customModal.component";
import { Video, Image as Picture } from "react-native-compressor";
import { ProgressBar } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { ResizeMode, Video as VideoPlayer } from "expo-av";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import VideoPlayerModal from "../videoPlayerModal/videoPlayerModal.component";

const PreviewPhoto = React.memo(({ onPress, item, removeItem }) => {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        key={item.uri}
        onLongPress={() => {
        //   console.log("long press");
        }}
      >
        <View style={styles.photoContainer}>
          <CacheImage
            uri={item.uri}
            style={{
              width: 100,
              height: 100,
            }}
            resizeMode="cover"
            local={true}
          />
          {item.type === "video" && (
            <View
              style={{
                position: "absolute",
              }}
            >
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={60}
                color="white"
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.floatButton}>
        <TouchableOpacity onPress={removeItem}>
          <View style={styles.removeButton}>
            <MaterialCommunityIcons
              name="minus-circle"
              size={25}
              color="red"
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const MediaUploader = ({ images, setImages, header = false, show = true }) => {
  const MAX_PHOTOS = 6;
  const [imageIndex, setImageIndex] = useState(0);
  const [mediaType, setMediaType] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [compressDone, setCompressDone] = useState(null);
  const [compressProgress, setCompressProgress] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - (images?.length ?? 0),
      });

      if (!result.canceled) {
        setCompressDone(false);
        const newImages = result.assets.map(async (item, index) => {
          const initialSize = await getImageFileSize(item.uri);
          // const resizedImage = await resizeImage(item.uri, {
          //   width: item.width,
          //   height: item.height,
          // })
          const resizedImage = await Picture.compress(item.uri);
          const finalSize = await getImageFileSize(resizedImage);
          //Compression Stats
        //   console.log(`----------------[${index + 1}]--------------`);
        //   console.log(`Initial Size[2]: ${initialSize.toFixed(2)}`);
        //   console.log(`Final Size: ${finalSize.toFixed(2)}`);
          const perc = (finalSize / initialSize) * 100;
        //   console.log(
        //     `% Reduction: (${finalSize > initialSize ? "UP" : "DOWN") ${(
        //       perc - 100
        //     ).toFixed(2)}%`
        //   );
        //   console.log(`-----------------------------------`);
          setCompressProgress(index / result.assets.length);
          return {
            uri: resizedImage,
            name: item.fileName,
            // type: item.type,
            type: "image/jpeg",
          };
        });

        const resolvedImages = await Promise.all(newImages);

        setImages([...resolvedImages, ...(images ?? [])]);
        setCompressDone(null);
        setCompressProgress(0);
        setOpenModal(false);
      }
    } catch (error) {
      console.log("Failed to pick image: ", error);
    } finally {
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });

      if (!result.canceled) {
        const newVideo = result.assets.map(async (item, index) => {
          if (item.duration / 1000 > 90) {
            alert("Video darf nicht länger als 90 Sekunden sein");
            return;
          }
        //   console.log("Starting Compression");
          setCompressDone(false);
          const r2 = await Video.compress(
            item.uri,
            {
              progressDivider: 2,
              downloadProgress: (progress) => {
                // console.log("downloadProgress: ", progress);
              },
            },
            (progress) => {
              setCompressProgress(progress);
            }
          );
          const thumbnail = await VideoThumbnails.getThumbnailAsync(r2, {
            time: 1000,
          });
          thumbnail.type = "video/mp4";
          thumbnail.name = item.fileName;
          thumbnail.videoURI = r2;

          setImages([thumbnail, ...(images ?? [])]);
          setCompressDone(null);
          setCompressProgress(0);
          setOpenModal(false);
        });
      }
    } catch (error) {
      console.log("Failed to pick video: ", error);
    } finally {
    }
  };

  const resizeImage = async (uri, dimensions) => {
    try {
      const FIXED_WIDTH = 720;
      const ratio = dimensions?.width / dimensions?.height;

      const actions = [
        {
          resize: {
            width: FIXED_WIDTH,
            height: FIXED_WIDTH / ratio,
          },
        },
      ];
      const options = {
        compress: 0,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      };

      const result = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        options
      );
      return result;
    } catch (error) {
      console.log("Failed to resize image: ", error);
    }
  };

  const getImageFileSize = async (uri) => {
    try {
      const file = await fetch(uri);
      const mb = 1000 ** 2;

      //Return file size in MB
      return file["_bodyBlob"]["_data"].size / mb;
    } catch (error) {
      console.log("Failed to get the size", error);
    }
  };

  const [galleryOpen, setGalleryOpen] = useState(false);

  const onGalleryOpen = () => {
    setGalleryOpen(true);
  };

  const onGalleryClose = () => {
    setGalleryOpen(false);
  };

  const onModalOpen = () => {
    setOpenModal(true);
  };

  const AddPhotos = () => {
    return (
      <View style={{ width: 100 }}>
        <TouchableOpacity onPress={onModalOpen}>
          <View style={styles.photoPlaceholder}>
            <MaterialCommunityIcons
              name="plus-circle"
              size={30}
              color="#ccc"
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const clearImages = () => {
    Alert.alert(
      "Bilder löschen",
      "Sind Sie sicher, dass Sie alle Bilder löschen möchten?",
      [
        {
          text: "abbrechen",
          onPress: () => {},
        },
        {
          text: "löschen",
          onPress: () => {
            setImages(null);
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderPreview = ({ item, index }) => {
    const openImage = () => {
      if (item.type === "video") {
        console.log("opening video", item.videoURI);
        setSelectedVideo(item.videoURI);
        return;
      }
      setImageIndex(index);
      onGalleryOpen();
    };

    const removeItem = () => {
      const newImages = [...images];
      newImages.splice(index, 1);
      //   setTempImages(newImages);
      setImages(newImages);
    };

    return (
      <>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {index === 0 && images.length < MAX_PHOTOS && (
            <View style={styles.addPhotoButton}>
              <TouchableOpacity onPress={openMediaSelector}>
                <MaterialCommunityIcons
                  name="plus-circle"
                  color={theme.colors.icons.active}
                  size={70}
                />
              </TouchableOpacity>
            </View>
          )}
          <PreviewPhoto
            onPress={openImage}
            removeItem={removeItem}
            item={item}
          />
        </View>
      </>
    );
  };

  const openMediaSelector = () => {
    console.log("checking images");
    let hasVideo = false;
    images.map((item, index) => {
      console.log(item);
      if (item.type === "video") {
        hasVideo = true;
        return;
      }
    });

    if (hasVideo) {
      pickImage();
    } else {
      setOpenModal(true);
    }
  };

  const handleVideoOnClose = () => {
    setSelectedVideo(null);
  };

  return (
    <>
      {show && (
        <View>
          <CustomModal showModal={openModal} type="none">
            <TouchableWithoutFeedback
              onPress={() => {
                setOpenModal(false);
              }}
            >
              <View
                style={{
                  backgroundColor: "#000000aa",
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                pointerEvents="auto"
              >
                <TouchableWithoutFeedback>
                  <View>
                    <View
                      style={{
                        backgroundColor: "white",
                        width: "80%",
                        borderRadius: 12,
                        padding: 30,
                        gap: 20,
                      }}
                    >
                      <View
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          flexDirection: "row",
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <TouchableWithoutFeedback onPress={pickImage}>
                            <View
                              style={[
                                styles.buttonStyle,
                                {
                                  backgroundColor: "palegreen",
                                },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="image-multiple"
                                size={50}
                              />
                              <Label
                                weight="bold"
                                style={{ textAlign: "center" }}
                              >
                                Bilder auswählen
                              </Label>
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                        <View
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <TouchableWithoutFeedback onPress={pickVideo}>
                            <View
                              style={[
                                styles.buttonStyle,
                                {
                                  backgroundColor: "lightblue",
                                },
                              ]}
                            >
                              <MaterialCommunityIcons name="video" size={50} />
                              <Label
                                weight="bold"
                                style={{ textAlign: "center" }}
                              >
                                Video auswählen
                              </Label>
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                      </View>
                      <View
                        style={{
                          position: "absolute",
                          right: -20,
                          top: -20,
                        }}
                      >
                        <View>
                          <TouchableWithoutFeedback
                            onPress={() => {
                              setOpenModal(false);
                            }}
                          >
                            <View
                              style={{
                                padding: 6,
                                backgroundColor: "white",
                                borderRadius: 50,
                                borderColor: "#ddd",
                                borderWidth: 2,
                              }}
                            >
                              <MaterialCommunityIcons
                                name="close"
                                size={30}
                                color="#ddd"
                              />
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                      </View>
                      <View>
                        <Label style={{ fontStyle: "italic" }}>
                          * Maximal 6 images pro Beitrag
                        </Label>
                        <Label style={{ fontStyle: "italic" }}>
                          * Maximal 1 Video pro Beitrag
                        </Label>
                        {compressDone != null && (
                          <View style={{ paddingTop: 10 }}>
                            <ProgressBar progress={compressProgress} />
                            <Label
                              style={{ textAlign: "center", paddingTop: 6 }}
                            >
                              {compressDone === false
                                ? "Komprimieren..."
                                : "Fertig"}
                            </Label>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </CustomModal>
          <VideoPlayerModal
            video={selectedVideo}
            onClose={handleVideoOnClose}
          />
          {header && (
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Label size="title" weight="bold">
                  Bilder / Video
                </Label>
                <Label size="title" weight="bold">
                  {images?.length > 0 ? `(${images.length})` : ""}
                </Label>
              </View>
              {images?.length > 0 && (
                <TouchableOpacity
                  onPress={clearImages}
                  disabled={!(images?.length > 0)}
                >
                  <View style={styles.clearButton}>
                    <MaterialCommunityIcons
                      name="close-thick"
                      size={16}
                      color="#b71540"
                    />
                    <Label
                      size={12}
                      weight="bold"
                      style={{ color: "#b71540" }}
                    >
                      Alles löschen
                    </Label>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {images && images?.length > 0 ? (
              <FlatList
                data={images}
                horizontal
                renderItem={renderPreview}
                keyExtractor={(item) => item.uri}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
                style={{ marginHorizontal: -20 }}
                showsHorizontalScrollIndicator={false}
              />
            ) : (
              <AddPhotos />
            )}
          </View>

          <GalleryView
            visible={galleryOpen}
            images={images}
            imageIndex={imageIndex}
            onRequestClose={onGalleryClose}
            animationType="fade"
            HeaderComponent={() => (
              <View
                style={{
                  width: "100%",
                  marginTop: 40,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                }}
              >
                <Image
                  width={100}
                  height={100}
                  source={companyLogo}
                  resizeMode="contain"
                  style={{ width: 100, height: 100 }}
                ></Image>

                <View style={{ top: 20 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onGalleryClose}
                  >
                    <View style={{ padding: 10 }}>
                      <MaterialCommunityIcons
                        name="close"
                        size={30}
                        color="#ddd"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </>
  );
};

export default MediaUploader;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  clearButton: {
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaeaea",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  addPhotoButton: { justifyContent: "center", paddingHorizontal: 10 },
  photoPlaceholder: {
    height: 100,
    width: 100,
    borderRadius: 20,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: { backgroundColor: "white", borderRadius: 50 },
  floatButton: { position: "absolute", top: 4, right: 4 },
  photoContainer: {
    height: 100,
    width: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  buttonStyle: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    width: "100%",
  },
});
