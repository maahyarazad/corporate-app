import React, { createContext, useEffect, useState } from "react";
import {
  getUserLocation,
  getLocations,
  getOneLocation,
  getCoords,
} from "./location.service";

export const LocationContext = createContext();

export const LocationContextProvider = ({ children }) => {
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      getUserLocation()
        .then((response) => {
          if (isMounted) setUserLocation(response);
        })
        .catch((err) => {
          console.log(err);
        });
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        getUserLocation,
        getLocations,
        getOneLocation,
        setCurrentMerchant,
        userLocation,
        currentMerchant,
        getCoords,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
