# FreshSave Staff – TestFlight Guide

This document explains how to get the FreshSave Mobile staff app onto TestFlight for internal testing.

## Prerequisites

- Apple Developer Program membership ($99/year)
- Access to App Store Connect
- EAS CLI installed (`npm install -g eas-cli`)
- Logged into EAS: `eas login`

## 1. One-time Project Setup

```bash
cd freshsave-mobile

# Configure EAS (if not already done)
npx eas build:configure --platform ios

# This creates eas.json (already present in this project)
```

**Important:** Update these values before building:

1. In `app.json`:
   - Change `"bundleIdentifier": "com.freshsave.staff"` to your real reverse-domain identifier (e.g. `com.yourcompany.freshsave.staff`)

2. In `eas.json` under `submit.production.ios`:
   - Replace `YOUR_APPLE_ID@example.com`
   - Replace `YOUR_APP_STORE_CONNECT_APP_ID`
   - Replace `YOUR_TEAM_ID`

## 2. Build for TestFlight

### Option A: Production build (recommended for TestFlight)

```bash
npm run build:ios
# or
eas build --platform ios --profile production
```

### Option B: Faster internal testing (no App Store review)

```bash
npm run build:internal
# or
eas build --platform ios --profile internal
```

This creates an internal distribution build that can be shared directly via EAS or installed via the Expo Go app / TestFlight internal sharing.

### GitHub Actions (recommended for teams)

You can trigger iOS builds directly from GitHub:

1. Go to the **Actions** tab in your repo
2. Select **iOS Build & Submit**
3. Choose the profile (`production` or `internal`)
4. Optionally enable "Submit to TestFlight after build"

The workflow is defined in `.github/workflows/ios-build.yml`.

**Required GitHub Secrets** (for submit step):
- `EXPO_TOKEN`
- `EXPO_APPLE_ID`
- `EXPO_APPLE_PASSWORD` (app-specific password)
- `EXPO_APPLE_TEAM_ID`

After the build finishes, you will get a link to download the `.ipa` or view it in the EAS dashboard.

## 3. Submit to App Store Connect (TestFlight)

```bash
npm run submit:ios

# Or directly:
eas submit --platform ios --profile production
```

This uploads the build to App Store Connect.

Once uploaded:
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **TestFlight** tab
4. Add internal testers (or external testers after review)
5. The build should appear within a few minutes to an hour

## Useful Commands

| Command                                      | Purpose                                      |
|----------------------------------------------|----------------------------------------------|
| `npm run build:ios`                          | Production build for TestFlight              |
| `npm run build:internal`                     | Faster internal/ad-hoc distribution          |
| `npm run submit:ios`                         | Submit to TestFlight                         |
| `eas build --platform ios --profile internal`| Internal distribution build                  |
| `eas build:list --platform ios`              | List recent iOS builds                       |
| `eas credentials --platform ios`             | Manage signing credentials                   |

## Recommended Workflow

1. Develop using `npm start` (Expo Go)
2. Test on device with `eas build --profile preview` (internal distribution)
3. When ready for broader testing → `npm run build:ios`
4. Submit → `npm run submit:ios`

## Notes

- The current `bundleIdentifier` is `com.freshsave.staff`. You **must** own this identifier or change it before submitting.
- First-time submissions often require manual review by Apple (can take 1-2 days for external testers).
- Internal testers (up to 100) can start testing almost immediately after upload.
- Always increment the build number (`app.json` → `ios.buildNumber`) or enable `autoIncrement` in eas.json before each production build.

## Troubleshooting

- **"You must provide a valid bundle identifier"** → Update `app.json`
- **Code signing errors** → Run `eas credentials --platform ios` and let EAS generate a new provisioning profile.
- **Build fails with camera permission** → Make sure the `expo-camera` plugin entry exists in `app.json`.

---

Last updated: 2026-06-01
Project: FreshSave Staff (Expo)