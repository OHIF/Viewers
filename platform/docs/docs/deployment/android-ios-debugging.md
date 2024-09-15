---
sidebar_position: 12
sidebar_label: Android & iOS Debugging
---

# Android & iOS Debugging for OHIF using Emulators

This guide covers how to debug the OHIF viewer on Android and iOS emulators using Chrome DevTools and Safari Web Inspector, respectively. You can use these tools to inspect elements, debug JavaScript, and view console logs for the web content running on the emulators.

## Android Emulator Setup with Android Studio

### Prerequisites:
- Install [Android Studio](https://developer.android.com/studio)
- Ensure you have a recent Android SDK and Emulator installed via Android Studio
- Google Chrome installed on your machine

### Steps to Run Android Emulator:

1. **Launch Android Studio:**
   - Open Android Studio and navigate to the **AVD Manager** (Android Virtual Device Manager).
   - You can access this by clicking on the **Device Manager** icon in the toolbar.

2. **Create a Virtual Device (if necessary):**
   - If you don’t have an existing virtual device, click **Create Virtual Device**.
   - Choose a device model (e.g., Pixel series) and click **Next**.
   - Select a system image with the required Android API version and click **Next**.
   - Finish the setup by clicking **Finish**.

3. **Start the Android Emulator:**
   - Once the device is created, click the **Play** button next to the virtual device to start the emulator.

4. **Open a Browser on the Emulator:**
   - Once the emulator is running, open the **Chrome** app on the virtual device.
   - If Chrome is not installed, you can use the built-in browser or download Chrome from the Play Store within the emulator.

5. **Debug Using Chrome DevTools:**
   - On your development machine, open Google Chrome.
   - Type `chrome://inspect` in the Chrome address bar and hit **Enter**.
   - You will see your Android device listed under **Remote Target**.
   - Click **Inspect** to open DevTools for the browser on the Android emulator.

6. **Start Debugging:**
   - You can now use Chrome DevTools to inspect elements, debug JavaScript, and view console logs directly from the emulator’s browser.

---

## iOS Emulator Setup with Xcode

### Prerequisites:
- Install [Xcode](https://developer.apple.com/xcode/) from the Mac App Store.
- Ensure you have the latest iOS SDK.
- Google Chrome installed on your machine.

### Steps to Run iOS Emulator:

1. **Launch Xcode:**
   - Open Xcode and navigate to **Xcode > Settings**.
   - Go to the **Platform** tab and ensure you have an iOS simulator installed for the version of iOS you need. If not you can do so using the + button.

2. **Start the iOS Simulator:**
   - Open Xcode and navigate to **Xcode > Open Developer Tools > Simulator**.
   - Select your device from the list of available simulators and click on it.

3. **Open a Browser on the Simulator:**
   - Once the simulator is running, the default **Safari** browser will be available.
   - To install **Chrome**, open Safari and search for "Chrome for iOS" in the App Store, then download and install it.

4. **Enable Web Inspector in Safari on the Simulator:**
   - Go to **Settings > Safari > Advanced** and toggle **Web Inspector** on.

5. **Connect Chrome DevTools to the iOS Simulator:**
   - On your development machine, open **Safari** on your Mac.
   - Click **Develop** in the menu bar and select your simulator under **Devices**.
   - You will see the web pages open on the iOS simulator. Select the page to open the inspector.

6. **Start Debugging:**
   - You can now use the Safari Web Inspector to inspect elements, debug JavaScript, and view logs for the web content on the iOS simulator.


---

## Video Tutorial

### Android Emulator Debugging

<iframe width="560" height="315" src="https://www.youtube.com/embed/1Q1J9Y1X1ZM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### iOS Emulator Debugging

<iframe width="560" height="315" src="https://www.youtube.com/embed/1Q1J9Y1X1ZM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```
