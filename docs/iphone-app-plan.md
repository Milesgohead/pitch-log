# Pitch Log iPhone App Plan

Updated: 2026-10-04

## Goal

Package the existing Pitch Log React/Vite app as an installable iPhone app that launches independently of Safari and GitHub Pages. Prefer a Capacitor wrapper with the built web assets bundled locally, then use a cloud Mac build because this project workspace is on Windows and the user does not have a Mac.

## Chosen first attempt

1. Integrate Capacitor 8 with the existing Vite app.
2. Bundle `dist/` into the iOS app so launch does not depend on Pages or an internet connection.
3. Generate the iOS project and verify the local production build and Capacitor sync.
4. Use a GitHub Actions macOS runner to build an unsigned IPA, then use AltServer on the user's Windows PC to sign and sideload it with the user's own Apple Account.
5. Install and verify on the user's iPhone; decide about paid distribution only if needed later.

This keeps the existing React UI and app logic. It is a native app container around a WebView, not a rewrite into SwiftUI-native controls.

## Progress

- [x] Confirmed the project is React + Vite and runs on Node 24.11.1.
- [x] Installed `@capacitor/core`, `@capacitor/ios`, and `@capacitor/cli` 8.5.2.
- [x] Added `capacitor.config.ts` with app ID `com.milesgohead.pitchlog`, app name `Pitch Log`, and bundled web directory `dist`.
- [x] Added `app:sync` and `app:open:ios` npm scripts.
- [x] Changed Vite assets to relative URLs and made React Router select `/pitch-log` only for the GitHub Pages URL; bundled app launches from `/`.
- [x] Run the production build and `cap sync ios` successfully.
- [x] Add native full-screen sizing/safe-area handling and hide the simulated phone frame when Capacitor runs natively.
- [x] Select a cloud build and personal-device install route that does not require a Mac or paid Apple Developer Program membership.
- [ ] Build an unsigned IPA with GitHub Actions and confirm the artifact is valid.
- [ ] Install it from Windows with AltServer and verify launch, touch interactions, and local data persistence on a real iPhone.

## Requirements and limits

- No Mac is required for this experiment: GitHub-hosted macOS runners can build the iOS binary, and standard runners are free for public repositories ([GitHub runner documentation](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)).
- The IPA from CI is unsigned. AltServer on Windows can sideload IPA files directly; the user enters Apple Account credentials locally into AltServer, never into this project or chat ([AltServer documentation](https://faq.altstore.io/release-notes/altserver)).
- With a free Apple Account, directly sideloaded apps need reinstalling every seven days. Installing AltStore first enables periodic refresh while AltServer is available; Apple limits free-account sideloading to three apps at once ([AltStore limits](https://faq.altstore.io/altstore-classic/your-altstore)).
- Windows setup requires iTunes and iCloud from Apple, device trust, and Developer Mode on iOS 16 or later ([AltStore Windows setup](https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows)).
- App Store/TestFlight distribution requires Apple Developer Program membership. No paid service or membership has been purchased or authorized.
- Existing player data uses browser `localStorage`; the packaged app has its own storage area and will not automatically share data with Safari or other devices.
- The browser preview keeps its fixed 393×852 phone mockup. Capacitor native mode now fills the device viewport and applies safe-area insets; real-device visual verification is still required.

## Verification record

- Capacitor packages resolved at 8.5.2 under Node 24.11.1.
- `npm run build` passed after the Capacitor and native-layout changes.
- `npx cap add ios` and `npx cap sync ios` passed. The generated Xcode project and bundled `ios/App/App/public` assets are present. The CLI needed a one-process workaround for this Windows environment's `os.userInfo()` failure; no workaround was added to project files.
- The generated `dist/index.html` points to relative local assets (`./assets/...`), so the app bundle does not load its UI from GitHub Pages.
- Cloud signing, a signed iPhone-installable build, and real-device behavior are not yet verified.
- The first cloud build will use the checked-in workflow `.github/workflows/ios-unsigned-ipa.yml`; it does not need signing secrets.
- No Apple Account credentials have been connected to GitHub or this project, and no paid service or membership has been purchased.
