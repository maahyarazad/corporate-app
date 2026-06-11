import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";
import { showToast } from "../../Toast";
import { showConfirm } from "../confirmDialog.component";
import { CacheImage } from "../cacheImage";
import { Label } from "../typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../infrastructure/theme";
import GalleryView from "react-native-image-viewing";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as FileSystem from "expo-file-system"; // FIX: replaced fragile _bodyBlob hack
import { companyLogo } from "../../utils/constants";
import { CustomModal } from "../modal/customModal.component";
import { Video, Image as Picture } from "react-native-compressor";
import { ProgressBar } from "react-native-paper";
import VideoPlayerModal from "../videoPlayerModal/videoPlayerModal.component";

// ─────────────────────────────────────────────
// PreviewPhoto
// FIX: moved key prop to outer View (was on TouchableOpacity — wrong place)
// ─────────────────────────────────────────────
const PreviewPhoto = React.memo(({ onPress, item, removeItem }) => {
  return (
    <View key={item.uri}>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.photoContainer}>
          <CacheImage
            uri={item.uri}
            style={{ width: 100, height: 100 }}
            resizeMode="cover"
            local={true}
          />
          {item.type === "video" && (
            <View style={{ position: "absolute" }}>
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
            <MaterialCommunityIcons name="minus-circle" size={25} color="red" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────
// MediaUploader
// ─────────────────────────────────────────────
const MediaUploader = ({ images, setImages, header = false, show = true }) => {
  const MAX_PHOTOS = 6;
  const [imageIndex, setImageIndex] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [compressDone, setCompressDone] = useState(null); // null=hidden, false=compressing, true=done
  const [compressProgress, setCompressProgress] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // ─────────────────────────────────────────
  // FIX: replaced fragile _bodyBlob._data.size hack with expo-file-system
  // ─────────────────────────────────────────
  const getImageFileSize = async (uri) => {
    try {
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      const mb = 1000 ** 2;
      return (info.size ?? 0) / mb;
    } catch (error) {
      console.log("Failed to get file size:", error);
      return 0;
    }
  };

  // ─────────────────────────────────────────
  // pickImage — gallery
  // FIX: was incorrectly using launchCameraAsync
  // ─────────────────────────────────────────
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
        setCompressProgress(0);

        const newImages = await Promise.all(
          result.assets.map(async (item, index) => {
            const initialSize = await getImageFileSize(item.uri);
            const resizedUri = await Picture.compress(item.uri);
            const finalSize = await getImageFileSize(resizedUri);

            setCompressProgress((index + 1) / result.assets.length);

            return {
              uri: resizedUri,
              name: item.fileName,
              type: "image/jpeg",
            };
          })
        );

        setImages([...newImages, ...(images ?? [])]);
        setCompressDone(true);

        // Short delay so user sees "Fertig" before modal closes
        setTimeout(() => {
          setCompressDone(null);
          setCompressProgress(0);
          setOpenModal(false);
        }, 800);
      }
    } catch (error) {
      console.log("Failed to pick image:", error);
      setCompressDone(null);
      setCompressProgress(0);
    }
  };

  // ─────────────────────────────────────────
  // pickVideo — gallery
  // FIX 1: was using launchCameraAsync
  // FIX 2: Promise.all was never awaited (map returned array of Promises)
  // FIX 3: duration check was after setCompressDone — now before
  // FIX 4: setImages was inside map callback, now called after resolution
  // ─────────────────────────────────────────
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });

      if (!result.canceled) {
        // Only allow one video at a time
        const item = result.assets[0];

        // FIX: duration check BEFORE starting compression
        if (item.duration / 1000 > 90) {
          showToast("error", "Fehler", "Video darf nicht länger als 90 Sekunden sein");
          return;
        }

        setCompressDone(false);
        setCompressProgress(0);

        const compressedUri = await Video.compress(
          item.uri,
          { progressDivider: 2 },
          (progress) => {
            setCompressProgress(progress);
          }
        );

        const thumbnail = await VideoThumbnails.getThumbnailAsync(compressedUri, {
          time: 1000,
        });

        const videoEntry = {
          ...thumbnail,
          type: "video",
          name: item.fileName,
          videoURI: compressedUri,
        };

        // FIX: setImages called once after full resolution, not inside map
        setImages([videoEntry, ...(images ?? [])]);
        setCompressDone(true);

        setTimeout(() => {
          setCompressDone(null);
          setCompressProgress(0);
          setOpenModal(false);
        }, 800);
      }
    } catch (error) {
      console.log("Failed to pick video:", error);
      setCompressDone(null);
      setCompressProgress(0);
    }
  };

  // ─────────────────────────────────────────
  // clearImages
  // FIX: was setting null — now sets [] to avoid downstream .map() crashes
  // ─────────────────────────────────────────
  const clearImages = () => {
    showConfirm({
      title: "Bilder löschen",
      message: "Sind Sie sicher, dass Sie alle Bilder löschen möchten?",
      confirmText: "löschen",
      cancelText: "abbrechen",
      destructive: true,
      onConfirm: () => setImages([]),
    });
  };

  // ─────────────────────────────────────────
  // openMediaSelector
  // FIX: logic was inverted — now correctly shows modal when no video exists
  //      and goes straight to pickImage when a video is already selected
  // ─────────────────────────────────────────
  const openMediaSelector = () => {
    const hasVideo = (images ?? []).some((item) => item.type === "video");
    if (hasVideo) {
      // Already have a video — only allow adding more images
      pickImage();
    } else {
      // No video yet — show full modal (image or video choice)
      setOpenModal(true);
    }
  };

  // ─────────────────────────────────────────
  // renderPreview
  // FIX: removed unnecessary empty fragment wrapper
  // ─────────────────────────────────────────
  const renderPreview = ({ item, index }) => {
    const openImage = () => {
      if (item.type === "video") {
        setSelectedVideo(item.videoURI);
        return;
      }
      setImageIndex(index);
      setGalleryOpen(true);
    };

    const removeItem = () => {
      const newImages = [...(images ?? [])];
      newImages.splice(index, 1);
      setImages(newImages);
    };

    return (
      <View style={{ flexDirection: "row", gap: 8 }}>
        {index === 0 && (images?.length ?? 0) < MAX_PHOTOS && (
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
        <PreviewPhoto onPress={openImage} removeItem={removeItem} item={item} />
      </View>
    );
  };

  const AddPhotos = () => (
    <View style={{ width: 100 }}>
      <TouchableOpacity onPress={() => setOpenModal(true)}>
        <View style={styles.photoPlaceholder}>
          <MaterialCommunityIcons name="plus-circle" size={30} color="#ccc" />
        </View>
      </TouchableOpacity>
    </View>
  );

  const handleVideoOnClose = () => setSelectedVideo(null);

  return (
    <>
      {show && (
        <View>
          {/* ── Media Picker Modal ── */}
          <CustomModal showModal={openModal} type="none">
            <TouchableWithoutFeedback onPress={() => setOpenModal(false)}>
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
                        {/* Pick Images */}
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                          <TouchableWithoutFeedback onPress={pickImage}>
                            <View style={[styles.buttonStyle, { backgroundColor: "palegreen" }]}>
                              <MaterialCommunityIcons name="image-multiple" size={50} />
                              <Label weight="bold" style={{ textAlign: "center" }}>
                                Bilder auswählen
                              </Label>
                            </View>
                          </TouchableWithoutFeedback>
                        </View>

                        {/* Pick Video */}
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                          <TouchableWithoutFeedback onPress={pickVideo}>
                            <View style={[styles.buttonStyle, { backgroundColor: "lightblue" }]}>
                              <MaterialCommunityIcons name="video" size={50} />
                              <Label weight="bold" style={{ textAlign: "center" }}>
                                Video auswählen
                              </Label>
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                      </View>

                      {/* Close button */}
                      <View style={{ position: "absolute", right: -20, top: -20 }}>
                        <TouchableWithoutFeedback onPress={() => setOpenModal(false)}>
                          <View
                            style={{
                              padding: 6,
                              backgroundColor: "white",
                              borderRadius: 50,
                              borderColor: "#ddd",
                              borderWidth: 2,
                            }}
                          >
                            <MaterialCommunityIcons name="close" size={30} color="#ddd" />
                          </View>
                        </TouchableWithoutFeedback>
                      </View>

                      {/* Info + Progress */}
                      <View>
                        <Label style={{ fontStyle: "italic" }}>
                          * Maximal 6 Bilder pro Beitrag
                        </Label>
                        <Label style={{ fontStyle: "italic" }}>
                          * Maximal 1 Video pro Beitrag
                        </Label>
                        {compressDone != null && (
                          <View style={{ paddingTop: 10 }}>
                            <ProgressBar progress={compressProgress} />
                            <Label style={{ textAlign: "center", paddingTop: 6 }}>
                              {compressDone === false ? "Komprimieren..." : "Fertig"}
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

          {/* ── Video Player Modal ── */}
          <VideoPlayerModal video={selectedVideo} onClose={handleVideoOnClose} />

          {/* ── Header ── */}
          {header && (
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Label size="title" weight="bold">
                  Bilder / Video
                </Label>
                <Label size="title" weight="bold">
                  {(images?.length ?? 0) > 0 ? `(${images.length})` : ""}
                </Label>
              </View>
              {(images?.length ?? 0) > 0 && (
                <TouchableOpacity onPress={clearImages}>
                  <View style={styles.clearButton}>
                    <MaterialCommunityIcons name="close-thick" size={16} color="#b71540" />
                    <Label size={12} weight="bold" style={{ color: "#b71540" }}>
                      Alles löschen
                    </Label>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Media List ── */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(images?.length ?? 0) > 0 ? (
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

          {/* ── Gallery Viewer ── */}
          <GalleryView
            visible={galleryOpen}
            images={images ?? []}
            imageIndex={imageIndex}
            onRequestClose={() => setGalleryOpen(false)}
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
                  source={companyLogo}
                  resizeMode="contain"
                  style={{ width: 100, height: 100 }}
                />
                <View style={{ top: 20 }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setGalleryOpen(false)}>
                    <View style={{ padding: 10 }}>
                      <MaterialCommunityIcons name="close" size={30} color="#ddd" />
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
