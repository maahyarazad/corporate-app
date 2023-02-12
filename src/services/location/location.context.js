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

export const LocationContext = createContext();

export const LocationContextProvider = ({ children }) => {
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eventList, setEventList] = useState([]);
  const { user } = useContext(AuthContext);
  const { lang } = useContext(TranslationContext);

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

      if (user.user_id !== undefined) getEventsList();
    })();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const getEventsList = async () => {
    const data = {
      user_id: user.user_id,
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
