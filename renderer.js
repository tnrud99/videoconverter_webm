// Prevent duplicate execution - wrap in IIFE
(function() {
    'use strict';
    
    if (window.rendererInitialized) {
        console.warn('Renderer script already initialized');
        return;
    }
    window.rendererInitialized = true;

let selectedInputFile = null;
let selectedOutputFile = null;
let isConverting = false;
let currentFileSize = 0; // Store file size for time estimation

// DOM elements
const dropZone = document.getElementById('dropZone');
const selectBtn = document.getElementById('selectBtn');
const fileInfo = document.getElementById('fileInfo');
const optionsPanel = document.getElementById('optionsPanel');
const inputFileName = document.getElementById('inputFileName');
const fileSize = document.getElementById('fileSize');
const outputFileName = document.getElementById('outputFileName');
const changeOutputBtn = document.getElementById('changeOutputBtn');
const convertBtn = document.getElementById('convertBtn');
const cancelBtn = document.getElementById('cancelBtn');
const resetBtn = document.getElementById('resetBtn');
const progressContainer = document.getElementById('progressContainer');
const progressMessage = document.getElementById('progressMessage');
const status = document.getElementById('status');
const infoPopup = document.getElementById('infoPopup');
const infoPopupText = document.getElementById('infoPopupText');
const infoPopupClose = document.getElementById('infoPopupClose');

// Time tracking for ETA calculation
let conversionStartTime = null;
let lastElapsedSeconds = 0;
let progressUpdateInterval = null;
let lastKnownPercent = 0; // Track last known progress percent

// Options elements
const resolution = document.getElementById('resolution');
const resolutionHelp = document.getElementById('resolutionHelp');
const qualityPreset = document.getElementById('qualityPreset');
const qualityHelp = document.getElementById('qualityHelp');
const audioBitrate = document.getElementById('audioBitrate');

// Utility functions
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
}

function hideStatus() {
    status.style.display = 'none';
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

function parseTimeString(timeString) {
    // Parse FFmpeg time format (HH:MM:SS.ms or MM:SS.ms)
    if (!timeString || timeString === '-') return 0;
    
    const parts = timeString.split(':');
    if (parts.length === 3) {
        // HH:MM:SS format
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseFloat(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
        // MM:SS format
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        return minutes * 60 + seconds;
    }
    return 0;
}

// Calculate estimated time based on file size (100MB per minute)
function calculateEstimatedTime(fileSizeMB) {
    // 100MB per minute = 1MB per 0.01 minute = 0.6 seconds per MB
    const secondsPerMB = 60 / 100; // 0.6 seconds per MB
    const estimatedSeconds = Math.ceil(fileSizeMB * secondsPerMB);
    return estimatedSeconds;
}

// Determine conversion step based on elapsed time only
// Assume progress events are unreliable, so use time-based estimation
function getConversionStep(elapsedSeconds, estimatedTotalSeconds) {
    // If we don't have time info, default to step 1
    if (elapsedSeconds === null || estimatedTotalSeconds === null || estimatedTotalSeconds <= 0) {
        return {
            step: 1,
            totalSteps: 3,
            name: 'Initializing',
            stepTime: 0.1
        };
    }
    
    // Calculate progress ratio based on elapsed time
    const progressRatio = elapsedSeconds / estimatedTotalSeconds;
    
    // Step 1: Analyzing video (0-10% of estimated time)
    // Step 1 should take about 10% of total time
    const step1Duration = estimatedTotalSeconds * 0.1;
    
    if (elapsedSeconds < step1Duration) {
        return {
            step: 1,
            totalSteps: 3,
            name: 'Analyzing video',
            stepTime: 0.1
        };
    }
    
    // Step 2: Encoding video (10-90% of estimated time)
    // Step 2 should take about 80% of total time
    const step2EndTime = estimatedTotalSeconds * 0.9;
    
    if (elapsedSeconds < step2EndTime) {
        return {
            step: 2,
            totalSteps: 3,
            name: 'Encoding video',
            stepTime: 0.8
        };
    }
    
    // Step 3: Finalizing (90-100% of estimated time)
    // Step 3 should take about 10% of total time
    return {
        step: 3,
        totalSteps: 3,
        name: 'Finalizing',
        stepTime: 0.1
    };
}

function updateProgress(percent, time) {
    if (!conversionStartTime || currentFileSize === 0) return;
    
    // Update last known percent if provided
    if (percent !== null && percent !== undefined && !isNaN(percent)) {
        lastKnownPercent = Math.max(lastKnownPercent, percent);
    }
    
    // Calculate elapsed time
    const elapsedMs = Date.now() - conversionStartTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const elapsedSecs = elapsedSeconds % 60;
    const elapsedTimeStr = `${elapsedMinutes}:${elapsedSecs.toString().padStart(2, '0')}`;
    
    // Calculate estimated total time (100MB per minute) with option multiplier
    const fileSizeMB = currentFileSize / (1024 * 1024);
    const baseEstimatedSeconds = calculateEstimatedTime(fileSizeMB);
    const multiplier = getTimeMultiplier();
    const estimatedTotalSeconds = Math.ceil(baseEstimatedSeconds * multiplier);
    const estimatedMinutes = Math.floor(estimatedTotalSeconds / 60);
    const estimatedSecs = estimatedTotalSeconds % 60;
    const estimatedTimeStr = `~${estimatedMinutes}:${estimatedSecs.toString().padStart(2, '0')}`;
    
    // Calculate remaining time
    let remainingSeconds = estimatedTotalSeconds - elapsedSeconds;
    if (remainingSeconds < 0) remainingSeconds = 0;
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecs = remainingSeconds % 60;
    const remainingTimeStr = `~${remainingMinutes}:${remainingSecs.toString().padStart(2, '0')}`;
    
    // Show time warning if elapsed time exceeds estimated time
    const progressTimeWarning = document.getElementById('progressTimeWarning');
    if (progressTimeWarning && estimatedTotalSeconds > 0) {
        // Show warning if elapsed time is 20% more than estimated
        if (elapsedSeconds > estimatedTotalSeconds * 1.2) {
            progressTimeWarning.style.display = 'block';
        } else {
            progressTimeWarning.style.display = 'none';
        }
    }
    
    // Determine current step based on elapsed time only
    // Assume progress events are unreliable
    const stepInfo = getConversionStep(elapsedSeconds, estimatedTotalSeconds);
    
    // Update progress message
    if (progressMessage) {
        progressMessage.textContent = 'Processing...';
    }
    
    // Update step information
    const stepText = document.getElementById('stepText');
    if (stepText) {
        stepText.textContent = `📋 Step ${stepInfo.step}/${stepInfo.totalSteps}: ${stepInfo.name}`;
        const progressStep = document.getElementById('progressStep');
        if (progressStep) {
            progressStep.style.display = 'block';
        }
    }
    
    // Update time information
    const elapsedTimeEl = document.getElementById('elapsedTime');
    const estimatedTimeEl = document.getElementById('estimatedTime');
    const remainingTimeEl = document.getElementById('remainingTime');
    
    if (elapsedTimeEl) elapsedTimeEl.textContent = elapsedTimeStr;
    if (estimatedTimeEl) estimatedTimeEl.textContent = estimatedTimeStr;
    if (remainingTimeEl) remainingTimeEl.textContent = remainingTimeStr;
    
    const progressTimeInfo = document.getElementById('progressTimeInfo');
    if (progressTimeInfo) {
        progressTimeInfo.style.display = 'block';
    }
    
    // Update file info
    const fileInfoText = document.getElementById('fileInfoText');
    if (fileInfoText) {
        fileInfoText.textContent = `📊 ${formatSize(currentFileSize)} file (approximately ${estimatedMinutes}:${estimatedSecs.toString().padStart(2, '0')})`;
        const progressFileInfo = document.getElementById('progressFileInfo');
        if (progressFileInfo) {
            progressFileInfo.style.display = 'block';
        }
    }
    
    // Show warning message
    const progressWarning = document.getElementById('progressWarning');
    if (progressWarning) {
        progressWarning.style.display = 'block';
    }
}

// Calculate time multiplier based on selected options
function getTimeMultiplier() {
    const res = resolution.value;
    const preset = qualityPreset.value;
    
    // Resolution multipliers (lower resolution = faster)
    let resolutionMultiplier = 1.0;
    if (res === '1080p') {
        resolutionMultiplier = 1.0; // Base
    } else if (res === '720p') {
        resolutionMultiplier = 0.7; // ~30% faster
    } else if (res === '480p') {
        resolutionMultiplier = 0.5; // ~50% faster
    } else if (res === '360p') {
        resolutionMultiplier = 0.3; // ~70% faster
    }
    
    // Quality multipliers (lower quality = faster)
    let qualityMultiplier = 1.0;
    if (preset === 'best') {
        qualityMultiplier = 1.5; // ~50% slower
    } else if (preset === 'high') {
        qualityMultiplier = 1.2; // ~20% slower
    } else if (preset === 'medium') {
        qualityMultiplier = 1.0; // Base
    } else if (preset === 'fast') {
        qualityMultiplier = 0.7; // ~30% faster
    }
    
    return resolutionMultiplier * qualityMultiplier;
}

// Update estimated time preview based on file size and selected options
function updateEstimatedTimePreview() {
    if (currentFileSize === 0) {
        const estimatedTimePreview = document.getElementById('estimatedTimePreview');
        if (estimatedTimePreview) {
            estimatedTimePreview.style.display = 'none';
        }
        return;
    }
    
    // Calculate base estimated time (100MB per minute for default: 1080p, high)
    const fileSizeMB = currentFileSize / (1024 * 1024);
    const baseEstimatedSeconds = calculateEstimatedTime(fileSizeMB);
    
    // Apply multiplier based on selected options
    const multiplier = getTimeMultiplier();
    const adjustedEstimatedSeconds = Math.ceil(baseEstimatedSeconds * multiplier);
    
    const estimatedMinutes = Math.floor(adjustedEstimatedSeconds / 60);
    const estimatedSecs = adjustedEstimatedSeconds % 60;
    
    // Format time string
    let timeStr;
    if (estimatedMinutes > 0) {
        timeStr = `~${estimatedMinutes}:${estimatedSecs.toString().padStart(2, '0')}`;
    } else {
        timeStr = `~${estimatedSecs} seconds`;
    }
    
    // Update UI
    const estimatedTimeValue = document.getElementById('estimatedTimeValue');
    const estimatedTimePreview = document.getElementById('estimatedTimePreview');
    
    if (estimatedTimeValue) {
        estimatedTimeValue.textContent = timeStr;
    }
    if (estimatedTimePreview) {
        estimatedTimePreview.style.display = 'block';
    }
}

// Get conversion options
function getConversionOptions() {
    const preset = qualityPreset.value;
    const res = resolution.value;
    let crf = 23;
    let presetValue = 'medium';
    let scaleFilter = null;

    // Resolution settings
    if (res === '1080p') {
        scaleFilter = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
    } else if (res === '720p') {
        scaleFilter = 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2';
    } else if (res === '480p') {
        scaleFilter = 'scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2';
    } else if (res === '360p') {
        scaleFilter = 'scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2';
    }

    // Quality settings (integrated with encoding speed)
    if (preset === 'best') {
        crf = 18;
        presetValue = 'slow';
    } else if (preset === 'high') {
        crf = 20;
        presetValue = 'slow';
    } else if (preset === 'medium') {
        crf = 23;
        presetValue = 'medium';
    } else if (preset === 'fast') {
        crf = 26;
        presetValue = 'fast';
    }

    return {
        crf: crf,
        preset: presetValue,
        audioBitrate: parseInt(audioBitrate.value) || 192,
        resolution: res,
        scaleFilter: scaleFilter
    };
}

// File selection
async function selectFile(filePath = null) {
    if (isConverting) return;
    
    try {
        // Check electronAPI
        if (typeof window === 'undefined' || !window.electronAPI) {
            console.error('window.electronAPI is not available');
            showStatus('Error: Application API not loaded. Please check the console and restart.', 'error');
            return;
        }
        
        const api = getElectronAPI();
        if (!api) {
            console.error('getElectronAPI() returned null/undefined');
            showStatus('Error: Application API not available.', 'error');
            return;
        }
        
        // If filePath is provided (from drag & drop), validate it
        if (filePath) {
            const ext = api.path.extname(filePath).toLowerCase();
            if (ext !== '.webm') {
                showStatus('❌ Only WebM files are supported. Please select a .webm file.', 'error');
                return;
            }
            await loadFile(filePath);
            return;
        }
        
        // Otherwise, open file dialog
        if (!api.selectFile) {
            console.error('electronAPI.selectFile is not available');
            console.log('Available API methods:', Object.keys(api));
            showStatus('Error: File selection is not available. Please wait a moment and try again.', 'error');
            return;
        }
        
        console.log('Calling electronAPI.selectFile...');
        const selectedPath = await api.selectFile();
        console.log('Selected file path:', selectedPath);
        
        if (selectedPath) {
            await loadFile(selectedPath);
        }
    } catch (error) {
        console.error('Error selecting file:', error);
        showStatus('Error selecting file: ' + error.message, 'error');
    }
}

// Load file
async function loadFile(filePath) {
    // Validate file extension
    const api = getElectronAPI();
    const ext = api.path.extname(filePath).toLowerCase();
    if (ext !== '.webm') {
        showStatus('❌ Only WebM files are supported. Please select a .webm file.', 'error');
        return;
    }
    
    selectedInputFile = filePath;
    
    // Get file info
    if (!api || !api.getFileInfo) {
        console.error('electronAPI.getFileInfo is not available');
        showStatus('Error: File info API not available.', 'error');
        return;
    }
    
    const info = await api.getFileInfo(filePath);
    
    if (info.exists) {
        inputFileName.textContent = info.name;
        fileSize.textContent = formatSize(info.size);
        currentFileSize = info.size; // Store file size for time estimation
        
        // Auto-generate output filename (remove .webm extension and replace with .mp4)
        const ext = api.path.extname(filePath);
        let baseName = api.path.basename(filePath, ext);
        // Remove .webm from filename if it exists (case insensitive)
        baseName = baseName.replace(/\.webm$/i, '');
        const dir = api.path.dirname(filePath);
        selectedOutputFile = api.path.join(dir, `${baseName}.mp4`);
        outputFileName.textContent = api.path.basename(selectedOutputFile);
        
        // Update drop zone to show selected file
        dropZone.classList.add('file-selected');
        const dropContent = dropZone.querySelector('.drop-content');
        if (dropContent) {
            // Truncate long file names
            const displayName = info.name.length > 40 ? info.name.substring(0, 37) + '...' : info.name;
            dropContent.innerHTML = `
                <div class="icon">✅</div>
                <p class="drop-text">File Selected</p>
                <p class="drop-subtext" style="word-break: break-all;">${displayName}</p>
                <p class="drop-subtext" style="margin-top: 5px;">Size: ${formatSize(info.size)}</p>
                <button class="btn btn-secondary" id="changeFileBtn" style="margin-top: 15px;">Select File</button>
            `;
            // Add event listener for change file button
            const changeFileBtn = dropZone.querySelector('#changeFileBtn');
            if (changeFileBtn) {
                changeFileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectFile();
                });
            }
        }
        
        fileInfo.style.display = 'block';
        optionsPanel.style.display = 'block';
        convertBtn.disabled = false;
        convertBtn.textContent = 'Start Conversion'; // Reset button text
        cancelBtn.style.display = 'none'; // Hide cancel button if visible
        resetBtn.style.display = 'none'; // Hide reset button if visible
        hideStatus();
        
        // Update help texts
        if (qualityHelp) {
            qualityHelp.textContent = qualityDescriptions[qualityPreset.value];
        }
        if (resolutionHelp) {
            resolutionHelp.textContent = resolutionDescriptions[resolution.value];
        }
        
        // Update estimated time preview
        updateEstimatedTimePreview();
    } else {
        showStatus('File not found.', 'error');
    }
}

// Change output file
async function changeOutputFile() {
    if (isConverting) return;
    
    const api = getElectronAPI();
    if (!api || !api.selectOutputFile) {
        console.error('electronAPI.selectOutputFile is not available');
        return;
    }
    
    const filePath = await api.selectOutputFile(selectedOutputFile);
    if (filePath) {
        selectedOutputFile = filePath;
        outputFileName.textContent = api.path.basename(filePath);
    }
}

// Start conversion
async function startConversion() {
    if (!selectedInputFile || !selectedOutputFile || isConverting) return;
    
    const options = getConversionOptions();
    
    isConverting = true;
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    cancelBtn.style.display = 'inline-block';
    progressContainer.style.display = 'block';
    if (progressMessage) {
        progressMessage.textContent = 'Processing...';
    }
    conversionStartTime = Date.now();
    lastElapsedSeconds = 0;
    lastKnownPercent = 0; // Reset progress tracking
    hideStatus();
    
    // Initialize progress display
    updateProgress(0, 'Processing...');
    
    // Start periodic time updates (every second)
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
    }
    progressUpdateInterval = setInterval(() => {
        if (isConverting && conversionStartTime) {
            updateProgress(null, null);
        }
    }, 1000);
    
    // Show warning message
    const progressWarning = document.getElementById('progressWarning');
    if (progressWarning) {
        progressWarning.style.display = 'block';
    }
    
    const api = getElectronAPI();
    
    // Register progress listener
    if (api && api.onProgress) {
        api.onProgress((progress) => {
            updateProgress(progress.percent, progress.time);
        });
    }
    
    try {
        if (!api || !api.convertVideo) {
            throw new Error('convertVideo API not available');
        }
        
        const result = await api.convertVideo(selectedInputFile, selectedOutputFile, options);
        
        // Clear progress update interval
        if (progressUpdateInterval) {
            clearInterval(progressUpdateInterval);
            progressUpdateInterval = null;
        }
        
        // Hide progress container on completion
        progressContainer.style.display = 'none';
        
        // Hide warning on completion
        const progressWarning = document.getElementById('progressWarning');
        if (progressWarning) {
            progressWarning.style.display = 'none';
        }
        
        if (result.success) {
            showStatus(`✅ Conversion complete! File: ${api.path.basename(result.outputPath)}`, 'success');
            convertBtn.textContent = 'Conversion Complete';
            cancelBtn.style.display = 'none';
            resetBtn.style.display = 'inline-block';
            
            // Open folder containing the converted file
            if (api && api.showItemInFolder) {
                api.showItemInFolder(result.outputPath);
            }
        } else {
            showStatus(`❌ Conversion failed: ${result.error}`, 'error');
            convertBtn.disabled = false;
            convertBtn.textContent = 'Retry';
            cancelBtn.style.display = 'none';
        }
    } catch (error) {
        showStatus(`❌ Error: ${error.message}`, 'error');
        convertBtn.disabled = false;
        convertBtn.textContent = 'Start Conversion';
        cancelBtn.style.display = 'none';
        
        // Hide warnings on error
        const progressWarning = document.getElementById('progressWarning');
        const progressTimeWarning = document.getElementById('progressTimeWarning');
        if (progressWarning) {
            progressWarning.style.display = 'none';
        }
        if (progressTimeWarning) {
            progressTimeWarning.style.display = 'none';
        }
    } finally {
        isConverting = false;
        // Clear progress update interval
        if (progressUpdateInterval) {
            clearInterval(progressUpdateInterval);
            progressUpdateInterval = null;
        }
    }
}

// Reset
function reset() {
    selectedInputFile = null;
    selectedOutputFile = null;
    currentFileSize = 0;
    lastKnownPercent = 0;
    
    // Clear progress update interval
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
        progressUpdateInterval = null;
    }
    
    // Hide warning messages
    const progressWarning = document.getElementById('progressWarning');
    const progressTimeWarning = document.getElementById('progressTimeWarning');
    if (progressWarning) {
        progressWarning.style.display = 'none';
    }
    if (progressTimeWarning) {
        progressTimeWarning.style.display = 'none';
    }
    
    // Hide progress UI elements
    const progressStep = document.getElementById('progressStep');
    const progressTimeInfo = document.getElementById('progressTimeInfo');
    const progressFileInfo = document.getElementById('progressFileInfo');
    const estimatedTimePreview = document.getElementById('estimatedTimePreview');
    if (progressStep) progressStep.style.display = 'none';
    if (progressTimeInfo) progressTimeInfo.style.display = 'none';
    if (progressFileInfo) progressFileInfo.style.display = 'none';
    if (estimatedTimePreview) estimatedTimePreview.style.display = 'none';
    
    // Restore drop zone to original state
    dropZone.classList.remove('file-selected');
    const dropContent = dropZone.querySelector('.drop-content');
    if (dropContent) {
        dropContent.innerHTML = `
            <div class="icon">📁</div>
            <p class="drop-text">Drag and drop your file here</p>
            <p class="drop-subtext">or click the button below</p>
            <button class="btn btn-primary" id="selectBtn">Select File</button>
        `;
        // Re-add event listener
        const selectBtn = dropZone.querySelector('#selectBtn');
        if (selectBtn) {
            selectBtn.addEventListener('click', selectFile);
        }
    }
    
    fileInfo.style.display = 'none';
    optionsPanel.style.display = 'none';
    progressContainer.style.display = 'none';
    convertBtn.disabled = true;
    convertBtn.textContent = 'Start Conversion';
    resetBtn.style.display = 'none';
    conversionStartTime = null;
    lastElapsedSeconds = 0;
    hideStatus();
    
    // Reset options to default
    resolution.value = '1080p';
    qualityPreset.value = 'high';
    audioBitrate.value = '256';
    if (qualityHelp) {
        qualityHelp.textContent = qualityDescriptions['high'];
    }
    if (resolutionHelp) {
        resolutionHelp.textContent = resolutionDescriptions['1080p'];
    }
}

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!isConverting) {
        dropZone.classList.add('drag-over');
    }
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    if (isConverting) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        const filePath = file.path;
        await selectFile(filePath);
    }
});

dropZone.addEventListener('click', () => {
    if (!isConverting) {
        selectFile();
    }
});

// Resolution descriptions
const resolutionDescriptions = {
    '1080p': '1080p - Best quality, larger file size',
    '720p': '720p - Balanced quality and speed',
    '480p': '480p - Medium quality, smaller file size',
    '360p': '360p - Lower quality, smallest file size'
};

// Quality preset descriptions
const qualityDescriptions = {
    'best': 'Preserves as much detail as the source allows.',
    'high': 'Best for high-res web video sources.',
    'medium': 'Balanced quality and conversion speed.',
    'fast': 'Smaller footprint, slight quality trade-off.'
};

// Resolution change handler
if (resolution) {
    resolution.addEventListener('change', () => {
        if (resolutionHelp) {
            resolutionHelp.textContent = resolutionDescriptions[resolution.value];
        }
        updateEstimatedTimePreview();
    });
}

// Quality preset change handler
if (qualityPreset) {
    qualityPreset.addEventListener('change', () => {
        if (qualityHelp) {
            qualityHelp.textContent = qualityDescriptions[qualityPreset.value];
        }
        updateEstimatedTimePreview();
    });
}

// Tab switching removed - no longer needed

// Event listeners
if (selectBtn) {
    selectBtn.addEventListener('click', () => {
        console.log('Select button clicked');
        selectFile();
    });
} else {
    console.error('selectBtn element not found');
}

if (changeOutputBtn) {
    changeOutputBtn.addEventListener('click', changeOutputFile);
}

if (convertBtn) {
    convertBtn.addEventListener('click', startConversion);
}

if (resetBtn) {
    resetBtn.addEventListener('click', reset);
}

// Cancel conversion
if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
        if (!isConverting) return;
        
        const api = getElectronAPI();
        if (api && api.cancelConversion) {
            const result = await api.cancelConversion();
            if (result.success) {
                // Clear progress update interval
                if (progressUpdateInterval) {
                    clearInterval(progressUpdateInterval);
                    progressUpdateInterval = null;
                }
                
                showStatus('⏹️ Conversion cancelled', 'error');
                convertBtn.disabled = false;
                convertBtn.textContent = 'Start Conversion';
                cancelBtn.style.display = 'none';
                isConverting = false;
                
                // Hide warnings
                const progressWarning = document.getElementById('progressWarning');
                const progressTimeWarning = document.getElementById('progressTimeWarning');
                if (progressWarning) {
                    progressWarning.style.display = 'none';
                }
                if (progressTimeWarning) {
                    progressTimeWarning.style.display = 'none';
                }
                
                // Hide progress UI elements
                const progressStep = document.getElementById('progressStep');
                const progressTimeInfo = document.getElementById('progressTimeInfo');
                const progressFileInfo = document.getElementById('progressFileInfo');
                if (progressStep) progressStep.style.display = 'none';
                if (progressTimeInfo) progressTimeInfo.style.display = 'none';
                if (progressFileInfo) progressFileInfo.style.display = 'none';
                
                // Reset progress
                progressContainer.style.display = 'none';
            }
        }
    });
}

// Info icon click handlers
function showInfoPopup(text) {
    if (infoPopup && infoPopupText) {
        infoPopupText.textContent = text;
        infoPopup.style.display = 'flex';
    }
}

function hideInfoPopup() {
    if (infoPopup) {
        infoPopup.style.display = 'none';
    }
}

const infoIcons = document.querySelectorAll('.info-icon');
infoIcons.forEach(icon => {
    icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const title = icon.getAttribute('title');
        if (title) {
            showInfoPopup(title);
        }
    });
});

// Close popup handlers
if (infoPopupClose) {
    infoPopupClose.addEventListener('click', hideInfoPopup);
}

if (infoPopup) {
    infoPopup.addEventListener('click', (e) => {
        if (e.target === infoPopup) {
            hideInfoPopup();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoPopup.style.display === 'flex') {
            hideInfoPopup();
        }
    });
}

// Initialize
hideStatus();

// Initialize help texts
if (qualityHelp) {
    qualityHelp.textContent = qualityDescriptions['high'];
}
if (resolutionHelp) {
    resolutionHelp.textContent = resolutionDescriptions['1080p'];
}

// electronAPI helper function
function getElectronAPI() {
    return window.electronAPI;
}

// Wait for electronAPI to be available
function waitForElectronAPI() {
    return new Promise((resolve) => {
        // Check immediately
        if (window.electronAPI) {
            console.log('electronAPI is available:', Object.keys(window.electronAPI));
            resolve();
            return;
        }
        
        // Check periodically
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.electronAPI) {
                clearInterval(checkInterval);
                console.log('electronAPI is available:', Object.keys(window.electronAPI));
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('electronAPI not available after 5 seconds');
                showStatus('Error: Application API not loaded. Please check the console and restart.', 'error');
                resolve(); // Continue even on timeout
            }
        }, 100);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('DOM loaded, waiting for electronAPI...');
        await waitForElectronAPI();
        console.log('Initialization complete');
    });
} else {
    // DOM already loaded
    console.log('DOM already loaded, waiting for electronAPI...');
    waitForElectronAPI().then(() => {
        console.log('Initialization complete');
    });
}

})(); // IIFE end
