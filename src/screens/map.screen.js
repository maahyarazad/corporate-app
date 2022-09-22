import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { TouchableRipple } from "react-native-paper";
import styled from "styled-components";
import { LoadingOverlay } from "../components/loading/loading.component";
import { SafeArea } from "../components/safearea.component";
import { Label } from "../components/typography/label.component";
import { AuthContext } from "../services/auth/auth.context";
import { LocationContext } from "../services/location/location.context";

export const StyledMap = styled(MapView)`
  flex: 1;
`;

export const MyLocationMarkerRange = styled(View)`
  width: 150px;
  height: 150px;
  background-color: #0e89ff33;
  border-radius: 150px;
  align-items: center;
  justify-content: center;
`;

export const MyLocationMarker = styled(View)`
  width: 25px;
  height: 25px;
  background-color: #0e89ff;
  border-radius: 25px;
  border-width: 3px;
  border-color: white;
`;

export const MapScreen = ({ navigation }) => {
  const { getUserLocation, getCoords, userLocation } =
    useContext(LocationContext);
  const [myLocation, setMyLocation] = useState(null);
  const [partnerLocations, setPartnerLocations] = useState();
  const mapRef = useRef();

  useEffect(() => {
    let isMounted = true;
    getCoords(100).then((response) => {
      if (isMounted) setPartnerLocations(response);
    });

    getUserLocation()
      .then((response) => {
        if (isMounted) setMyLocation(response.coords);
      })
      .catch((err) => {
        console.log("error: ", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCenter = () => {
    mapRef != undefined &&
      mapRef.current.animateCamera(
        {
          center: {
            latitude: myLocation?.latitude,
            longitude: myLocation?.longitude,
          },
          altitude: 10000,
          zoom: 15,
          pitch: 1,
          heading: 1,
        },
        { duration: 500 }
      );
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  if (!userLocation) {
    return (
      <SafeArea
        style={{
          flex: 1,
          top: 0,
          width: "100%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <View>
            <TouchableRipple
              onPress={navigateBack}
              style={{ borderRadius: 25, padding: 10, overflow: "hidden" }}
              rippleColor={"#444"}
            >
              <Ionicons name={"arrow-back"} size={35} />
            </TouchableRipple>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <Label style={{ textAlign: "center" }}>
            You need to enable Location in your device settings.
          </Label>
        </View>
      </SafeArea>
    );
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        {/* {myLocation && <Text>{myLocation.latitude}</Text>}*/}
        {/* <StyledMap></StyledMap>  */}
        {/* <MapView z></MapView> */}
        {partnerLocations != undefined && myLocation != undefined ? (
          <MapView
            style={{ flex: 1 }}
            provider={"google"}
            // minZoomLevel={14} // default => 0
            // maxZoomLevel={15} // default => 20
            ref={mapRef}
            // zoomEnabled={false}
            camera={{
              center: {
                latitude: myLocation?.latitude,
                longitude: myLocation?.longitude,
              },
              altitude: 10000,
              zoom: 15,
              pitch: 1,
              heading: 1,
            }}

            // region={{
            //   latitude: myLocation?.latitude,
            //   longitude: myLocation?.longitude,
            //   latitudeDelta: 0,
            //   longitudeDelta: 0,
            // }}
          >
            <Marker
              tracksViewChanges={false}
              coordinate={{
                longitude: myLocation?.longitude,
                latitude: myLocation?.latitude,
              }}
            >
              <MyLocationMarkerRange>
                <MyLocationMarker></MyLocationMarker>
              </MyLocationMarkerRange>
            </Marker>
            {partnerLocations.map((location, index) => (
              <Marker
                key={index}
                tracksViewChanges={false}
                coordinate={{
                  longitude: location.lng,
                  latitude: location.lat,
                }}
              />
            ))}
          </MapView>
        ) : (
          <LoadingOverlay display={true} />
        )}
        <SafeArea
          style={{
            flex: 1,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 16,
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <View>
              <TouchableRipple
                onPress={navigateBack}
                style={{ borderRadius: 25, padding: 10, overflow: "hidden" }}
                rippleColor={"#444"}
              >
                <Ionicons name={"arrow-back"} size={35} />
              </TouchableRipple>
            </View>
            <View
              style={{
                alignItems: "flex-end",
                alignSelf: "flex-end",
              }}
            >
              <TouchableRipple
                onPress={handleCenter}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 70,
                  padding: 10,
                  backgroundColor: "white",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 30,
                  elevation: 15,
                  shadowColor: "black",
                  shadowOpacity: 0.4,
                  shadowRadius: 5,
                  shadowOffset: { width: 1, height: 1 },
                }}
                rippleColor={"#444"}
              >
                <MaterialIcons
                  name={"my-location"}
                  size={35}
                  color={"#0e89ff"}
                />
              </TouchableRipple>
            </View>
          </View>
        </SafeArea>
      </View>
    </>
  );
};
