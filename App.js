import "react-native-gesture-handler";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ThemeProvider } from "styled-components";
import { theme } from "./src/infrastructure/theme";
import { SectionContextProvider } from "./src/services/section/section.context";
import { AuthContextProvider } from "./src/services/auth/auth.context";
import { LocationContextProvider } from "./src/services/location/location.context";
import { AppNavigation } from "./navigation";
import { UploadContextProvider } from "./src/services/upload/upload.context";
import { UserContextProvider } from "./src/services/user/user.context";
import { TranslationContextProvider } from "./src/services/translation/translation.context";
import { AppContextProvider } from "./src/services/app/app.context";
import AuthProvider from "./src/services/auth_v2/auth.context";

export default function App() {
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.allowFontScaling = false;
  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.allowFontScaling = false;

  return (
    <>
      <ThemeProvider theme={theme}>
        <TranslationContextProvider>
          <AppContextProvider>
            <AuthContextProvider>
              <AuthProvider>
                <UserContextProvider>
                  <UploadContextProvider>
                    <LocationContextProvider>
                      <SectionContextProvider>
                        <AppNavigation />
                      </SectionContextProvider>
                    </LocationContextProvider>
                  </UploadContextProvider>
                </UserContextProvider>
              </AuthProvider>
            </AuthContextProvider>
          </AppContextProvider>
        </TranslationContextProvider>
      </ThemeProvider>
      <ExpoStatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({});
