package com.displaynone.clipio.videoexport

import android.content.ContentValues
import android.media.MediaMetadataRetriever
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.OverlaySettings
import androidx.media3.common.VideoCompositorSettings
import androidx.media3.common.util.Size as Media3Size
import androidx.media3.effect.StaticOverlaySettings
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.EditedMediaItemSequence
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.ProgressHolder
import androidx.media3.transformer.Transformer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.util.UUID
import kotlin.math.max

  private data class ExportSlot(
  val uri: String,
  val x: Float,
  val y: Float,
  val width: Float,
  val height: Float,
)

class VideoExportModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val mainHandler = Handler(Looper.getMainLooper())

  override fun getName(): String = "VideoExportModule"

  @ReactMethod
  fun exportTemplateVideo(options: ReadableMap, promise: Promise) {
    val templateId = options.getString("templateId")
    val output = options.getMap("output")
    val slots = options.getArray("slots")
    val audioSourceUri = options.getString("audioSourceUri")

    if (templateId.isNullOrBlank()) {
      promise.reject("ERR_EXPORT_INVALID_TEMPLATE", "templateId es obligatorio.")
      return
    }

    if (output == null || slots == null) {
      promise.reject("ERR_EXPORT_INVALID_OPTIONS", "Faltan output o slots.")
      return
    }

    val outputWidth = output.getInt("width")
    val outputHeight = output.getInt("height")
    if (outputWidth <= 0 || outputHeight <= 0) {
      promise.reject("ERR_EXPORT_INVALID_SIZE", "El tamaño de salida no es válido.")
      return
    }

    val parsedSlots = parseSlots(slots)
    if (parsedSlots.isEmpty()) {
      promise.reject("ERR_EXPORT_NO_SLOTS", "No hay clips para exportar.")
      return
    }

    mainHandler.post {
      val progressHolder = ProgressHolder()
      var isFinished = false
      val progressRunnable = object : Runnable {
        override fun run() {
          if (isFinished) {
            return
          }

          val progressState = transformer?.getProgress(progressHolder)
          if (progressState == Transformer.PROGRESS_STATE_AVAILABLE) {
            emitProgress(templateId, progressHolder.progress / 100.0)
          }
          mainHandler.postDelayed(this, 200L)
        }
      }

      try {
        emitProgress(templateId, 0.0)
        val outputFile = createWorkingOutputFile()
        val composition = buildComposition(
          parsedSlots = parsedSlots,
          outputWidth = outputWidth,
          outputHeight = outputHeight,
          audioSourceUri = audioSourceUri,
        )

        val localTransformer = Transformer.Builder(reactApplicationContext)
          .setVideoMimeType(MimeTypes.VIDEO_H264)
          .addListener(
            object : Transformer.Listener {
              override fun onCompleted(composition: Composition, result: ExportResult) {
                try {
                  isFinished = true
                  mainHandler.removeCallbacks(progressRunnable)
                  emitProgress(templateId, 1.0)
                  val savedUri = saveToGallery(outputFile, templateId)
                  outputFile.delete()
                  val response = Arguments.createMap().apply {
                    putString("outputUri", savedUri.toString())
                  }
                  promise.resolve(response)
                } catch (error: Exception) {
                  promise.reject("ERR_EXPORT_SAVE_FAILED", error.message, error)
                }
              }

              override fun onError(
                composition: Composition,
                result: ExportResult,
                exception: ExportException,
              ) {
                isFinished = true
                mainHandler.removeCallbacks(progressRunnable)
                outputFile.delete()
                promise.reject("ERR_EXPORT_FAILED", exception.message, exception)
              }
            },
          )
          .build()

        transformer = localTransformer
        mainHandler.post(progressRunnable)
        localTransformer.start(composition, outputFile.absolutePath)
      } catch (error: Exception) {
        promise.reject("ERR_EXPORT_FAILED", error.message, error)
      }
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Int) {
  }

  private var transformer: Transformer? = null

  private fun parseSlots(slotsArray: ReadableArray): List<ExportSlot> {
    val parsed = mutableListOf<ExportSlot>()
    for (index in 0 until slotsArray.size()) {
      val slot = slotsArray.getMap(index) ?: continue
      val uri = slot.getString("uri") ?: continue
      parsed.add(
        ExportSlot(
          uri = uri,
          x = slot.getDouble("x").toFloat(),
          y = slot.getDouble("y").toFloat(),
          width = slot.getDouble("width").toFloat(),
          height = slot.getDouble("height").toFloat(),
        ),
      )
    }
    return parsed
  }

  private fun buildComposition(
    parsedSlots: List<ExportSlot>,
    outputWidth: Int,
    outputHeight: Int,
    audioSourceUri: String?,
  ): Composition {
    val shortestDurationUs = resolveShortestDurationUs(parsedSlots)
    val videoItems = parsedSlots.map { slot ->
      EditedMediaItem.Builder(MediaItem.fromUri(Uri.parse(slot.uri)))
        .setDurationUs(shortestDurationUs)
        .setRemoveAudio(true)
        .build()
    }

    val sequences = videoItems.map { item ->
      EditedMediaItemSequence(item)
    }.toMutableList()

    val selectedAudioUri = audioSourceUri ?: parsedSlots.firstOrNull()?.uri
    if (!selectedAudioUri.isNullOrBlank()) {
      val audioItem = EditedMediaItem.Builder(MediaItem.fromUri(Uri.parse(selectedAudioUri)))
        .setDurationUs(shortestDurationUs)
        .setRemoveVideo(true)
        .build()
      sequences.add(EditedMediaItemSequence(audioItem))
    }

    return Composition.Builder(sequences)
      .setVideoCompositorSettings(
        ClipLayoutCompositorSettings(
          slots = parsedSlots,
          outputWidth = outputWidth,
          outputHeight = outputHeight,
        ),
      )
      .build()
  }

  private fun resolveShortestDurationUs(parsedSlots: List<ExportSlot>): Long {
    val shortestDurationUs = parsedSlots.mapNotNull { slot ->
      readDurationUs(slot.uri)
    }.minOrNull()

    return shortestDurationUs?.coerceAtLeast(1L)
      ?: throw IllegalStateException("No se pudo leer la duración de los clips seleccionados.")
  }

  private fun readDurationUs(uriString: String): Long? {
    val metadataRetriever = MediaMetadataRetriever()

    return try {
      metadataRetriever.setDataSource(reactApplicationContext, Uri.parse(uriString))
      val durationMs = metadataRetriever.extractMetadata(
        MediaMetadataRetriever.METADATA_KEY_DURATION,
      )?.toLongOrNull()

      durationMs?.times(1_000L)
    } catch (_: Exception) {
      null
    } finally {
      try {
        metadataRetriever.release()
      } catch (_: Exception) {
      }
    }
  }

  private fun createWorkingOutputFile(): File {
    val outputDirectory = File(reactApplicationContext.cacheDir, "exports")
    if (!outputDirectory.exists()) {
      outputDirectory.mkdirs()
    }
    return File(outputDirectory, "template-export-${UUID.randomUUID()}.mp4")
  }

  private fun saveToGallery(sourceFile: File, templateId: String): Uri {
    val resolver = reactApplicationContext.contentResolver
    val fileName = "clipio-${templateId}-${System.currentTimeMillis()}.mp4"
    val values = ContentValues().apply {
      put(MediaStore.Video.Media.DISPLAY_NAME, fileName)
      put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        put(MediaStore.Video.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/Clipio")
        put(MediaStore.Video.Media.IS_PENDING, 1)
      }
    }

    val contentUri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)
      ?: throw IllegalStateException("No se pudo crear el archivo de salida.")

    resolver.openOutputStream(contentUri)?.use { outputStream ->
      sourceFile.inputStream().use { inputStream ->
        inputStream.copyTo(outputStream)
      }
    } ?: throw IllegalStateException("No se pudo abrir la salida para guardar el video.")

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val completedValues = ContentValues().apply {
        put(MediaStore.Video.Media.IS_PENDING, 0)
      }
      resolver.update(contentUri, completedValues, null, null)
    }

    MediaScannerConnection.scanFile(
      reactApplicationContext,
      arrayOf(sourceFile.absolutePath),
      arrayOf("video/mp4"),
      null,
    )

    return contentUri
  }

  private fun emitProgress(templateId: String, progress: Double) {
    val event = Arguments.createMap().apply {
      putString("templateId", templateId)
      putDouble("progress", progress)
    }

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("VideoExportProgress", event)
  }

}

private class ClipLayoutCompositorSettings(
  private val slots: List<ExportSlot>,
  private val outputWidth: Int,
  private val outputHeight: Int,
) : VideoCompositorSettings {
  override fun getOutputSize(inputSizes: List<Media3Size>): Media3Size =
    Media3Size(outputWidth, outputHeight)

  override fun getOverlaySettings(inputId: Int, presentationTimeUs: Long): OverlaySettings {
    val slot = slots.getOrNull(inputId)
      ?: return StaticOverlaySettings.Builder().build()

    val centerX = ((slot.x + (slot.width / 2f)) / 50f) - 1f
    val centerY = 1f - ((slot.y + (slot.height / 2f)) / 50f)
    val scaleX = max(0.01f, slot.width / 100f)
    val scaleY = max(0.01f, slot.height / 100f)

    return StaticOverlaySettings.Builder()
      .setBackgroundFrameAnchor(centerX, centerY)
      .setOverlayFrameAnchor(0f, 0f)
      .setScale(scaleX, scaleY)
      .setAlphaScale(1f)
      .setHdrLuminanceMultiplier(1f)
      .build()
  }
}
