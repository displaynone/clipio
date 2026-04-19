# Repository Guidelines

## Project Structure & Module Organization

This is an Expo Router React Native app. Route screens live in `app/`, including tabs in `app/(tabs)/` and template routes in `app/template/`. Shared UI components are in `components/`, grouped by feature area such as `library/`, `templates/`, `preview/`, and `ui/`.

Business logic lives in `features/` and `services/`. Video editor domain, preview, export, and FFmpeg code are under `features/video-editor/`. State is in `stores/`, hooks in `hooks/`, types in `types/`, constants in `constants/`, and assets in `assets/`. Native Android code is in `android/`.

## Build, Test, and Development Commands

- `npm run start`: start Expo with the development client.
- `npm run android`: build and run the app on Android.
- `npm run ios`: build and run the app on iOS.
- `npm run web`: start the web target.
- `npm run lint`: run Expo ESLint checks.
- `npx tsc --noEmit`: run TypeScript validation.
- `npm run ffmpeg:doctor`: verify Android FFmpeg setup.
- `npm run ffmpeg:build:android`: build Android FFmpeg.

Expo SDK 55 expects Node `>=20.19.4`.

## Coding Style & Naming Conventions

Use strict TypeScript. Prefer the `@/` path alias for root imports. Components use PascalCase filenames and exports, for example `VideoThumbnail.tsx`; hooks use `use...` names, for example `useVideoSelection.ts`; stores use camelCase names such as `editorStore.ts`.

Follow existing formatting: tabs are common in TS/TSX files, imports are grouped by source, and styling is primarily Tailwind/Uniwind class names. Use React Native style objects only where needed.

## Testing Guidelines

There is no automated test suite configured yet. Treat `npm run lint` and `npx tsc --noEmit` as required checks. For video, template, or export changes, manually verify the affected flow on device or emulator, especially Android memory use, thumbnails, trimming, preview playback, and export output.

If adding tests, colocate them as `*.test.ts` or `*.test.tsx`, and prioritize domain logic in `features/video-editor/domain/`.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commits, sometimes with Conventional Commit prefixes like `feat:` and `fix:`. Keep commits scoped, for example `fix: avoid extra video players in library`.

Pull requests should include a summary, validation commands, device coverage, linked issues, and screenshots or recordings for UI changes. Mention Android, FFmpeg, or export changes because they may need extra build verification.

## Agent-Specific Instructions

Do not revert unrelated local changes. Keep edits scoped to the requested task, preserve existing project patterns, and avoid introducing new dependencies unless the change clearly requires them.

Use `.nvmrc` in order to use the correct version of node.
