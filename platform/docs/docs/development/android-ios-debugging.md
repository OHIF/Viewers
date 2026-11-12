---
sidebar_position: 12
sidebar_label: Android & iOS Debugging
title: Android & iOS Debugging
summary: Comprehensive guide for debugging OHIF Viewer on mobile devices, covering setup of Android and iOS emulators, step-by-step instructions for connecting Chrome DevTools and Safari Web Inspector, and video tutorials demonstrating the debugging workflow.
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
   - Open Android Studio and create a new project if you don't already have one.
   - Once your IDE opens up, click on the **Device Manager** icon in the right-side toolbar.

2. **Create a Virtual Device (if necessary):**
   - If you don’t have an existing virtual device, click **Create Virtual Device**.
   - Choose a device model (e.g., Pixel series) and click **Next**.
   - Select a system image with the required Android API version and click **Next**.
   - Finish the setup by clicking **Finish**.

3. **Start the Android Emulator:**
   - Once the device is created, click the **Play** button next to the virtual device to start the emulator.

4. **Open a Browser on the Emulator:**
   - Once the emulator is running, open the **Chrome** app on the virtual device.
   - Navigate to the OHIF Viewer URL to view the application. The URL will be 10.0.2.2:3000, you can read more about it [here](https://developer.android.com/studio/run/emulator-networking).

5. **Debug Using Chrome DevTools:**
   - On your development machine, open Google Chrome.
   - Type `chrome://inspect` in the Chrome address bar and hit **Enter**.
   - You will see your Android device listed under **Remote Target**.
   - Click **Inspect** to open DevTools for the browser on the Android emulator.

6. **Happy Debugging!:**
   - You can now use Chrome DevTools to inspect elements, debug JavaScript, and view console logs directly from the emulator’s browser.

### Video Tutorial

<iframe width="560" height="315" src="https://www.youtube.com/embed/wYa10-djAfI" title="OHIF Debugging Guide for Android" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

---

## iOS Emulator Setup with Xcode

### Prerequisites:
- Install [Xcode](https://developer.apple.com/xcode/) from the Mac App Store.
- Ensure you have the latest iOS SDK.

### Steps to Run iOS Emulator:

1. **Launch Xcode:**
   - Open Xcode and navigate to **Xcode > Settings**.
   - Go to the **Platform** tab and ensure you have an iOS simulator installed for the version of iOS you need. If not you can do so using the + button.

2. **Start the iOS Simulator:**
   - Open Xcode and navigate to **Xcode > Open Developer Tools > Simulator**.
   - Select your device from the list of available simulators and click on it.

3. **Open a Browser on the Simulator:**
   - Run the **Safari** browser

4. **Connect Safari DevTools to the iOS Simulator:**
   - On your development machine, open **Safari** on your Mac.
   - Click **Develop** in the menu bar and select your simulator under **Devices**.
   - You will see the web pages open on the iOS simulator. Select the page to open the inspector.

5. **Happy Debugging!:**
   - You can now use the Safari Web Inspector to inspect elements, debug JavaScript, and view logs for the OHIF Viewer on the iOS simulator.

### Video Tutorial

<iframe width="560" height="315" src="https://www.youtube.com/embed/_M5e6RFl36E" title="OHIF Debugging Guide for iOS" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
