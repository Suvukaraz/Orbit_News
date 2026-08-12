# Orbit News

Orbit News is a responsive news reader for [Hacker News](https://news.ycombinator.com/) and [Lemmy](https://join-lemmy.org/). It runs as a web app and as an Android app powered by Capacitor.

## Features

- Unified Hacker News and Lemmy feeds with New and Hot sorting
- Search across both supported sources
- Readable nested comments with visual depth indicators
- Gesture-friendly responsive layout for desktop and mobile
- Twelve dark theme presets
- Read-only, privacy-focused design with no account required

## Technology

React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, TanStack Query, and Capacitor 8.

## Try the latest release

Download the [latest release](https://github.com/Suvukaraz/Orbit_News/releases/latest) to get:

- `orbit-news-v0.8.0-debug.apk` - Android debug build
- `orbit-news-v0.8.0.html ` - self-contained web build for static hosting

The APK is a **debug build** and is not signed with a production certificate. Android may require permission to install apps from unknown sources.

## Development

### Requirements

- Node.js 18 or newer
- Android Studio and an Android SDK for Android builds

### Setup

```bash
npm install
npm run dev
```

### Production web build

The Vite build creates a self-contained `dist/index.html`, which can be uploaded to any static web host:

```bash
npm run build
```

### Android build

```bash
npm run sync-android
```

Then open the `android` directory in Android Studio or build from the command line with the Gradle wrapper.

## License

This project is maintained by Sven Kersten.
