import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { config } from "../../utils/constants";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState();

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
