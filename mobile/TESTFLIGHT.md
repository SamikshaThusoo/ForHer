# ForHer — iOS build & TestFlight

Everything below is already configured. You only need an **Apple Developer Program**
membership ($99/yr, developer.apple.com), then run the commands.

## What's already done
- `app.json` — name **ForHer**, bundle id **`com.forher.pmos`**, build number `1`,
  version `1.0.0`, splash, and all native permissions (camera, microphone, speech).
- `eas.json` — `development` / `preview` (simulator, internal) and `production`
  (auto-incrementing build number) profiles, plus a `submit` profile.
- Native config validated: `expo prebuild` applies every plugin (camera,
  speech-recognition, splash, date picker, router, fonts) with no errors.

## One-time
1. Create/enroll in the **Apple Developer Program**.
2. From `mobile/`:
   ```bash
   npx eas-cli login              # your Expo account
   npx eas-cli init               # creates the EAS project + writes extra.eas.projectId
   ```

## Build + ship to TestFlight
```bash
# Cloud build (EAS handles certs/provisioning — sign in with your Apple ID when asked)
npx eas-cli build --platform ios --profile production

# Upload the finished build to TestFlight
npx eas-cli submit --platform ios --latest
```
Then in **App Store Connect → TestFlight**, add internal/external testers.

## Try it on a simulator first (no Apple account needed)
```bash
npx eas-cli build --platform ios --profile preview   # simulator build
# or, locally with Xcode:
npx expo run:ios
```

## Before the final build (optional polish)
- Replace `assets/icon.png` with a branded **1024×1024** icon (and `splash-icon.png`).
- Change the bundle id in `app.json` (`ios.bundleIdentifier`) if you want a different
  reverse-domain (must be unique to your Apple account).

## Notes
- Managed workflow — no `ios/`/`android/` dirs are committed; EAS regenerates them.
- Voice (`expo-speech-recognition`) and camera (`expo-camera`) only run on a real
  build/device, not in Expo Go or the web preview.
