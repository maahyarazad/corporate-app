<br>

# GEC Mobile

This documentation will guide developers on how to proceed with development, building the app and publishing it to the stores (Appstore/Playstore).
It is written in **React Native** Framework using **Expo** Tools. 

<br>

## Table of Contents
- [GEC Mobile](#gec-mobile)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
    - [1. Install **Node.js**](#1-install-nodejs)
    - [2. Install **npm**](#2-install-npm)
    - [3. Install **yarn**](#3-install-yarn)
    - [4. Install **Watchman**](#4-install-watchman)
    - [5. Install **Expo CLI**](#5-install-expo-cli)
    - [6. Install **EAS CLI**](#6-install-eas-cli)
    - [7. Place the project inside your machine](#7-place-the-project-inside-your-machine)
  - [Development](#development)
    - [1. Install dependencies for the app](#1-install-dependencies-for-the-app)
    - [2. Login to EAS](#2-login-to-eas)
    - [3. Create a development build](#3-create-a-development-build)
    - [4. Installing the build](#4-installing-the-build)
    - [5. Preparing the App for the App Development Server](#5-preparing-the-app-for-the-app-development-server)
    - [6. Running the App Development Server](#6-running-the-app-development-server)
    - [7. Opening the App](#7-opening-the-app)
  - [Production](#production)
    - [1. Creating a Production Build](#1-creating-a-production-build)
    - [2. Submitting to App Publishers](#2-submitting-to-app-publishers)
    - [3. Publishing the new app version](#3-publishing-the-new-app-version)

<br>

## Prerequisites
      
  ### 1. Install **Node.js**

  Visit [Node.js website](https://nodejs.org/en/download) and download the appropriate installer for your system (macOS/Windows)

  ![Node.js download page](./docs/nodejs-download-page.png)

  To check the node version you currently have, run: 
  ```
  $ node -v
  ```

  The version that we are using is `v19.4.0`

  <br>

  ### 2. Install **npm**

  _The npm version that is currently used in GEC development is `9.2.0`_

  Check the npm version you currently have by using this in the terminal:

  ```
  $ npm -v
  ```

  \
  To install specific version (9.2.0) of **npm**:

  ```
  $ npm install -g npm@9.2.0
  ```

  For more information, [click here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

  <br>

 ### 3. Install **yarn**

  _The yarn version that is currently used in GEC development is `1.22.19`_

  Check the yarn version you currently have by using this in the terminal:

  ```
  $ yarn -v
  ```

  \
  To install specific version (1.22.19) of **yarn**:

  ```
  $ npm install -g yarn@1.22.19
  ```

  For more information, [click here](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)

  <br>

  ### 4. Install **Watchman**

  Watchman exists to watch files and record when they change. It can also trigger actions (such as rebuilding assets) when matching files change.

  ```
  $ brew update
  $ brew install watchman
  ```

  For more information, [click here](https://facebook.github.io/watchman/docs/install#buildinstall) 

  <br>

  ### 5. Install **Expo CLI**

  The Expo CLI is a command-line tool that is the primary interface between a developer and other Expo tools.
  
  To install Expo CLI globally, run:

  ```
  # npm install -g expo-cli
  ```

  <br>

  ### 6. Install **EAS CLI**

  EAS CLI is separate from the Expo CLI. While Expo CLI helps you create and develop your React Native apps using the Expo framework, EAS CLI is focused on the build, submit, and update processes using Expo's cloud services.

  ```
  $ npm install --g eas-cli
  ```

  <br>

  ### 7. Place the project inside your machine

  You can use Git to clone the repository into your specified location, or you can copy the whole project from an external storage (e.g. USB drive)

  <br>
  <br>

## Development

  ### 1. Install dependencies for the app 

  Open a terminal inside the project directory and run this command to install all of the dependencies required for your app:

  ```
  $ yarn
  ```

  ### 2. Login to EAS

  To be able to use EAS, you need to login first to the GEC Expo Account

  To login, run:

  ```
  $ eas login
  ```

  ### 3. Create a development build

  In your terminal, run:

  ```
  $ eas build --profile development  
  ```

  You can select between `All`, `Android` or `iOS`.

  While building, you can view other builds in [Expo](https://expo.dev/accounts/buenapublica/projects/GEC-Rewards/builds)

  ![Expo build lists](./docs/expo-builds.png)

  ### 4. Installing the build

  If the build is successful, a QR code will be displayed on the terminal to let you download the development build app.

  You can also get the QR code from the expo build:

  1. Go to [Expo Builds](https://expo.dev/accounts/buenapublica/projects/GEC-Rewards/builds)
  2. Select a development build from the list
  3. Press `install`
  4. Scan the QR Code displayed in the popup window.
   
  <br>
  
  ![Expo Development Build Download](./docs/expo-build-download.png)

  If the build is for Android, it will download the **APK** once scanned. 
  - For iOS, it will be installed automatically to your phone using iTunes once scanned.
  - For Android, you need to manually install the APK downloaded from Expo.

  ### 5. Preparing the App for the App Development Server

  Once the development-build app is installed in your mobile device, it's time to run the development server.

  - ### Local Web Server

    Run the **Local Node.js Server** using the machine's IP address stored in the .env file

    In the **App Project directory > src > utils > constant.js**, replace the value of `local_ip` with the ip address of the machine (computer/laptop).

    ```
    const local_ip = "192.168.50.7";
    ```

    You also need to uncomment the `BASE_URL` and `SERVER_HOST` for the Local Server and comment the other `BASE_URL` and `SERVER_HOST` for other servers (Dev & Prod) 

    ```
    BASE_URL: `http://${local_ip}:3300/v1/api/`, // Local
    SERVER_HOST: `http://${local_ip}:3300`, // Local
    ```

  - ### Development Web Server

    In the **App Project directory > src > utils > constant.js**, make sure the **Dev Node.js Server** is running and uncomment the `BASE_URL` and `SERVER_HOST` for the Dev Web Server and comment the other `BASE_URL` and `SERVER_HOST` for other servers (Local & Prod) 

    ```
    BASE_URL: "https://dev.german-emirates-club.com/api/v1/api", //Dev
    SERVER_HOST: "https://dev.german-emirates-club.com/api/", //Dev
    ```

  - ### Production Web Server

    In the **App Project directory > src > utils > constant.js**, make sure the **Production Node.js Server** is running and uncomment the `BASE_URL` and `SERVER_HOST` for the Dev Web Server and comment the other `BASE_URL` and `SERVER_HOST` for other servers (Local & Dev) 

    ```
    BASE_URL: "https://www.german-emirates-club.com/api/v1/api", //Prod
    SERVER_HOST: "https://www.german-emirates-club.com/api/", //Prod
    ```

  ### 6. Running the App Development Server

  In your project terminal, run:

  ```
  $ yarn start
  ```

  This will run the App Development Server & will display a QR code and menu in the terminal.

  ![Running the App Development Server](./docs/running-the-app-server.png)
  
  ### 7. Opening the App

  Scan the QR code from your mobile device and it will open the app automatically and load your development app.
  
  ![Opening the app](./docs/opening-the-app.png)

  You can now start editing the source code of the app and once the changes are saved, it will refresh the app automatically.

  <br>
  <br>

## Production

  ### 1. Creating a Production Build

  Submitting to the app publishers requires an app binary.

  Always increment the versions of the following properties below in the `app.json` file before building the Production App:
    
  - **expo.version**
  - **expo.ios.buildNumber**
  - **expo.android.versionCode**

  <br>

  ``` 
  {
    expo: {
      "version": "2.1.4", <-- Increment version number
      ...,
      "ios": {
        ...,
        "buildNumber": "38", <-- Increment iOS build number
        ...
      },
      "android": {
        "versionCode": 37, <- Increment Android build number
        ...
      },
      ...
    }
  }
  ```

  <br>


  To create a production build, run:

  ```
  $ eas build
  ```

  You can select between `All`, `Android` or `iOS`.

  ![Creating a Production Build](./docs/eas-build.png)

  After selecting an option, the code will be uploaded to the EAS server to be built on the cloud.

  ***Note: Sometimes the Terminal asks for the login credentials to the appstore connection, google play console or the OTP sent to the assigned mobile number.***

  Once the build has started, it will be shown in the [Expo Builds](https://expo.dev/accounts/buenapublica/projects/GEC-Rewards/builds) page.

  Since we are using EAS Free tier, build time can vary. If the build server is not full, building process starts immediately otherwise it will be queued.


  ### 2. Submitting to App Publishers

  Once the app finishes building, you can now submit it to the app publishers (Appstore/Playstore).

  To submit the app binaries, run:

  ```
  $ eas submit
  ```

  You can select between `All`, `Android` or `iOS`. Choose '**Select a build from EAS'** and then select the build of your choice.

  ![EAS Build Selection](./docs/eas-build-selection.png)

  ![EAS Build Selection](./docs/eas-build-selection-2.png)

  After selecting the build, submission process will now start. The respective app publishers will email you once submission is done.

  ### 3. Publishing the new app version

  - ### Appstore Connect (iOS) 

    1. Login to [Appstore Connect](https://appstoreconnect.apple.com) using the credentials provided to you.
   
       ![Appstore Connect Login Page](./docs/appstore-connect-login.png)

    2. Select **Apps** from the Menu
       
       ![Appstore Connect Menu](./docs/appstore-connect-menu.png)
    
    3. Select which app you need to update
       
       ![Appstore Connect App Selection](./docs/appstore-connect-apps.png)
      
    4. Add a new app version
       
       ![Appstore Connect App Page](./docs/appstore-connect-app-page.png)
      
    5. Type in the new app version

       ![Appstore Connect New App Version](./docs/appstore-connect-app-new-version.png) 

    6. Fill in the details

        Type in the necessary details for the update (Changelogs, promotional texts and etc..)

        Most of the time, we just update the '**What's new in this Version**' as changelogs

       ![Appstore Connect New App Details](./docs/appstore-connect-app-new-details.png) 

    7. Selecting a build
      
        Press '**Add Build**' Button

       ![Selecting a build in Appstore Connect](./docs/appstore-connect-app-add-build.png)
       
        Select which build to publish

       ![Selecting a build in Appstore Connect](./docs/appstore-connect-app-select-build.png)

        Press the '**Manage**' link in the status column

       ![Selecting a build in Appstore Connect](./docs/appstore-connect-app-manage-compliance.png)

        Select '**None of the algorithms mentioned above**' and press **Save**

       ![Selecting a build in Appstore Connect](./docs/appstore-connect-app-encryption-documentation.png)

        Save the App Version

       ![Selecting a build in Appstore Connect](./docs/appstore-connect-app-save.png)

    8. Requesting for app review

        Press '**Add for Review**'
   
       ![Selecting a build in Appstore Connect](./docs/appstore-connect-app-add-review.png)
    
        Press '**Submit to App Review**'

       ![Selecting a build in Appstore Connect](./docs/appstore-connect-app-submit-review.png)

       ***Note**: The review process can take up to **2 - 5** days.*

        If by chance the update got rejected, address it accordingly. If the app requires another build, follow these [steps](#1-create-a-production-build) again.

        If the app gets approved, it will automatically be published and all users who has the app will be updated (can propagate for up to 2 days)

  - ### Google Play Console (Android) 

    1. Login to [Google Accounts](https://accounts.google.com) using the credentials provided to you.
   
       ![Google Play Console Login Page](./docs/google-account-login.png)

    2. Go to [Google Play Console](https://play.google.com/console) and select '**Buena Publica FZE**'
   
       ![Google Play Console Developer Account](./docs/google-play-console-account.png)
    
    3. Select '**GEC Mobile**'
   
       ![Google Play Console Homepage](./docs/google-play-apps.png)
    
    4. Go to '**Production**' and create a '**new release**'
   
       ![Google Play Console Adding New Release](./docs/google-play-production.png)

    5. Press '**Add from library**' and select the version you want to publish

       ![Google Play Console Adding Build](./docs/google-play-select-build.png)
    
    6. After selecting the version, click '**Add to release**'

       ![Google Play Console Build List](./docs/google-play-build-list.png)    
    
    7. Type in the release notes (changelogs) and Click '**Next**'

        The release notes should be in this format:
        
        ```
        <en-US>
        Enter or paste your release notes for en-US here
        </en-US>
        ```

       ![Google Play Console Release Details](./docs/google-play-release-details.png)

        After going to the next page, click on '**Save**'

        it will then ask you to '**Go to Publishing overview?**', in which you need to press '**Go to overview**'

    8. Request for App Review
   
        This will be the final step to publish the app.

        Press '**Send 1 change for review**' and you just need to wait for the reviewing process to finish.

        If the `Managed publishing` setting is off for the Publishing overview, once the app is approved, it will then be rolled out to the playstore (propagation may take time)

       ![Google Play Console Release Details](./docs/google-play-publishing-overview.png)

  