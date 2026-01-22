//! Voice capture using Whisper.cpp
//!
//! Provides local speech-to-text for Quick Capture feature.
//! Uses whisper.cpp for accurate, offline transcription.

use std::path::PathBuf;
use std::process::Command;
use tauri::AppHandle;

/// Whisper model sizes
#[derive(Debug, Clone, Copy)]
pub enum WhisperModel {
    Tiny,   // ~75MB, fastest, less accurate
    Base,   // ~142MB, good balance
    Small,  // ~466MB, better accuracy
    Medium, // ~1.5GB, high accuracy
}

impl WhisperModel {
    pub fn filename(&self) -> &str {
        match self {
            WhisperModel::Tiny => "ggml-tiny.bin",
            WhisperModel::Base => "ggml-base.bin",
            WhisperModel::Small => "ggml-small.bin",
            WhisperModel::Medium => "ggml-medium.bin",
        }
    }

    pub fn download_url(&self) -> &str {
        match self {
            WhisperModel::Tiny => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
            WhisperModel::Base => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
            WhisperModel::Small => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
            WhisperModel::Medium => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
        }
    }
}

/// Voice configuration
pub struct VoiceConfig {
    pub model: WhisperModel,
    pub models_dir: PathBuf,
    pub whisper_path: PathBuf,
}

impl Default for VoiceConfig {
    fn default() -> Self {
        let home = dirs::home_dir().unwrap_or_default();
        Self {
            model: WhisperModel::Base,
            models_dir: home.join(".taskboard").join("models"),
            whisper_path: home.join(".taskboard").join("bin").join("whisper"),
        }
    }
}

/// Check if Whisper is installed and model exists
pub fn is_voice_available(config: &VoiceConfig) -> bool {
    let model_path = config.models_dir.join(config.model.filename());
    config.whisper_path.exists() && model_path.exists()
}

/// Record audio from microphone (uses system audio tools)
/// Returns path to temporary WAV file
pub async fn record_audio(duration_secs: u32) -> Result<PathBuf, String> {
    let temp_path = std::env::temp_dir().join("taskboard_voice.wav");

    #[cfg(target_os = "windows")]
    {
        // Use PowerShell to record audio on Windows
        let script = format!(
            r#"
            Add-Type -AssemblyName System.Speech
            $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
            $recognizer.SetInputToDefaultAudioDevice()
            # Record for {} seconds
            Start-Sleep -Seconds {}
            "#,
            duration_secs, duration_secs
        );

        // For Windows, we'll use a different approach with NAudio or similar
        // This is a placeholder - actual implementation would use proper audio recording
        return Err("Windows audio recording requires additional setup".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        // Use sox on macOS
        let output = Command::new("sox")
            .args([
                "-d",  // default audio device
                "-r", "16000",  // 16kHz sample rate (Whisper requirement)
                "-c", "1",  // mono
                "-b", "16",  // 16-bit
                temp_path.to_str().unwrap(),
                "trim", "0", &duration_secs.to_string(),
            ])
            .output()
            .map_err(|e| format!("Failed to record: {}", e))?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Use arecord on Linux
        let output = Command::new("arecord")
            .args([
                "-f", "S16_LE",
                "-r", "16000",
                "-c", "1",
                "-d", &duration_secs.to_string(),
                temp_path.to_str().unwrap(),
            ])
            .output()
            .map_err(|e| format!("Failed to record: {}", e))?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
    }

    Ok(temp_path)
}

/// Transcribe audio file using Whisper.cpp
pub async fn transcribe(audio_path: &PathBuf, config: &VoiceConfig) -> Result<String, String> {
    let model_path = config.models_dir.join(config.model.filename());

    if !model_path.exists() {
        return Err(format!(
            "Whisper model not found. Download from: {}",
            config.model.download_url()
        ));
    }

    let output = Command::new(&config.whisper_path)
        .args([
            "-m", model_path.to_str().unwrap(),
            "-f", audio_path.to_str().unwrap(),
            "-otxt",  // output as text
            "--no-timestamps",
            "-l", "en",  // English
        ])
        .output()
        .map_err(|e| format!("Failed to run Whisper: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let transcript = String::from_utf8_lossy(&output.stdout)
        .trim()
        .to_string();

    Ok(transcript)
}

/// Download Whisper model if not present
pub async fn download_model(config: &VoiceConfig) -> Result<(), String> {
    let model_path = config.models_dir.join(config.model.filename());

    if model_path.exists() {
        return Ok(());
    }

    // Create models directory
    std::fs::create_dir_all(&config.models_dir)
        .map_err(|e| format!("Failed to create models dir: {}", e))?;

    // Download using curl or reqwest
    println!("Downloading Whisper model from: {}", config.model.download_url());

    let output = Command::new("curl")
        .args([
            "-L",
            "-o", model_path.to_str().unwrap(),
            config.model.download_url(),
        ])
        .output()
        .map_err(|e| format!("Failed to download model: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

// Tauri commands

#[tauri::command]
pub async fn check_voice_available() -> bool {
    let config = VoiceConfig::default();
    is_voice_available(&config)
}

#[tauri::command]
pub async fn voice_capture(duration_secs: u32) -> Result<String, String> {
    let config = VoiceConfig::default();

    // Record audio
    let audio_path = record_audio(duration_secs).await?;

    // Transcribe
    let transcript = transcribe(&audio_path, &config).await?;

    // Cleanup temp file
    let _ = std::fs::remove_file(&audio_path);

    Ok(transcript)
}

#[tauri::command]
pub async fn setup_voice() -> Result<String, String> {
    let config = VoiceConfig::default();

    // Download model if needed
    download_model(&config).await?;

    Ok("Voice setup complete".to_string())
}
