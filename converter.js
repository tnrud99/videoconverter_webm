#!/usr/bin/env node

/**
 * WebM to MP4 Converter
 * 간단한 비디오 변환 도구
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

// 개발 모드 확인 (Electron이 아닌 환경에서도 작동)
let isDev = false;
try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        isDev = true;
    }
} catch (e) {
    // ignore
}

// ANSI 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// FFmpeg 경로 설정
let ffmpegPath, ffprobePath;

// Electron 앱이 패키징된 경우 경로 처리
// Use process.resourcesPath to detect packaged app (more reliable than requiring electron)
const isPackaged = !!process.resourcesPath;
const appPath = isPackaged ? process.resourcesPath : __dirname;

try {
    const ffmpegStatic = require('ffmpeg-static');
    // 패키징된 앱에서는 app.asar.unpacked 경로 확인
    if (isPackaged && ffmpegStatic && ffmpegStatic.includes('app.asar')) {
        // app.asar를 app.asar.unpacked로 변경
        ffmpegPath = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
        // 파일이 실제로 존재하는지 확인
        if (!fs.existsSync(ffmpegPath)) {
            // 대체 경로 시도: resources/app.asar.unpacked/node_modules/ffmpeg-static/...
            const resourcesPath = process.resourcesPath || path.dirname(appPath);
            const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked');
            const altPath = path.join(unpackedPath, 'node_modules', 'ffmpeg-static', path.basename(ffmpegStatic));
            if (fs.existsSync(altPath)) {
                ffmpegPath = altPath;
            } else {
                // 원본 경로 사용
                ffmpegPath = ffmpegStatic;
            }
        }
    } else {
        ffmpegPath = ffmpegStatic;
    }
} catch (e) {
    // ffmpeg-static not found, will try system ffmpeg
    // Silent in production, log only in development
}

try {
    const ffprobeStatic = require('ffprobe-static');
    ffprobePath = ffprobeStatic.path;
    // 패키징된 앱에서는 app.asar.unpacked 경로 확인
    if (isPackaged && ffprobePath && ffprobePath.includes('app.asar')) {
        ffprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked');
        // 파일이 실제로 존재하는지 확인
        if (!fs.existsSync(ffprobePath)) {
            const resourcesPath = process.resourcesPath || path.dirname(appPath);
            const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked');
            const altPath = path.join(unpackedPath, 'node_modules', 'ffprobe-static', path.basename(ffprobePath));
            if (fs.existsSync(altPath)) {
                ffprobePath = altPath;
            } else {
                ffprobePath = ffprobeStatic.path;
            }
        }
    }
} catch (e) {
    // ffprobe-static not found, will try system ffprobe
    // Silent in production, log only in development
}

// ffmpeg 경로 설정
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
} else {
    // Fallback: check if system ffmpeg is available (dev/unbundled only; packaged app uses ffmpeg-static)
    const { execSync } = require('child_process');
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
    } catch (e) {
        log('⚠️  FFmpeg를 찾을 수 없습니다. ffmpeg-static 패키지가 필요합니다.', 'yellow');
    }
}

if (ffprobePath) {
    ffmpeg.setFfprobePath(ffprobePath);
}

function formatTime(seconds) {
    if (typeof seconds === 'string') {
        // If it's already a formatted time string, return as is
        return seconds;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTimeString(timeString) {
    // Parse FFmpeg time format (HH:MM:SS.ms or MM:SS.ms)
    if (!timeString || timeString === '-') return 0;
    
    const parts = timeString.split(':');
    if (parts.length === 3) {
        // HH:MM:SS format
        const hours = parseFloat(parts[0]) || 0;
        const minutes = parseFloat(parts[1]) || 0;
        const seconds = parseFloat(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
        // MM:SS format
        const minutes = parseFloat(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        return minutes * 60 + seconds;
    }
    return 0;
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Store current command for cancellation
let currentCommand = null;

function convertVideo(inputPath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
        // 콘솔 환경인지 확인
        const isConsole = typeof process !== 'undefined' && process.stdout;
        
        if (isConsole) {
            log(`\n${'='.repeat(60)}`, 'cyan');
            log('📹 비디오 변환 시작', 'bright');
            log(`${'='.repeat(60)}`, 'cyan');
            log(`입력 파일: ${inputPath}`, 'blue');
            log(`출력 파일: ${outputPath}`, 'blue');
        }

        // 입력 파일 확인
        if (!fs.existsSync(inputPath)) {
            reject(new Error(`입력 파일을 찾을 수 없습니다: ${inputPath}`));
            return;
        }

        const inputStats = fs.statSync(inputPath);
        if (isConsole) {
            log(`파일 크기: ${formatSize(inputStats.size)}`, 'blue');
        }

        let lastProgress = 0;
        let videoDuration = null;
        const progressCallback = options.onProgress || (() => {});
        const MIN_PROGRESS_INCREMENT = 1; // Update progress in 1% increments

        // Get video duration first for accurate progress calculation
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (!err && metadata && metadata.format && metadata.format.duration) {
                videoDuration = parseFloat(metadata.format.duration);
                if (isConsole) {
                    log(`비디오 길이: ${formatTime(videoDuration)}`, 'blue');
                }
            }
            
            // Start conversion after getting duration (or if failed to get duration)
            startConversion();
        });
        
        function startConversion() {
            // Get options with defaults
            const crf = options.crf || 23;
            const preset = options.preset || 'medium';
            const audioBitrate = options.audioBitrate || 192;
            const scaleFilter = options.scaleFilter;

            const command = ffmpeg(inputPath);
            currentCommand = command; // Store for cancellation
        
        // Add video filter for resolution scaling if needed
        if (scaleFilter) {
            command.videoFilters(scaleFilter);
        }
        
        // Software encoding (libx264)
        const outputOptions = [];
        outputOptions.push('-c:v libx264');
        outputOptions.push(`-preset ${preset}`);
        outputOptions.push(`-crf ${crf}`);
        
        // Common audio options
        outputOptions.push('-c:a aac');
        outputOptions.push(`-b:a ${audioBitrate}k`);
        outputOptions.push('-movflags +faststart');
        
        command.outputOptions(outputOptions)
            .output(outputPath)
            .on('start', (commandLine) => {
                if (isConsole) {
                    log('\n🔧 FFmpeg 명령어:', 'yellow');
                    log(commandLine, 'yellow');
                    log('\n⏳ 변환 중...', 'yellow');
                }
                // Don't show progress until we get real progress from FFmpeg
                // Just show "Processing..." message
                progressCallback({ percent: 0, time: 'Processing...' });
                lastProgress = 0;
            })
            .on('progress', (progress) => {
                let percent = 0;
                let hasValidProgress = false;
                
                // Debug: Log progress event (only in development)
                if (isConsole && process.env.DEBUG) {
                    console.log('Progress event:', {
                        timemark: progress.timemark,
                        percent: progress.percent,
                        videoDuration: videoDuration,
                        frames: progress.frames
                    });
                }
                
                // Calculate percent based on timemark and duration if available
                if (videoDuration && progress.timemark) {
                    const timemarkSeconds = parseTimeString(progress.timemark);
                    if (timemarkSeconds > 0 && videoDuration > 0) {
                        percent = Math.min(Math.round((timemarkSeconds / videoDuration) * 100), 99);
                        hasValidProgress = true;
                    }
                } else if (progress.percent && typeof progress.percent === 'number' && progress.percent > 0) {
                    // Fallback to FFmpeg's percent if available and valid
                    percent = Math.round(progress.percent);
                    hasValidProgress = true;
                }
                
                // Always send progress event, even if percent is 0
                // This ensures the UI knows conversion is happening
                if (hasValidProgress && (percent >= lastProgress + MIN_PROGRESS_INCREMENT || percent >= 99)) {
                    if (isConsole) {
                        process.stdout.write(`\r진행률: ${percent}% (${formatTime(progress.timemark)})`);
                    }
                    progressCallback({ 
                        percent: percent, 
                        time: formatTime(progress.timemark) 
                    });
                    lastProgress = percent;
                } else if (!hasValidProgress) {
                    // Even without valid percent, send progress with timemark to show activity
                    progressCallback({ 
                        percent: null, 
                        time: progress.timemark || 'Processing...' 
                    });
                }
            })
            .on('end', () => {
                currentCommand = null; // Clear command reference
                if (isConsole) {
                    process.stdout.write('\n');
                    log('\n✅ 변환 완료!', 'green');
                    
                    if (fs.existsSync(outputPath)) {
                        const outputStats = fs.statSync(outputPath);
                        const sizeDiff = ((outputStats.size - inputStats.size) / inputStats.size * 100).toFixed(1);
                        
                        log(`출력 파일 크기: ${formatSize(outputStats.size)}`, 'green');
                        log(`크기 변화: ${sizeDiff > 0 ? '+' : ''}${sizeDiff}%`, 'green');
                        log(`출력 경로: ${outputPath}`, 'green');
                    }
                    
                    log(`${'='.repeat(60)}\n`, 'cyan');
                }
                progressCallback({ percent: 100, time: 'Complete!' });
                resolve(outputPath);
            })
            .on('error', (err, stdout, stderr) => {
                currentCommand = null; // Clear command reference
                if (isConsole) {
                    process.stdout.write('\n');
                    log('\n❌ 변환 실패!', 'red');
                    log(`에러: ${err.message}`, 'red');
                    if (stderr) {
                        log(`\nFFmpeg 출력:\n${stderr}`, 'red');
                    }
                    log(`${'='.repeat(60)}\n`, 'cyan');
                }
                reject(err);
            });
            
            command.run();
        }
    });
}

function findFFmpeg() {
    // CLI-only: check if system ffmpeg is available (packaged app uses ffmpeg-static)
    const { execSync } = require('child_process');
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

// 메인 함수
async function main() {
    const args = process.argv.slice(2);

    // 도움말
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        log('\n📹 WebM to MP4 변환기', 'bright');
        log('='.repeat(60), 'cyan');
        log('\n사용법:', 'yellow');
        log('  node converter.js <입력파일> [출력파일]', 'blue');
        log('\n예시:', 'yellow');
        log('  node converter.js video.webm', 'blue');
        log('  node converter.js video.webm output.mp4', 'blue');
        log('\n옵션:', 'yellow');
        log('  -h, --help     도움말 표시', 'blue');
        log('\n참고:', 'yellow');
        log('  - 입력 파일만 지정하면 자동으로 .mp4 확장자로 변환됩니다', 'blue');
        log('  - FFmpeg가 시스템에 설치되어 있어야 합니다', 'blue');
        log('  - 또는 ffmpeg-static 패키지가 자동으로 사용됩니다\n', 'blue');
        return;
    }

    const inputPath = args[0];
    let outputPath = args[1];

    // 출력 경로가 없으면 자동 생성
    if (!outputPath) {
        const ext = path.extname(inputPath);
        const baseName = path.basename(inputPath, ext);
        const dir = path.dirname(inputPath);
        outputPath = path.join(dir, `${baseName}.mp4`);
    }

    // 절대 경로로 변환
    const absoluteInput = path.resolve(inputPath);
    const absoluteOutput = path.resolve(outputPath);

    // 출력 파일이 이미 존재하는지 확인
    if (fs.existsSync(absoluteOutput)) {
        log(`\n⚠️  출력 파일이 이미 존재합니다: ${absoluteOutput}`, 'yellow');
        log('덮어쓰시겠습니까? (y/n): ', 'yellow');
        
        // 간단한 확인 (실제로는 readline 사용 권장)
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        process.stdin.once('data', async (key) => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            
            if (key.toString().toLowerCase() === 'y' || key.toString().toLowerCase() === '\r') {
                try {
                    await convertVideo(absoluteInput, absoluteOutput);
                    process.exit(0);
                } catch (error) {
                    log(`\n에러: ${error.message}`, 'red');
                    process.exit(1);
                }
            } else {
                log('\n취소되었습니다.', 'yellow');
                process.exit(0);
            }
        });
    } else {
        try {
            await convertVideo(absoluteInput, absoluteOutput);
            process.exit(0);
        } catch (error) {
            log(`\n에러: ${error.message}`, 'red');
            process.exit(1);
        }
    }
}

// 실행
if (require.main === module) {
    main().catch(error => {
        log(`\n치명적 에러: ${error.message}`, 'red');
        process.exit(1);
    });
}

function cancelConversion() {
    if (currentCommand) {
        try {
            currentCommand.kill('SIGTERM');
            currentCommand = null;
            return true;
        } catch (error) {
            console.error('Error cancelling conversion:', error);
            return false;
        }
    }
    return false;
}

module.exports = { convertVideo, cancelConversion };
