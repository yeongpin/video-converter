const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { BrowserWindow, app } = require('electron');
const fs = require('fs');
const isDev = require('electron-is-dev');

// get ffmpeg and ffprobe path
function getBinaryPath(binaryName) {
    if (isDev) {
        // development environment
        const devPath = path.join(__dirname, '../../external/ffmpeg/bin', `${binaryName}${process.platform === 'win32' ? '.exe' : ''}`);
        if (fs.existsSync(devPath)) {
            return devPath;
        }
        // fallback to global ffmpeg if not found in development path
        return binaryName;
    } else {
        // production environment
        const resourcesPath = process.resourcesPath;
        const extension = process.platform === 'win32' ? '.exe' : '';
        return path.join(resourcesPath, 'external', 'ffmpeg', 'bin', `${binaryName}${extension}`);
    }
}

// set ffmpeg path
const ffmpegPath = getBinaryPath('ffmpeg');
const ffprobePath = getBinaryPath('ffprobe');

console.log('FFmpeg Path:', ffmpegPath);
console.log('FFprobe Path:', ffprobePath);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// supported input formats
const supportedInputFormats = [
    'mkv', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', 'ts'
];

// encoder options
const encoders = {
    'h264': {
        codec: 'libx264',
        options: {
            normal: ['-profile:v', 'high', '-level', '4.2'],
            hdr: [], // h264 does not support HDR
            toHDR: [] // h264 does not support HDR
        }
    },
    'h265': {
        codec: 'libx265',
        options: {
            normal: ['-tag:v', 'hvc1'],
            hdr: [
                '-color_primaries', 'bt2020',
                '-color_trc', 'smpte2084',
                '-colorspace', 'bt2020nc',
                '-color_range', 'tv',
                '-x265-params',
                'hdr-opt=1:repeat-headers=1:colorprim=bt2020:transfer=smpte2084:colormatrix=bt2020nc:master-display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(10000000,1):max-cll=1000,400'
            ],
            toHDR: [
                // SDR to HDR conversion parameters
                '-vf', 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt2020:t=smpte2084:m=bt2020nc:r=tv,format=yuv420p10le',
                '-color_primaries', 'bt2020',
                '-color_trc', 'smpte2084',
                '-colorspace', 'bt2020nc',
                '-color_range', 'tv',
                '-x265-params',
                'hdr-opt=1:repeat-headers=1:colorprim=bt2020:transfer=smpte2084:colormatrix=bt2020nc:master-display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(10000000,1):max-cll=1000,400'
            ],
            toSDR: [
                // HDR to SDR conversion parameters
                '-vf', 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p'
            ]
        }
    }
};

async function getVideoInfo(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }

            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
            const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

            const info = {
                duration: metadata.format.duration,
                size: metadata.format.size,
                bitrate: metadata.format.bit_rate,
                isHDR: videoStream ? (
                    videoStream.color_space === 'bt2020nc' ||
                    videoStream.color_transfer === 'smpte2084' ||
                    videoStream.color_primaries === 'bt2020'
                ) : false,
                width: videoStream ? videoStream.width : null,
                height: videoStream ? videoStream.height : null,
                fps: videoStream ? eval(videoStream.r_frame_rate) : null,
                videoCodec: videoStream ? videoStream.codec_name : null,
                audioCodec: audioStream ? audioStream.codec_name : null,
                channels: audioStream ? audioStream.channels : null
            };

            resolve(info);
        });
    });
}

async function convertVideo(inputPath, outputPath, options = {}) {
    // get video info
    const videoInfo = await getVideoInfo(inputPath);
    
    return new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath);
        const mainWindow = BrowserWindow.getFocusedWindow();
        let startTime;
        
        const {
            encoder = 'h264',
            preset = 'medium',
            crf = '23',
            isLossless = false,
            audioBitrate = '320k',
            resolution = 'original',
            hdrMode = 'keep',
            format = 'mp4'  // 添加format选项，默认为mp4
        } = options;

        // get input file name (without extension)
        const inputFileName = path.basename(inputPath, path.extname(inputPath));
        
        // 根据选择的格式设置输出扩展名
        let outputExt;
        switch (format.toLowerCase()) {
            case 'mp4':
                outputExt = '.mp4';
                break;
            case 'mkv':
                outputExt = '.mkv';
                break;
            case 'mov':
                outputExt = '.mov';
                break;
            case 'webm':
                outputExt = '.webm';
                break;
            case 'avi':
                outputExt = '.avi';
                break;
            case 'flv':
                outputExt = '.flv';
                break;
            case 'wmv':
                outputExt = '.wmv';
                break;
            case 'm4v':
                outputExt = '.m4v';
                break;
            case 'ts':
                outputExt = '.ts';
                break;
            default:
                outputExt = '.mp4';  // 默认使用mp4
        }

        // build new output file name with correct extension
        const outputFileName = `${inputFileName}-converted${outputExt}`;
        
        // ensure output path exists and create full output path
        fs.mkdirSync(outputPath, { recursive: true });
        const finalOutputPath = path.join(outputPath, outputFileName);

        try {
            // show current resolution
            mainWindow.webContents.send('video-info', {
                width: videoInfo.width,
                height: videoInfo.height,
                isHDR: videoInfo.isHDR
            });

            if (isLossless) {
                command
                    .outputOptions(['-c:v', 'copy', '-c:a', 'copy'])
                    .output(finalOutputPath);
            } else {
                const encoderConfig = encoders[encoder];
                if (!encoderConfig) {
                    throw new Error(`Unsupported encoder: ${encoder}`);
                }

                // 根据输出格式设置编码器
                let videoCodec = encoderConfig.codec;
                if (format === 'webm') {
                    videoCodec = 'libvpx-vp9';
                } else if (format === 'wmv') {
                    videoCodec = 'wmv2';
                }

                const baseOptions = [
                    '-c:v', videoCodec,
                    '-preset', preset,
                    '-crf', crf,
                    '-movflags', '+faststart',
                    '-c:a', format === 'webm' ? 'libvorbis' : 'aac',
                    '-b:a', audioBitrate
                ];

                command.outputOptions(baseOptions);

                // HDR processing logic
                if (hdrMode === 'force-hdr' && !videoInfo.isHDR) {
                    command.outputOptions(encoderConfig.options.toHDR);
                } else if (hdrMode === 'force-sdr' && videoInfo.isHDR) {
                    command.outputOptions(encoderConfig.options.toSDR);
                } else if (videoInfo.isHDR) {
                    command.outputOptions(encoderConfig.options.hdr);
                } else {
                    command.outputOptions(encoderConfig.options.normal);
                }

                // add resolution adjustment
                if (resolution !== 'original') {
                    const [width, height] = resolution.split('x').map(Number);
                    command.size(`${width}x${height}`);
                }

                command.output(finalOutputPath);
            }

            command
                .on('start', (commandLine) => {
                    console.log('FFmpeg command:', commandLine);
                    startTime = Date.now();
                    mainWindow.webContents.send('conversion-progress', {
                        percent: 0,
                        speed: '0x',
                        time: '00:00:00',
                        size: '0MB',
                        eta: 'calculating...',
                        status: 'Starting conversion...'
                    });
                })
                .on('progress', (progress) => {
                    const currentTime = Date.now();
                    const elapsedTime = (currentTime - startTime) / 1000; // 转换为秒
                    
                    // 计算预计剩余时间（ETA）
                    const percent = progress.percent || 0;
                    let eta = 'calculating...';
                    if (percent > 0) {
                        const totalTime = (elapsedTime * 100) / percent;
                        const remainingTime = totalTime - elapsedTime;
                        eta = formatTime(remainingTime);
                    }

                    // 格式化当前处理时间
                    const processedTime = formatTime(elapsedTime);

                    // 计算文件大小
                    const size = progress.targetSize 
                        ? `${(progress.targetSize / 1024 / 1024).toFixed(2)}MB`
                        : 'calculating...';

                    mainWindow.webContents.send('conversion-progress', {
                        percent: Math.round(percent),
                        speed: progress.currentFps ? `${progress.currentFps} fps` : 'N/A',
                        time: processedTime,
                        size: size,
                        eta: eta,
                        status: 'Converting...'
                    });
                })
                .on('end', () => {
                    const endTime = Date.now();
                    const totalTime = formatTime((endTime - startTime) / 1000);
                    
                    // 获取输出文件大小
                    const stats = fs.statSync(finalOutputPath);
                    const finalSize = `${(stats.size / 1024 / 1024).toFixed(2)}MB`;

                    mainWindow.webContents.send('conversion-progress', {
                        percent: 100,
                        speed: 'Done',
                        time: totalTime,
                        size: finalSize,
                        eta: '00:00:00',
                        status: 'Completed!',
                        outputPath: finalOutputPath
                    });
                    resolve({ success: true, outputPath: finalOutputPath });
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                .run();
        } catch (error) {
            console.error('Conversion error:', error);
            reject(error);
        }
    });
}

// 时间格式化函数
function formatTime(seconds) {
    seconds = Math.round(seconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

module.exports = {
    convertVideo,
    getVideoInfo,
    supportedInputFormats,
    encoders
}; 