use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    pub model_type: Option<String>,
    pub is_downloaded: bool,
    pub model_path: Option<String>,
    pub model_size_mb: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionResult {
    pub text: String,
    pub success: bool,
}

pub struct WhisperState {
    pub context: Mutex<Option<WhisperContext>>,
    pub model_path: Mutex<Option<PathBuf>>,
}

impl WhisperState {
    pub fn new() -> Self {
        Self {
            context: Mutex::new(None),
            model_path: Mutex::new(None),
        }
    }
}

fn get_model_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let model_dir = app_data_dir.join("models");

    // Create directory if it doesn't exist
    std::fs::create_dir_all(&model_dir)
        .map_err(|e| format!("Failed to create models directory: {}", e))?;

    Ok(model_dir)
}

fn get_model_path(app_handle: &tauri::AppHandle, model_type: &str) -> Result<PathBuf, String> {
    let model_dir = get_model_dir(app_handle)?;
    let model_filename = format!("ggml-{}.bin", model_type);
    Ok(model_dir.join(model_filename))
}

#[tauri::command]
pub async fn get_model_status(
    app_handle: tauri::AppHandle,
    state: State<'_, WhisperState>,
) -> Result<ModelStatus, String> {
    // Check for tiny.en model
    let tiny_path = get_model_path(&app_handle, "tiny.en")?;
    let tiny_exists = tiny_path.exists();

    // Check for base.en model
    let base_path = get_model_path(&app_handle, "base.en")?;
    let base_exists = base_path.exists();

    // Determine which model is available
    let (model_type, model_path, model_size_mb) = if base_exists {
        let size = std::fs::metadata(&base_path)
            .map(|m| m.len() as f64 / (1024.0 * 1024.0))
            .unwrap_or(142.0);
        (Some("base".to_string()), Some(base_path.to_string_lossy().to_string()), Some(size))
    } else if tiny_exists {
        let size = std::fs::metadata(&tiny_path)
            .map(|m| m.len() as f64 / (1024.0 * 1024.0))
            .unwrap_or(75.0);
        (Some("tiny".to_string()), Some(tiny_path.to_string_lossy().to_string()), Some(size))
    } else {
        (None, None, None)
    };

    // Update state with current model path
    if let Some(ref path) = model_path {
        let mut state_path = state.model_path.lock().unwrap();
        *state_path = Some(PathBuf::from(path));
    }

    Ok(ModelStatus {
        model_type,
        is_downloaded: model_path.is_some(),
        model_path,
        model_size_mb,
    })
}

#[tauri::command]
pub async fn download_whisper_model(
    app_handle: tauri::AppHandle,
    model_type: String,
) -> Result<String, String> {
    let model_name = match model_type.as_str() {
        "tiny" => "tiny.en",
        "base" => "base.en",
        _ => return Err("Invalid model type. Must be 'tiny' or 'base'".to_string()),
    };

    let model_path = get_model_path(&app_handle, model_name)?;

    // Check if already exists
    if model_path.exists() {
        return Ok(format!("Model {} already downloaded", model_type));
    }

    // Hugging Face model URLs
    let model_url = match model_name {
        "tiny.en" => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
        "base.en" => "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin",
        _ => return Err("Unknown model".to_string()),
    };

    // Download the model
    log::info!("Downloading {} model from {}", model_name, model_url);

    let client = reqwest::Client::new();
    let response = client
        .get(model_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download model: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to download model: HTTP {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read model data: {}", e))?;

    // Write to file
    std::fs::write(&model_path, bytes)
        .map_err(|e| format!("Failed to write model file: {}", e))?;

    log::info!("Model {} downloaded successfully to {:?}", model_name, model_path);

    Ok(format!("Model {} downloaded successfully", model_type))
}

#[tauri::command]
pub async fn delete_whisper_model(
    app_handle: tauri::AppHandle,
    state: State<'_, WhisperState>,
    model_type: String,
) -> Result<String, String> {
    let model_name = match model_type.as_str() {
        "tiny" => "tiny.en",
        "base" => "base.en",
        _ => return Err("Invalid model type. Must be 'tiny' or 'base'".to_string()),
    };

    let model_path = get_model_path(&app_handle, model_name)?;

    if !model_path.exists() {
        return Ok(format!("Model {} not found", model_type));
    }

    // Clear the loaded context if deleting current model
    {
        let mut context = state.context.lock().unwrap();
        *context = None;
    }

    // Delete the file
    std::fs::remove_file(&model_path)
        .map_err(|e| format!("Failed to delete model: {}", e))?;

    log::info!("Model {} deleted successfully", model_name);

    Ok(format!("Model {} deleted successfully", model_type))
}

fn load_whisper_context(model_path: &PathBuf) -> Result<WhisperContext, String> {
    log::info!("Loading Whisper model from {:?}", model_path);

    let params = WhisperContextParameters::default();

    WhisperContext::new_with_params(model_path.to_str().unwrap(), params)
        .map_err(|e| format!("Failed to load Whisper model: {}", e))
}

#[tauri::command]
pub async fn transcribe_audio(
    app_handle: tauri::AppHandle,
    state: State<'_, WhisperState>,
    audio_data: Vec<u8>,
) -> Result<TranscriptionResult, String> {
    log::info!("Transcribing audio, size: {} bytes", audio_data.len());

    // Get model status
    let status = get_model_status(app_handle.clone(), state.clone()).await?;

    if !status.is_downloaded {
        return Err("No Whisper model downloaded. Please download a model first.".to_string());
    }

    let model_path = PathBuf::from(status.model_path.unwrap());

    // Load or get existing context
    let mut context_guard = state.context.lock().unwrap();

    if context_guard.is_none() {
        log::info!("Loading Whisper context for first use");
        *context_guard = Some(load_whisper_context(&model_path)?);
    }

    let ctx = context_guard.as_mut().unwrap();

    // Decode WAV data using hound
    let cursor = std::io::Cursor::new(audio_data);
    let mut reader = hound::WavReader::new(cursor)
        .map_err(|e| format!("Failed to read WAV data: {}", e))?;

    let spec = reader.spec();

    // Convert to f32 samples (Whisper expects f32)
    let samples: Vec<f32> = match spec.sample_format {
        hound::SampleFormat::Float => {
            reader
                .samples::<f32>()
                .collect::<Result<Vec<f32>, _>>()
                .map_err(|e| format!("Failed to read samples: {}", e))?
        }
        hound::SampleFormat::Int => {
            reader
                .samples::<i16>()
                .map(|s| s.map(|sample| sample as f32 / 32768.0))
                .collect::<Result<Vec<f32>, _>>()
                .map_err(|e| format!("Failed to read samples: {}", e))?
        }
    };

    // If stereo, convert to mono by averaging channels
    let mono_samples: Vec<f32> = if spec.channels == 2 {
        samples
            .chunks(2)
            .map(|chunk| (chunk[0] + chunk[1]) / 2.0)
            .collect()
    } else {
        samples
    };

    log::info!("Audio specs: {} Hz, {} channels, {} samples",
               spec.sample_rate, spec.channels, mono_samples.len());

    // Create parameters for transcription
    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });

    // Configure for English-only
    params.set_language(Some("en"));
    params.set_translate(false);
    params.set_print_special(false);
    params.set_print_progress(false);
    params.set_print_realtime(false);
    params.set_print_timestamps(false);

    // Run transcription
    let mut state_obj = ctx.create_state()
        .map_err(|e| format!("Failed to create Whisper state: {}", e))?;

    state_obj
        .full(params, &mono_samples)
        .map_err(|e| format!("Failed to run transcription: {}", e))?;

    // Get number of segments
    let num_segments = state_obj
        .full_n_segments()
        .map_err(|e| format!("Failed to get segments: {}", e))?;

    log::info!("Transcription complete, {} segments", num_segments);

    // Extract text from all segments
    let mut full_text = String::new();
    for i in 0..num_segments {
        let segment = state_obj
            .full_get_segment_text(i)
            .map_err(|e| format!("Failed to get segment text: {}", e))?;
        full_text.push_str(&segment);
        full_text.push(' ');
    }

    let final_text = full_text.trim().to_string();
    log::info!("Transcription result: {}", final_text);

    Ok(TranscriptionResult {
        text: final_text,
        success: true,
    })
}
