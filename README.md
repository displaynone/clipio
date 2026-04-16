# Clipio - Editor de vídeo por plantillas (Expo + React Native + TypeScript)

Proyecto inicial con arquitectura modular y base para future integración nativa (FFmpeg, export).

## Estructura principal del proyecto

## Cómo ejecutar

### Opción 1: Development Build (recomendado para desarrollo local)

```bash
npm install

# Primera vez: compila e instala el dev client
npm run android
# npm run ios
```

Después, para cambios en código JavaScript:

```bash
npm start  # inicia el servidor de desarrollo
# Presiona 'a' para Android o 'i' para iOS
```

### Opción 2: Prebuild + Compilación nativa (para verificar cambios nativos)

```bash
npm install
npx expo prebuild --clean
npm run android
```

### Opción 3: EAS Build (cloud, recomendado para CI/CD)

```bash
npx expo login  # si no estás logeado
eas build --profile development --platform android
eas build --profile development --platform ios
```

**IMPORTANTE:** Este proyecto **NO usa Expo Go**. Usa development builds compilados.

### Rutas importantes

- `app/(tabs)/index.tsx`: lista de plantillas
- `app/template/[templateId].tsx`: editor de plantilla con picker + preview

### Qué incluye el MVP

- Selección de 4 vídeos (expo-image-picker)
- Preview 2x2 y Focus con total layout relativo (%)
- Reordenar con botones arriba/abajo
- Ajustes de color fondo, gap y border radius
- Estructura limpia: components/features/hooks/types/services

### FFmpeg Android

- `FFmpegExportModule` ya existe como módulo nativo Android
- el binario debe empaquetarse en `android/app/src/main/jniLibs/<abi>/libffmpeg.so`
- documentación detallada en `docs/ffmpeg-android-setup.md`
- scripts disponibles:
  - `npm run ffmpeg:build:android`
  - `npm run ffmpeg:doctor`

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
