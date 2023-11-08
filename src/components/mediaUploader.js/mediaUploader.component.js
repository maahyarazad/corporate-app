import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { LoadingOverlay } from "../loading/loading.component";

const PreviewPhoto = React.memo(({ onPress, item, removeItem }) => {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        key={item.uri}
        onLongPress={() => {
          console.log("long press");
        }}
      >
        <View style={styles.photoContainer}>
          <CacheImage
            uri={item.uri}
            style={{
              width: 100,
              height: 100,
            }}
            resizeMode={"cover"}
            local={true}
          />
        </View>
      </TouchableOpacity>
      <View style={styles.floatButton}>
        <TouchableOpacity onPress={removeItem}>
          <View style={styles.removeButton}>
            <MaterialCommunityIcons
              name="minus-circle"
              size={25}
              color={"red"}
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - (images?.length ?? 0),
      });

      if (!result.canceled) {
      }
      if (result) {
        const newImages = result.assets.map(async (item, index) => {
          const initialSize = await getImageFileSize(item.uri);
          const resizedImage = await resizeImage(item.uri, {
            width: item.width,
            height: item.height,
          });
          const finalSize = await getImageFileSize(resizedImage.uri);

          //Compression Stats
          console.log(`----------------[${index + 1}]--------------`);
          console.log(`Initial Size[2]: ${initialSize.toFixed(2)}`);
          console.log(`Final Size: ${finalSize.toFixed(2)}`);
          const perc = (finalSize / initialSize) * 100;
          console.log(
            `% Reduction: (${finalSize > initialSize ? "UP" : "DOWN"}) ${(
              perc - 100
            ).toFixed(2)}%`
          );
          console.log(`-----------------------------------`);

          return {
            uri: resizedImage.uri,
            name: item.fileName,
            type: item.type,
          };
        });

        const resolvedImages = await Promise.all(newImages);

        setImages([...resolvedImages, ...(images ?? [])]);
      }
    } catch (error) {
      console.log("Failed to pick image: ", error);
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
      console.error("Failed to resize image: ", error);
    }
  };

  const getImageFileSize = async (uri) => {
    try {
      const file = await fetch(uri);
      const mb = 1000 ** 2;

      //Return file size in MB
      return file["_bodyBlob"]["_data"].size / mb;
    } catch (error) {
      console.error("Failed to get the size", error);
    }
  };

  const [galleryOpen, setGalleryOpen] = useState(false);

  const onGalleryOpen = () => {
    setGalleryOpen(true);
  };

  const onGalleryClose = () => {
    setGalleryOpen(false);
  };

  const AddPhotos = () => {
    return (
      <View style={{ width: 100 }}>
        <TouchableOpacity onPress={pickImage}>
          <View style={styles.photoPlaceholder}>
            <MaterialCommunityIcons
              name="image-plus"
              size={30}
              color={"#ccc"}
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
              <TouchableOpacity onPress={pickImage}>
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

  return (
    <>
      {show && (
        <>
          {header && (
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Label size={"title"} weight={"bold"}>
                  Bilder
                </Label>
                <Label size={"title"} weight={"bold"}>
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
                      name={"close-thick"}
                      size={16}
                      color={"#b71540"}
                    />
                    <Label
                      size={12}
                      weight={"bold"}
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
          />
        </>
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
});
