import * as Constants from "expo-constants";

export const isVersionOutdated = (latestVersion) => {
  const appVersion = Constants.default.expoConfig.version;

  const arrayA = appVersion.split(".");
  const arrayB = latestVersion.split(".");

  for (let i = 0; i < arrayA.length; i++) {
    console.log(`${arrayB[i]} - ${arrayA[i]}`);
    if (arrayB[i] > arrayA[i]) {
      return true;
    } else if (arrayB[i] < arrayA[i]) {
      return false;
    }
  }
  return false;
};
