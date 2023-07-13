import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/auth.context";
import { EventService } from "../event/event.service";
import { TranslationContext } from "../translation/translation.context";
import {
  getUserLocation,
  getLocations,
  getOneLocation,
  getCoords,
} from "./location.service";
import useUser from "../../../hooks/useUser";

export const LocationContext = createContext();

export const LocationContextProvider = ({ children }) => {
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eventList, setEventList] = useState([]);
  // const { user } = useContext(AuthContext);
  const { userData } = useUser();
  const { lang } = useContext(TranslationContext);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      console.log("LOCATION");
      getUserLocation()
        .then((response) => {
          if (isMounted) setUserLocation(response);
          console.log("CORRECT"), response;
        })
        .catch((err) => {
          console.error("Location Context Error: ", err);
        });

      if (userData.user_id !== undefined) getEventsList();
    })();

    return () => {
      isMounted = false;
    };
  }, [userData]);

  const getEventsList = async () => {
    const data = {
      user_id: userData.user_id,
      lang,
    };
    console.log("CHECKING EVENTS LIST");
    const response = await EventService.getEvents(data);
    setEventList(response.data);
  };

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
        eventList,
        getEventsList,
        setEventList,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
