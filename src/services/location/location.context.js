import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
import { ignoreCancel } from "../../utils/cancellation";

export const LocationContext = createContext();

export const LocationContextProvider = ({ children }) => {
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eventList, setEventList] = useState([]);
  // const { user } = useContext(AuthContext);
  const { userData } = useUser();
  const { lang } = useContext(TranslationContext);

  useEffect(() => {
    const controller = new AbortController();
    // expo-location can't be aborted, so the position lookup runs to completion
    // regardless; this only stops it writing state afterwards.
    let cancelled = false;

    (async () => {
    //   console.log("LOCATION");
      if (userData) {
        getUserLocation()
          .then((response) => {
            if (!cancelled) setUserLocation(response);
            // console.log("CORRECT"), response;
          })
          .catch((err) => {
            console.log("Location Context Error: ", err);
          });

        getEventsList(controller.signal).catch(ignoreCancel);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [userData]);

  // useCallback so the context value below can actually stay stable; without it
  // this function is rebuilt every render and the memo never hits.
  const getEventsList = useCallback(async (signal) => {
    const data = {
      user_id: userData.user_id,
      lang,
    };
    // console.log("CHECKING EVENTS LIST");
    const response = await EventService.getEvents(data, signal);
    setEventList(response.data);
  }, [userData, lang]);

  // getUserLocation / getLocations / getOneLocation / getCoords are module
  // imports and setCurrentMerchant / setEventList are state setters, so all six
  // are stable and only the three state values plus getEventsList can move.
  const value = useMemo(
    () => ({
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
    }),
    [userLocation, currentMerchant, eventList, getEventsList]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
