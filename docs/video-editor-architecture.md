# Video Editor Architecture

## Objetivo

Separar el editor en dos motores distintos sobre un mismo modelo:

- `Preview Engine`: reproducción interactiva y scrubbing en tiempo real.
- `Export Engine`: render offline orientado a FFmpeg.

La UI ya no debe depender de cómo exporta Android internamente.

## Capas

### 1. Dominio común

Archivos:

- `features/video-editor/domain/video-project.ts`
- `features/video-editor/domain/project-serialization.ts`

Modelo principal:

- `VideoProject`
- `ProjectTrack`
- `TrackItem` por tipo (`video`, `audio`, `text`, `shape`, `sticker`)
- `canvas` con tamaño, color, fps y duración

Este modelo es la única fuente de verdad para preview y export.

### 2. Adaptadores

Archivo:

- `features/video-editor/adapters/templateProjectAdapter.ts`

Responsabilidad:

- traducir el sistema actual de plantillas (`TemplateData` + `TemplateInstance`) a `VideoProject`
- mantener la migración progresiva sin reescribir toda la UI

Estado actual:

- las plantillas actuales se convierten a un proyecto con una pista de vídeo y una de audio
- la duración del proyecto se calcula a partir del clip recortado más corto conocido

### 3. Preview Engine

Contratos:

- `features/video-editor/preview/contracts.ts`

Implementación actual:

- `features/video-editor/preview/reactNativePreviewEngine.ts`
- `hooks/usePreviewController.ts`
- `components/preview/ReactNativePreviewRenderer.tsx`
- `components/preview/ProjectLayerRenderer.tsx`
- `components/preview/ProjectPreviewPlayer.tsx`

Decisiones:

- el preview usa `expo-video` para capas de vídeo
- overlays visuales se renderizan en React Native
- el control temporal (`play`, `pause`, `seek`) está separado del render

Estado actual:

- múltiples capas visuales
- z-index
- posición, escala, rotación y opacidad
- scrubbing básico
- play/pause/seek

Limitaciones actuales:

- no hay keyframes interpolados todavía
- no hay transiciones reales todavía
- stickers se dejan como placeholder visual
- sincronía multi-layer suficiente para plantilla, no todavía nivel editor profesional

### 4. Export Engine

Contratos:

- `features/video-editor/export/contracts.ts`

Motores:

- `features/video-editor/export/engines/FFmpegExportEngine.ts`
- `features/video-editor/export/engines/LegacyMedia3ExportEngine.ts`

Selección activa:

- `features/video-editor/export/defaultExportEngine.ts`

#### FFmpeg path

Builder puro:

- `features/video-editor/export/ffmpeg/buildFFmpegCommand.ts`

Bridge nativo:

- `features/video-editor/export/ffmpeg/FFmpegNativeBridge.ts`

Estado actual:

- el builder FFmpeg ya traduce `VideoProject` a una especificación reproducible
- soporta composición de múltiples vídeos, trim, escalado, overlay y mezcla básica de audio
- la integración nativa real de FFmpeg todavía no está instalada

#### Legacy path

- `LegacyMedia3ExportEngine` se conserva solo como referencia técnica y migración manual
- ya no es el engine activo por defecto

## Flujo actual

1. La pantalla de plantilla genera un `VideoProject` con `useEditorProject`.
2. El preview renderiza ese proyecto con `ProjectPreviewPlayer`.
3. El export llama a `videoExportService`.
4. `videoExportService` resuelve un `ExportEngine`.
5. El engine activo es siempre FFmpeg.
6. Si `FFmpegExportModule` no existe, el error es explícito y no cae a Media3.

## Migración desde el sistema anterior

### Fase 1

- introducir `VideoProject`
- mover preview a un motor separado
- encapsular export detrás de `ExportEngine`

### Fase 2

- integrar FFmpeg nativo directamente en Android
- implementar `FFmpegExportModule`
- mantener Media3 solo como referencia temporal mientras se valida la transición

### Fase 3

- añadir timeline libre
- keyframes
- transiciones
- textos, shapes y stickers exportables
- serialización estable para persistencia de proyectos

## Dependencia externa pendiente

Para que FFmpeg sea funcional de extremo a extremo falta una integración nativa real:

- compilar y empaquetar FFmpeg dentro del proyecto Android
- exponer un módulo nativo `FFmpegExportModule` que ejecute la especificación generada

Hasta que exista esa integración, la arquitectura ya queda preparada pero el export FFmpeg real sigue pendiente.
