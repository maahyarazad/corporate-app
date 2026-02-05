import "react-native-gesture-handler";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ThemeProvider } from "styled-components/native";
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
import UserProvider from "./src/services/user_v2/user.context";
import PostProvider from "./src/services/post/post.context";
import { Provider } from "react-redux";
import configureStore from "./redux/store/postStore";
import AlertContextProvider from "./src/services/alert/alert.context";

const store = configureStore();

export default function App() {
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.allowFontScaling = false;
  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.allowFontScaling = false;

  return (
    <>
      <ThemeProvider theme={theme}>
        <AlertContextProvider>
          <TranslationContextProvider>
            <AppContextProvider>
              <AuthContextProvider>
                {/* ^ to be removed*/}
                <AuthProvider>
                  <UserProvider>
                    <Provider store={store}>
                      <PostProvider>
                        {/* <UserContextProvider> */}
                        {/* ^ to be removed*/}
                        <UploadContextProvider>
                          <LocationContextProvider>
                            <SectionContextProvider>
                              <AppNavigation />
                            </SectionContextProvider>
                          </LocationContextProvider>
                        </UploadContextProvider>
                        {/* </UserContextProvider> */}
                      </PostProvider>
                    </Provider>
                  </UserProvider>
                </AuthProvider>
              </AuthContextProvider>
            </AppContextProvider>
          </TranslationContextProvider>
        </AlertContextProvider>
      </ThemeProvider>
      <ExpoStatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({});
