import "react-native-gesture-handler";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { ThemeProvider } from "styled-components";
import { theme } from "./src/infrastructure/theme";
import { SectionContextProvider } from "./src/services/section/section.context";
import { AuthContextProvider } from "./src/services/auth/auth.context";
import { LocationContextProvider } from "./src/services/location/location.context";
import { AppNavigation } from "./navigation";
import { UploadContextProvider } from "./src/services/upload/upload.context";
import { UserContextProvider } from "./src/services/user/user.context";

export default function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <AuthContextProvider>
          <UserContextProvider>
            <UploadContextProvider>
              <LocationContextProvider>
                <SectionContextProvider>
                  <AppNavigation />
                </SectionContextProvider>
              </LocationContextProvider>
            </UploadContextProvider>
          </UserContextProvider>
        </AuthContextProvider>
      </ThemeProvider>
      <ExpoStatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({});
