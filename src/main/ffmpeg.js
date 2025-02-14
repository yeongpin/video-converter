const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { BrowserWindow, app } = require('electron');
const fs = require('fs');

// get ffmpeg and ffprobe path
function getBinaryPath(binaryName) {
    if (process.env.NODE_ENV === 'development') {
        // development use global installed ffmpeg
        return binaryName;
    } else {
        // production use bundled ffmpeg
        const resourcesPath = process.resourcesPath;
        const platform = process.platform;
        const extension = platform === 'win32' ? '.exe' : '';
        return path.join(resourcesPath, 'external', 'ffmpeg', 'bin', `${binaryName}${extension}`);
    }
}

// set ffmpeg path
const ffmpegPath = getBinaryPath('ffmpeg');
const ffprobePath = getBinaryPath('ffprobe');

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
        
        // get input file name (without extension) and extension
        const inputFileName = path.basename(inputPath, path.extname(inputPath));
        const outputExt = path.extname(inputPath);
        // build new output file name
        const outputFileName = `${inputFileName}-converted${outputExt}`;
        // ensure output path exists and create full output path
        fs.mkdirSync(outputPath, { recursive: true });
        const finalOutputPath = path.join(outputPath, outputFileName);

        const {
            encoder = 'h264',
            preset = 'medium',
            crf = '23',
            isLossless = false,
            audioBitrate = '320k',
            resolution = 'original',
            hdrMode = 'keep'
        } = options;

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

                const baseOptions = [
                    '-c:v', encoderConfig.codec,
                    '-preset', preset,
                    '-crf', crf,
                    '-movflags', '+faststart',
                    '-c:a', 'aac',
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
                    if (progress.percent) {
                        const currentTime = Date.now();
                        const elapsedTime = (currentTime - startTime) / 1000;
                        const percentComplete = progress.percent;
                        const estimatedTotalTime = (elapsedTime / percentComplete) * 100;
                        const remainingTime = estimatedTotalTime - elapsedTime;
                        const eta = new Date(remainingTime * 1000).toISOString().substr(11, 8);

                        mainWindow.webContents.send('conversion-progress', {
                            percent: Math.round(percentComplete),
                            speed: progress.currentFps ? `${progress.currentFps} fps` : 'N/A',
                            time: progress.timemark,
                            size: progress.targetSize ? `${Math.round(progress.targetSize / 1024 / 1024)}MB` : 'N/A',
                            eta: eta,
                            status: 'Converting...'
                        });
                    }
                })
                .on('end', () => {
                    mainWindow.webContents.send('conversion-progress', {
                        percent: 100,
                        speed: 'Done',
                        time: videoInfo.duration,
                        size: `${Math.round(videoInfo.size / 1024 / 1024)}MB`,
                        eta: '00:00:00',
                        status: 'Completed!',
                        outputPath: finalOutputPath
                    });
                    resolve({ success: true, outputPath: finalOutputPath });
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    mainWindow.webContents.send('conversion-error', err.message);
                    reject(err);
                });

            command.run();

        } catch (error) {
            console.error('Conversion setup error:', error);
            mainWindow.webContents.send('conversion-error', error.message);
            reject(error);
        }
    });
}

module.exports = {
    convertVideo,
    getVideoInfo,
    supportedInputFormats,
    encoders
}; 