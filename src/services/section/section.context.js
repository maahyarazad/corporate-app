import React, { useMemo, useState } from "react";

export const SectionContext = React.createContext();

export const SectionContextProvider = ({ children }) => {
  const [sectionTitle, setSectionTitle] = useState("");
  const [searchData, setSearchData] = useState({});

  // useContext has no bail-out: a fresh value object re-renders every consumer
  // whether or not the contents changed. The setters are stable across renders,
  // so this only changes when the data actually does.
  const value = useMemo(
    () => ({ sectionTitle, setSectionTitle, searchData, setSearchData }),
    [sectionTitle, searchData]
  );

  return (
    <SectionContext.Provider value={value}>{children}</SectionContext.Provider>
  );
};
