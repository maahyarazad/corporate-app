import React, { useEffect, useState } from "react";

export const SectionContext = React.createContext();

export const SectionContextProvider = ({ children }) => {
  const [sectionTitle, setSectionTitle] = useState("");
  const [searchData, setSearchData] = useState({});

  return (
    <SectionContext.Provider
      value={{ sectionTitle, setSectionTitle, searchData, setSearchData }}
    >
      {children}
    </SectionContext.Provider>
  );
};
