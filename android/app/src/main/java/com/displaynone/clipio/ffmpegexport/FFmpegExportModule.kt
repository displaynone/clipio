package com.displaynone.clipio.ffmpegexport

import android.content.ContentValues
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import java.io.File
import java.io.InputStream
import java.util.UUID
import java.util.ArrayDeque
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.regex.Pattern
import kotlin.math.max
import kotlin.math.min

class FFmpegExportModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()
  private val timePattern = Pattern.compile("time=(\\d+):(\\d+):(\\d+(?:\\.\\d+)?)")

  override fun getName(): String = "FFmpegExportModule"

  @ReactMethod
  fun exportProject(options: ReadableMap, promise: Promise) {
    val commandArray = options.getArray("command")
    val projectJson = options.getString("project")

    if (commandArray == null || projectJson.isNullOrBlank()) {
      promise.reject("ERR_FFMPEG_INVALID_OPTIONS", "Faltan command o project.")
      return
    }

    executor.execute {
      try {
        emitProgress(0.0, "preparing")
        val outputFile = createOutputFile()
        val ffmpegBinary = resolveFfmpegBinary()
        val durationMs = extractProjectDurationMs(projectJson)
        val projectId = extractProjectId(projectJson)
        val command = buildExecutableCommand(
          ffmpegBinary = ffmpegBinary,
          rawCommand = commandArray,
          outputFile = outputFile,
        )

        emitProgress(0.05, "rendering")
        runFfmpeg(command, durationMs)
        emitProgress(0.98, "saving")
        val savedUri = saveToGallery(outputFile, projectId)
        outputFile.delete()

        val result = Arguments.createMap().apply {
          putString("outputUri", savedUri.toString())
        }
        emitProgress(1.0, "completed")
        promise.resolve(result)
      } catch (error: Exception) {
        promise.reject("ERR_FFMPEG_EXPORT_FAILED", error.message, error)
      }
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
  }

  @ReactMethod
  fun removeListeners(count: Int) {
  }

  private fun buildExecutableCommand(
    ffmpegBinary: File,
    rawCommand: ReadableArray,
    outputFile: File,
  ): List<String> {
    val command = mutableListOf(ffmpegBinary.absolutePath)

    for (index in 0 until rawCommand.size()) {
      val argument = rawCommand.getString(index) ?: continue
      command.add(
        if (argument == "<output-path>") {
          outputFile.absolutePath
        } else {
          argument
        },
      )
    }

    return command
  }

  private fun runFfmpeg(command: List<String>, durationMs: Long) {
    val process = ProcessBuilder(command)
      .redirectErrorStream(false)
      .start()
    val stderrTail = ArrayDeque<String>()

    val stderrThread = Thread {
      process.errorStream.bufferedReader().useLines { lines ->
        lines.forEach { line ->
          appendTail(stderrTail, line)
          val matcher = timePattern.matcher(line)
          if (!matcher.find()) {
            return@forEach
          }

          val hours = matcher.group(1)?.toLongOrNull() ?: 0L
          val minutes = matcher.group(2)?.toLongOrNull() ?: 0L
          val seconds = matcher.group(3)?.toDoubleOrNull() ?: 0.0
          val renderedMs =
            (hours * 3_600_000L) + (minutes * 60_000L) + (seconds * 1000.0).toLong()
          val progress = if (durationMs <= 0L) 0.5 else {
            min(0.99, renderedMs.toDouble() / durationMs.toDouble())
          }

          emitProgress(max(0.05, progress), "rendering")
        }
      }
    }
    stderrThread.start()

    val stdoutThread = Thread {
      process.inputStream.consumeQuietly()
    }
    stdoutThread.start()

    val exitCode = process.waitFor()
    stderrThread.join()
    stdoutThread.join()

    if (exitCode != 0) {
      val stderrSummary = if (stderrTail.isEmpty()) {
        "sin salida stderr"
      } else {
        stderrTail.joinToString(separator = "\n")
      }
      throw IllegalStateException(
        "FFmpeg terminó con código $exitCode.\n" +
          "Comando: ${command.joinToString(" ")}\n" +
          "stderr:\n$stderrSummary",
      )
    }
  }

  private fun resolveFfmpegBinary(): File {
    val nativeLibraryDir = reactApplicationContext.applicationInfo.nativeLibraryDir
    val packagedCandidates = listOf(
      File(nativeLibraryDir, "ffmpeg"),
      File(nativeLibraryDir, "libffmpeg.so"),
    )

    packagedCandidates.firstOrNull { it.exists() && it.isFile }?.let { binary ->
      return binary
    }

    val supportedAbis = Build.SUPPORTED_ABIS.toList()
    val candidateSummary = packagedCandidates.joinToString(separator = "; ") { candidate ->
      "${candidate.name}: exists=${candidate.exists()}, isFile=${candidate.isFile}, canExecute=${candidate.canExecute()}, canRead=${candidate.canRead()}"
    }
    throw IllegalStateException(
      "FFmpegExportModule no puede ejecutar FFmpeg desde almacenamiento interno por restricciones de Android. " +
        "Empaqueta el binario dentro de native libraries y asegúrate de que exista como ffmpeg o libffmpeg.so en ${nativeLibraryDir}. " +
        "ABIs detectadas: ${supportedAbis.joinToString()}. " +
        "Estado de candidatos: $candidateSummary",
    )
  }

  private fun createOutputFile(): File {
    val outputDirectory = File(reactApplicationContext.cacheDir, "ffmpeg-exports")
    if (!outputDirectory.exists()) {
      outputDirectory.mkdirs()
    }
    return File(outputDirectory, "project-export-${UUID.randomUUID()}.mp4")
  }

  private fun extractProjectDurationMs(projectJson: String): Long {
    return try {
      val root = JSONObject(projectJson)
      val canvas = root.getJSONObject("canvas")
      canvas.optLong("durationMs", 0L)
    } catch (_: Exception) {
      0L
    }
  }

  private fun extractProjectId(projectJson: String): String {
    return try {
      val root = JSONObject(projectJson)
      root.optString("id", "project").ifBlank { "project" }
    } catch (_: Exception) {
      "project"
    }
  }

  private fun saveToGallery(sourceFile: File, projectId: String): Uri {
    val resolver = reactApplicationContext.contentResolver
    val safeProjectId = projectId.replace(Regex("[^a-zA-Z0-9-_]"), "-")
    val fileName = "clipio-${safeProjectId}-${System.currentTimeMillis()}.mp4"
    val values = ContentValues().apply {
      put(MediaStore.Video.Media.DISPLAY_NAME, fileName)
      put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        put(MediaStore.Video.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/Clipio")
        put(MediaStore.Video.Media.IS_PENDING, 1)
      }
    }

    val contentUri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)
      ?: throw IllegalStateException("No se pudo crear el archivo de salida en la galería.")

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

  private fun emitProgress(progress: Double, phase: String) {
    val event = Arguments.createMap().apply {
      putDouble("progress", progress)
      putString("phase", phase)
    }

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("FFmpegExportProgress", event)
  }

  private fun appendTail(buffer: ArrayDeque<String>, line: String) {
    if (buffer.size >= 40) {
      buffer.removeFirst()
    }
    buffer.addLast(line)
  }
}

private fun InputStream.consumeQuietly() {
  use { input ->
    val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
    while (input.read(buffer) != -1) {
    }
  }
}
