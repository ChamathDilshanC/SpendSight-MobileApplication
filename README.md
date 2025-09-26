# SpendSight – Mobile Application

> 🚀 **Modern Personal Finance Tracker** | Built with Expo + React Native, Firebase Auth/Firestore/Storage, and clean service architecture.

<div align="center">

## 🎬 Experience the App

<!-- Demo Video Section -->
<table>
<tr>
## 🚀 Get Started

<div align="center">
  
### Experience SpendSight Today
*Track expenses effortlessly • Beautiful UI • Completely Free*

<br>

<table>
<tr>
<td align="center" width="50%">

#### 🎥 **Live Demo**
*See SpendSight in action*

<a href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID" target="_blank">
  <img src="https://img.shields.io/badge/🎬_Watch_Demo-Coming_Soon-FF6B6B?style=for-the-badge&logo=youtube&logoColor=white&labelColor=2C2C2C&border_radius=12" alt="Watch Demo" />
</a>

*Complete walkthrough • Feature showcase*

</td>
<td align="center" width="50%">

#### 📱 **Download Now**
*Ready to install • No signup required*

<a href="https://drive.google.com/drive/u/0/folders/1Bm_By3p1FqOwMuCM-gya8ath9r6oHH2W" target="_blank">
  <img src="https://img.shields.io/badge/📦_Download_APK-Available_Now-4ECDC4?style=for-the-badge&logo=android&logoColor=white&labelColor=2C2C2C" alt="Download APK" />
</a>

*Direct download • Instant access*

</td>
</tr>
</table>

</div>

---

<div align="center">

### 📲 **Latest Version - SpendSight v1.0**
*Scan QR code for instant download*

<br>

<img width="200" height="200" alt="QR Code - Download SpendSight" src="https://github.com/user-attachments/assets/a775698e-d4d2-4ef6-9b18-7e6675a843cd" style="border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);" />

<br><br>

```
📱 Scan with your camera app to download instantly
🔒 Safe & secure APK from Google Drive  
⚡ No registration needed - Get started immediately
```

**Latest Update:** `SpendSightExpenseTrackerApp-V1.apk`

</div>

---

<!-- Quick Stats -->
<table>
<tr>
<td align="center">
<img src="https://img.shields.io/badge/Platform-Android-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Platform">
</td>
<td align="center">
<img src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square" alt="Version">
</td>
<td align="center">
<img src="https://img.shields.io/badge/Size-~125MB-green?style=flat-square" alt="Size">
</td>
<td align="center">
<img src="https://img.shields.io/badge/Status-Preview-orange?style=flat-square" alt="Status">
</td>
</tr>
</table>

</div>

## 📲 Installation Guide

<details>
<summary><strong>🔽 Click to expand installation steps</strong></summary>

### **Step 1: Download**
- Click the download button above
- File will open in Google Drive
- Download the `.apk` file to your device

### **Step 2: Enable Installation**
**For Android 8.0+:**
- Go to `Settings` → `Apps & notifications` → `Special app access` → `Install unknown apps`
- Select your browser → Enable `Allow from this source`

**For older Android versions:**
- Go to `Settings` → `Security` → Enable `Unknown sources`

### **Step 3: Install**
- Open the downloaded APK file
- Tap `Install` when prompted
- Wait for installation to complete

### **Step 4: Launch**
- Find SpendSight in your app drawer
- Open and enjoy! 🎉

</details>

---

## 🛡️ System Requirements

<div align="center">
<table>
<tr>
<th>Requirement</th>
<th>Minimum</th>
<th>Recommended</th>
</tr>
<tr>
<td><strong>Android Version</strong></td>
<td>6.0 (API 23)</td>
<td>9.0+ (API 28+)</td>
</tr>
<tr>
<td><strong>Storage Space</strong></td>
<td>50MB</td>
<td>100MB</td>
</tr>
<tr>
<td><strong>RAM</strong></td>
<td>2GB</td>
<td>4GB+</td>
</tr>
<tr>
<td><strong>Internet</strong></td>
<td colspan="2">Required for authentication & sync</td>
</tr>
</table>
</div>

## ⚠️ Important Notes

<div align="center">

> **🔒 Security Notice**
> 
> This APK is digitally signed and safe to install. Your antivirus may show a warning because it's not from Google Play Store.

> **🚀 Preview Build**
> 
> This is a preview version for testing. Features may be limited and some functionality is still in development.

> **📱 Compatibility**
> 
> Currently available for **Android only**. iOS version coming soon!

</div>

---

## Overview

SpendSight helps you track expenses, incomes, accounts, and financial goals in a simple, modern mobile app. It features secure authentication (Email/Google/Apple), real‑time data with Firebase, charts, and a polished UI with Expo Router and NativeWind.

## Key Features

- Authentication
  - Email/password signup and login (Firebase Auth)
  - Social logins: Google; Apple Sign‑In on iOS
  - Session persistence and robust error handling
- Accounts & Categories
  - Default account/category bootstrapping for new users
  - Create, update, delete, and subscribe with real‑time updates
  - Filter/search categories (income/expense)
- Transactions
  - Create, edit, delete transactions with account balance updates
  - Date range filters, recent transactions feed, and real‑time listeners
- Goals
  - Create and track goals; pay toward and complete goals
  - Progress calculation and due‑soon helpers
- Profile Image
  - Upload to Firebase Storage, update Firestore, and display in UI
  - Camera/Gallery picker, progress, error handling, and caching
- Dashboard & Charts
  - Overview dashboard with charts (react-native-chart-kit)
- Smooth UX
  - Expo + React Native 0.81, Expo Router, Moti animations, NativeWind styling

## Tech Stack

- App: React Native 0.81 + Expo 54 + TypeScript
- Navigation: Expo Router, React Navigation
- UI/Style: NativeWind (Tailwind CSS), Expo components, Moti
- Data: Firebase Auth, Firestore, Storage
- Build: EAS build profiles for development/preview/production (APK)

Dependencies highlights (see `package.json`):

- firebase ^12, expo-image-picker, react-native-reanimated, react-native-svg, chart kit, google-signin, apple-auth (iOS)

## Project Structure

```
app/                         # Expo Router routes
components/                  # Reusable UI components
context/                     # Firebase auth context etc.
services/                    # Account/Category/Transaction/Goal services
types/                       # TypeScript interfaces
utils/                       # Helpers (navigation, session)
firebase.ts                  # Firebase initialization
eas.json                     # EAS build profiles
```

## Firebase Setup

The app expects an existing Firebase project. Core config lives in `firebase.ts`:

- Auth (Email/Password, Google; Apple on iOS)
- Firestore for user data and domain models
- Storage for profile images

Checklist:

1. Enable Authentication providers
   - Email/Password
   - Google: configure OAuth client IDs and SHA‑1 for Android; set `webClientId` where used in auth context
   - Apple (iOS): enable provider and configure in Apple Developer and Firebase
2. Firestore
   - Create database; set security rules according to your needs
3. Storage
   - Ensure bucket exists; apply suitable security rules (see `storage.rules`)

Sensitive keys are currently in `firebase.ts`. For production, move secrets to secure env handling.

## Services Architecture

Domain‑focused services under `services/` provide clean APIs and real‑time subscriptions:

- AccountService: initialize defaults, CRUD, balances, subscribe
- CategoryService: defaults, CRUD, search, filters
- TransactionService: create/update/delete with balance effects, queries, subscribe
- GoalService: CRUD, payTowardGoal, completion, progress helpers

See `services/README.md` for function lists and usage examples.

## Profile Image Feature

- Component: `components/ProfileImagePicker.tsx`
- Service: `services/UserProfileService.ts`
- Storage path: `profile-images/profile_{userId}_{timestamp}.jpg`
- Flow: pick/capture → validate → upload → get URL → update Firestore → update UI
- Drawer integration displays uploaded image or generated initials

Refer to `PROFILE_IMAGE_FEATURE.md` for UX details and troubleshooting.

## Running Locally

Prerequisites:

- Node.js LTS, Yarn or npm
- Expo CLI and Android Studio (for device/emulator)

Install and start:

```powershell
# From repo root
npm install
npm run start

# Android
npm run android

# Web (for limited development purposes)
npm run web
```

If using EAS builds locally, install the Expo Dev Client and follow prompts.

## Building an APK (EAS)

EAS profiles (`eas.json`) are preconfigured for APK outputs:

- development: internal distribution, dev client, APK
- preview: internal distribution, APK
- production: autoIncrement, APK

Common steps:

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build APK:
   - Dev/Preview: `eas build -p android --profile preview`
   - Production: `eas build -p android --profile production`

After build completes, download the APK from the EAS dashboard or artifact URL and optionally upload to Google Drive to share.

## Screens and Navigation

Expo Router organizes screens under `app/`:

- Auth: `(auth)/login.tsx`, `(auth)/signup.tsx`
- Account: `(account)/account.tsx`
- Categories: `(categories)/`
- Dashboard: `(dashboard)/dashboard.tsx`
- Transactions: `(transaction)/` including `add`, `edit/[id]`, `index`, and details `[id]`
- Settings/Help/Goal/History/GetStarted flows

Shared components like `TransactionList`, `TransactionForm`, `NavigationDrawer`, and `AppHeader` provide a consistent UI.

## Security Notes

- Use proper Firestore and Storage security rules for user‑scoped data
- Avoid committing secrets; rotate keys when sharing APKs publicly
- Consider enabling email verification and MFA for production

## Troubleshooting

- Google sign‑in errors on Android
  - Ensure SHA‑1 fingerprint is added to Firebase and Google Cloud console
  - Verify `webClientId` matches your OAuth client
- Storage upload fails
  - Confirm Storage bucket exists and rules permit user uploads
  - Check Android permissions for camera/media
- App doesn’t start on device
  - Clear Metro cache and reinstall app; ensure matching SDK versions

## License

MIT

---

## Acknowledgements

- Built with Expo, Firebase, and the amazing OSS React Native ecosystem.
