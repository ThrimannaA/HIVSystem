# HIV Prevention App

This is an [**Expo**](https://expo.dev) project for HIV Risk Awareness and Prevention.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go app](https://expo.dev/client) on your mobile device (for testing)

### Step 1: Install Dependencies

```sh
# Using npm
npm install

# OR using Yarn
yarn install
```

### Step 2: Start the Development Server

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

This will start the Expo development server. You'll see a QR code in your terminal.

### Step 3: Run the App

#### On Physical Device
Scan the QR code with:
- **iOS**: Camera app or Expo Go app
- **Android**: Expo Go app

#### On Emulator/Simulator
- **Android**: Press `a` in the terminal to open in Android Emulator
- **iOS**: Press `i` in the terminal to open in iOS Simulator (macOS only)
- **Web**: Press `w` in the terminal to open in web browser

### Available Scripts

```sh
# Start development server
npm start

# Start for Android
npm run android

# Start for iOS  
npm run ios

# Start for web
npm run web

# Run tests
npm test

# Run linting
npm run lint
```

## Building for Production

To create production builds, you can use [EAS Build](https://docs.expo.dev/build/introduction/):

```sh
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Learn More

- [Expo Documentation](https://docs.expo.dev/) - learn about Expo features and APIs
- [React Native Documentation](https://reactnative.dev/) - learn about React Native
- [Expo Go](https://expo.dev/client) - preview your app on your device
