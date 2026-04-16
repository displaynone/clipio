package com.displaynone.clipio.videotrim

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.util.UUID
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.math.max
import kotlin.math.min

class VideoTrimModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()

  override fun getName(): String = "VideoTrimModule"

  @ReactMethod
  fun trimToFile(options: ReadableMap, promise: Promise) {
    val inputUri = options.getString("inputUri")
    val startMs = options.getDouble("startMs").toLong()
    val endMs = options.getDouble("endMs").toLong()

    if (inputUri.isNullOrBlank()) {
      promise.reject("ERR_TRIM_INVALID_URI", "inputUri es obligatorio.")
      return
    }

    if (endMs <= startMs) {
      promise.reject("ERR_TRIM_INVALID_RANGE", "endMs debe ser mayor que startMs.")
      return
    }

    executor.execute {
      try {
        emitProgress(inputUri, 0.0)
        val outputUri = trimVideo(inputUri, startMs, endMs)
        val result = Arguments.createMap().apply {
          putString("outputUri", outputUri)
        }
        emitProgress(inputUri, 1.0)
        promise.resolve(result)
      } catch (error: Exception) {
        promise.reject("ERR_TRIM_FAILED", error.message, error)
      }
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Int) {
  }

  private fun trimVideo(inputUriString: String, startMs: Long, endMs: Long): String {
    val context = reactApplicationContext
    val inputUri = Uri.parse(inputUriString)
    val startUs = startMs * 1_000L
    val endUs = endMs * 1_000L
    val outputFile = createOutputFile()

    val extractor = MediaExtractor()
    val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    val metadataRetriever = MediaMetadataRetriever()

    try {
      extractor.setDataSource(context, inputUri, null)
      metadataRetriever.setDataSource(context, inputUri)

      val trackCount = extractor.trackCount
      val trackIndexMap = mutableMapOf<Int, Int>()
      var maxBufferSize = 1 * 1024 * 1024

      for (trackIndex in 0 until trackCount) {
        val format = extractor.getTrackFormat(trackIndex)
        val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
        if (!mime.startsWith("video/") && !mime.startsWith("audio/")) {
          continue
        }

        extractor.selectTrack(trackIndex)
        val destinationTrackIndex = muxer.addTrack(format)
        trackIndexMap[trackIndex] = destinationTrackIndex

        if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) {
          maxBufferSize = max(maxBufferSize, format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE))
        }
      }

      if (trackIndexMap.isEmpty()) {
        throw IllegalStateException("No se encontraron pistas de audio o video recortables.")
      }

      val rotationValue = metadataRetriever.extractMetadata(
        MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION,
      )
      val rotationDegrees = rotationValue?.toIntOrNull()
      if (rotationDegrees != null) {
        muxer.setOrientationHint(rotationDegrees)
      }

      extractor.seekTo(startUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)
      muxer.start()

      val buffer = java.nio.ByteBuffer.allocateDirect(maxBufferSize)
      val bufferInfo = MediaCodec.BufferInfo()
      val requestedDurationUs = max(1L, endUs - startUs)
      var lastProgress = -1.0

      while (true) {
        val sampleTrackIndex = extractor.sampleTrackIndex
        if (sampleTrackIndex < 0) {
          break
        }

        val sampleTimeUs = extractor.sampleTime
        if (sampleTimeUs < 0) {
          break
        }

        if (sampleTimeUs < startUs) {
          extractor.advance()
          continue
        }

        if (sampleTimeUs > endUs) {
          break
        }

        val destinationTrackIndex = trackIndexMap[sampleTrackIndex]
        if (destinationTrackIndex == null) {
          extractor.advance()
          continue
        }

        bufferInfo.offset = 0
        bufferInfo.size = extractor.readSampleData(buffer, 0)
        if (bufferInfo.size < 0) {
          break
        }

        bufferInfo.presentationTimeUs = max(0L, sampleTimeUs - startUs)
        bufferInfo.flags =
          if ((extractor.sampleFlags and MediaExtractor.SAMPLE_FLAG_SYNC) != 0) {
            MediaCodec.BUFFER_FLAG_KEY_FRAME
          } else {
            0
          }

        muxer.writeSampleData(destinationTrackIndex, buffer, bufferInfo)

        val progress = min(1.0, (sampleTimeUs - startUs).toDouble() / requestedDurationUs.toDouble())
        if (progress - lastProgress >= 0.02) {
          emitProgress(inputUriString, progress)
          lastProgress = progress
        }

        extractor.advance()
      }

      return Uri.fromFile(outputFile).toString()
    } finally {
      try {
        metadataRetriever.release()
      } catch (_: Exception) {
      }
      try {
        extractor.release()
      } catch (_: Exception) {
      }
      try {
        muxer.stop()
      } catch (_: Exception) {
      }
      try {
        muxer.release()
      } catch (_: Exception) {
      }
    }
  }

  private fun createOutputFile(): File {
    val outputDirectory = File(reactApplicationContext.cacheDir, "trimmed-clips")
    if (!outputDirectory.exists()) {
      outputDirectory.mkdirs()
    }

    return File(outputDirectory, "trim-${UUID.randomUUID()}.mp4")
  }

  private fun emitProgress(inputUri: String, progress: Double) {
    val event = Arguments.createMap().apply {
      putString("inputUri", inputUri)
      putDouble("progress", progress)
    }

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("VideoTrimProgress", event)
  }
}
