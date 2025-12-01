
# Tempo
# Members
Myles Guidry,
Bella Frederick,
Johnathan Bordenave,
Joshua Harris,
Evan Stegall

# About Our Software

Our goal is to create a mobile app that interfaces with users’ existing Spotify accounts to create and manage playlists tailored to the beats per minute (BPM) preferences of individual users. The app will be compatible with both IOS and Android devices. Users will have multiple options for playlist creation including setting maximum and minimum BPM preferences, adjusting BPM preferences in real-time using a slider, and allowing tracking of their device’s motion to adapt BPM to their steps taken per minute. This app is targeted at a wide range of audiences and could be used for a wide range of purposes however the main audience we will be focusing on tailoring the experience to is people who work out or go runs or walks regularly and enjoy listening to music to motivate them through their exercises.  

# Cloning the project
Download Visual Studio Code
https://code.visualstudio.com/download

Download Git Bash
https://git-scm.com/downloads

Run this command in the git bash terminal to clone the repository.
```sh
git clone https://github.com/evanstegall1/Tempo.git
```

# How to Run Dev and Test Environment


### Downloading Dependencies
# Dependencies used
"@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-native-community/slider": "^5.1.1",
    "@react-native-picker/picker": "2.11.1",
    "@react-navigation/bottom-tabs": "^7.4.0",
    "@react-navigation/elements": "^2.6.3",
    "@react-navigation/native": "^7.1.8",
    "expo": "~54.0.25",
    "expo-auth-session": "~7.0.9",
    "expo-constants": "~18.0.10",
    "expo-crypto": "~15.0.7",
    "expo-font": "~14.0.9",
    "expo-haptics": "~15.0.7",
    "expo-image": "~3.0.10",
    "expo-linking": "~8.0.8",
    "expo-router": "~6.0.14",
    "expo-secure-store": "~15.0.7",
    "expo-sensors": "~15.0.7",
    "expo-splash-screen": "~31.0.10",
    "expo-status-bar": "~3.0.8",
    "expo-symbols": "~1.0.7",
    "expo-system-ui": "~6.0.8",
    "expo-web-browser": "~15.0.9",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.5.1"

Verify you have Node.js installed using Terminal

```sh
node -v #v22.15.0
```

```sh
npm -v #v10.9.2
```

If not go to this site and download. 
https://nodejs.org/en/download

Install Expo-cli

```sh
npm install expo-cli
```

## Install Expo Go App

https://expo.dev/go

Go to this site to download Expo Go for your android or IOS device.

# Execution
!!! Ensure you are in the ./tempo Directory before running these commands. !!!


Last check for any missing dependencies:
```sh
\Tempo\tempo>npx expo install --check
```

Running the server:
```sh
\Tempo\tempo>npx expo start --clear
```

## Expo Go
Scan the QR code and it should link directly to the app.
Let the app load, click Login with Spotify and authenticate with your already existing Spotify account! Be sure to allow all permissions requested!

