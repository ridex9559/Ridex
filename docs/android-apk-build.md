# 📱 RIDEX — Mobile App & Android Standalone APK Build Guide

This guide documents how to run RIDEX on **iOS via Expo Go** (with restored native Apple Maps) and build/install the **Standalone Android APK** directly on physical Android phones.

---

## 🚀 Quick Launch (Using `start.bat`)

At the root of the project, run:open logs 
```cmd
start.bat
```
You can choose from the interactive menu:
1. **Option 1**: Start Expo Metro (Expo Go for iOS / Android with clean cache).
2. **Option 2**: Start Expo with Native Dev Client.
3. **Option 3**: Build Standalone Android Release APK (`assembleRelease`).
4. **Option 4**: Clean Android Gradle build cache.

---

## 🍎 Objective B: iOS Native Apple Maps in Expo Go

### 1. Root Cause of Previous Regression
- **Tile Overlay Interference**: `<NativeUrlTile shouldReplaceMapContent={true}>` was previously rendered unconditionally on iOS. In Apple Maps (`MKMapView`), setting `shouldReplaceMapContent={true}` stripped away all native vector road layers.
- **Google JSON Styles on Apple Maps**: Google Maps JSON styling (`customMapStyle`) is incompatible with `MKMapView`.

### 2. Restored Configuration
- **Provider**: Uses `PROVIDER_DEFAULT` (Native Apple Maps `MKMapView`).
- **Dark Mode**: Configured cleanly via `userInterfaceStyle="dark"`.
- **API Key**: None required! Apple Maps works natively out of the box in Expo Go without any API key or billing setup.
- **Overlays**: Custom raster tile layers are strictly restricted to Android (`Platform.OS === 'android'`).

### 3. How to Run on iPhone (Expo Go)
```bash
cd ridex-mobile
npx expo start --clear
```
Scan the QR code using the iPhone Camera app or inside the Expo Go app.

---

## 🤖 Objective A: Standalone Android Release APK

### 1. Why Standalone APK is Preferred on Android
- In **Expo Go**, the native package is `host.exp.exponent`. Google Maps API keys restricted to `com.ridex.app` or SHA-1 fingerprints fail authentication in Expo Go (resulting in a blank canvas).
- The **Standalone Android APK** runs natively under `package="com.ridex.app"` with the dedicated Maps SDK for Android, foreground location services, and full offline caching.

### 2. Standalone Build Prerequisites
- **Node.js**: v18+ / v20+
- **Java JDK**: JDK 17 (e.g., `C:\Program Files\Java\jdk-17`)
- **Android SDK**: `C:\Users\<username>\AppData\Local\Android\Sdk` with `platform-tools` and `build-tools 35.0.0` or `36.0.0`.

### 3. Build Command (Release APK)
```powershell
cd ridex-mobile\android
$env:NODE_OPTIONS="--max_old_space_size=4096"
$env:JAVA_HOME="C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat assembleRelease --no-daemon
```

### 4. Output Location
The compiled release APK is located at:
```text
ridex-mobile/android/app/build/outputs/apk/release/app-release.apk
```

### 5. Install Directly to Android Phone via USB (ADB)
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your phone to your PC via USB.
3. Verify connection:
   ```bash
   adb devices
   ```
4. Install the APK:
   ```bash
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

*(Alternatively, transfer `app-release.apk` to your phone via Google Drive, WhatsApp, or USB cable and tap to install).*

---

## 🗺️ Map Architecture Summary

| Platform / Mode | Native Provider | Map Engine | Dark Mode Mechanism | API Key Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **iOS (Expo Go)** | `PROVIDER_DEFAULT` | Apple Maps (`MKMapView`) | `userInterfaceStyle="dark"` | None (Native iOS framework) |
| **Android (APK)** | `PROVIDER_GOOGLE` / Default | Google Maps SDK for Android | `customMapStyle={DARK_MAP_STYLE}` | `com.ridex.app` API Key in `AndroidManifest.xml` |
| **Android (Expo Go fallback)** | `PROVIDER_DEFAULT` + Tile | CartoDB Dark Matter / Esri | Raster Tile Layer (`UrlTile`) | None (Universal Web/Raster Tiles) |
| **Web Browser** | Leaflet / MapLibre Bridge | OpenStreetMap / CartoDB | Tile URL CSS Invert / Dark Tiles | None |

---

## 🏍️ Preserved RIDEX Features Verified

- [x] **Route Planning**: Start marker, destination marker, waypoint list, waypoint reordering, and routing polyline.
- [x] **Location Picker**: Interactive coordinate tapping and address resolution.
- [x] **Group Rides & Live Radar**: Ride creation, join via 6-digit Ride ID, rider avatar markers, group radar distance list.
- [x] **Separation Warning & SOS**: High-contrast tactical alerts with emergency dialer integration.
- [x] **Tactical Stealth Dashboard**: High-contrast OLED dark styling (#080A0F background, #FF6B00 accents).
