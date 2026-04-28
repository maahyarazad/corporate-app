import * as Constants from "expo-constants";

export const isVersionOutdated = (latestVersion) => {
    const appVersion = Constants.default.expoConfig.version;
    //     console.log('=====appVersion==================================================')
    // console.log('=====appVersion==================================================')
    // console.log(appVersion)

  const arrayA = appVersion.split(".").map(Number);   // "3.0.4" → [3, 0, 4]
  const arrayB = latestVersion.split(".").map(Number); // "3.0.3" → [3, 0, 3]



    // console.log('=====arrayA==================================================')
    // console.log('=====arrayA==================================================')
    // console.log(arrayA)
    // console.log('=====arrayB==================================================')
    // console.log('=====arrayB==================================================')
    // console.log(arrayB)
    


  for (let i = 0; i < Math.max(arrayA.length, arrayB.length); i++) {
    const a = arrayA[i] ?? 0;
    const b = arrayB[i] ?? 0;

    if (b > a) return true;  // server version is newer → outdated
    if (b < a) return false; // app version is newer → not outdated
  }



  return false; // same version
};