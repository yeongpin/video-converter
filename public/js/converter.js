let currentOutputPath = null;
let completionDialog = document.getElementById('completionDialog');
let dialogContent = document.getElementById('dialogContent');
let openFileBtn = document.getElementById('openFileBtn');
let openFolderBtn = document.getElementById('openFolderBtn');
let closeDialogBtn = document.getElementById('closeDialogBtn');
let lastOutputPath = null;

document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const losslessOption = document.getElementById('losslessOption');
    const progressBar = document.getElementById('progress');
    const progressContainer = document.querySelector('.progress-container');
    const progressText = document.getElementById('progressText');
    const status = document.getElementById('status');
    const modeDescription = document.getElementById('modeDescription');
    const encodeOptions = document.getElementById('encodeOptions');
    const qualitySelect = document.getElementById('qualitySelect');
    const speedSelect = document.getElementById('speedSelect');
    const modeRadios = document.getElementsByName('conversionMode');
    const formatSelect = document.getElementById('formatSelect');
    const encoderSelect = document.getElementById('encoderSelect');
    const progressEta = document.getElementById('progressEta');
    const progressSpeed = document.getElementById('progressSpeed');
    const progressTime = document.getElementById('progressTime');
    const progressSize = document.getElementById('progressSize');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const currentResolution = document.getElementById('currentResolution');
    const hdrSelect = document.getElementById('hdrSelect');
    const currentHDR = document.getElementById('currentHDR');
    const hdrWarning = document.querySelector('.hdr-warning');

    let selectedFile = null;

    currentOutputPath = await window.electronAPI.getDefaultOutputPath();
    document.getElementById('outputPath').value = currentOutputPath;

    fileInput.addEventListener('change', async (e) => {
        selectedFile = e.target.files[0];
        if (selectedFile) {
            // reset all progress and status display
            convertBtn.disabled = false;
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
            progressSpeed.textContent = '';
            progressTime.textContent = '';
            progressSize.textContent = '';
            progressEta.textContent = '';
            status.textContent = `Selected file: ${selectedFile.name}`;
            
            try {
                const metadata = await window.electronAPI.getVideoMetadata(selectedFile.path);
                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                
                if (videoStream) {
                    const width = videoStream.width;
                    const height = videoStream.height;
                    currentResolution.textContent = `${width}x${height}`;
                    
                    // automatically select the closest resolution option
                    const resolutions = {
                        '3840x2160': 3840 * 2160,
                        '2560x1440': 2560 * 1440,
                        '1920x1080': 1920 * 1080,
                        '1280x720': 1280 * 720
                    };
                    
                    const currentPixels = width * height;
                    let closestResolution = 'original';
                    let minDiff = Infinity;
                    
                    Object.entries(resolutions).forEach(([res, pixels]) => {
                        const diff = Math.abs(pixels - currentPixels);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestResolution = res;
                        }
                    });
                    
                    resolutionSelect.value = 'original';
                }

                const isHDR = metadata.streams.some(stream => 
                    stream.color_space === 'bt2020nc' || 
                    stream.color_transfer === 'smpte2084' ||
                    stream.color_primaries === 'bt2020'
                );
                
                currentHDR.textContent = isHDR ? 'HDR' : 'SDR';
                hdrSelect.value = 'keep';
                
                if (isHDR) {
                    status.innerHTML = `Selected file: ${selectedFile.name}<br><span class="hdr-badge">HDR</span>`;
                }
            } catch (error) {
                console.error('Error getting video info:', error);
                currentResolution.textContent = 'Unknown';
                currentHDR.textContent = 'Unknown';
            }
        } else {
            // reset all status
            convertBtn.disabled = true;
            status.textContent = '';
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
            progressSpeed.textContent = '';
            progressTime.textContent = '';
            progressSize.textContent = '';
            progressEta.textContent = '';
            currentResolution.textContent = 'Checking...';
            currentHDR.textContent = 'Checking...';
        }
    });

    // listen conversion mode change
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isLossless = e.target.value === 'lossless';
            encodeOptions.style.display = isLossless ? 'none' : 'block';
            modeDescription.textContent = isLossless
                ? 'Current Mode: Lossless - Only changing container format without re-encoding'
                : 'Current Mode: Re-encoding - Converting video and audio for better compatibility';
        });
    });

    // listen HDR option change
    hdrSelect.addEventListener('change', (e) => {
        const isForceHDR = e.target.value === 'force-hdr';
        hdrWarning.style.display = isForceHDR ? 'block' : 'none';
    });

    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        try {
            progressContainer.style.display = 'block';
            convertBtn.disabled = true;
            status.textContent = 'Converting...';
            progressBar.style.width = '0%';
            progressText.textContent = '0%';

            const options = {
                inputPath: selectedFile.path,
                outputPath: currentOutputPath,  // use selected output directory
                options: {
                    encoder: encoderSelect.value,
                    isLossless: document.querySelector('input[name="conversionMode"]:checked').value === 'lossless',
                    preset: speedSelect.value,
                    crf: qualitySelect.value,
                    resolution: resolutionSelect.value,
                    hdrMode: hdrSelect.value
                }
            };

            console.log('Converting:', options);

            const result = await window.electronAPI.convertVideo(options);

            if (result && result.outputPath) {
                status.textContent = `Conversion completed! File saved to: ${result.outputPath}`;
            }

        } catch (error) {
            console.error('Conversion error:', error);
            status.textContent = `Error: ${error.message}`;
            progressContainer.style.display = 'none';
        } finally {
            convertBtn.disabled = false;
        }
    });

    // listen progress update
    window.electronAPI.onProgress((event, progress) => {
        if (typeof progress === 'object') {
            progressBar.style.width = `${progress.percent}%`;
            progressText.textContent = `${progress.percent}%`;
            progressSpeed.textContent = `Speed: ${progress.speed}`;
            progressTime.textContent = `Time: ${progress.time}`;
            progressEta.textContent = `ETA: ${progress.eta}`;
            
            // only show progress size when there is actual size data
            if (progress.size && progress.size !== '0MB' && progress.size !== 'N/A') {
                progressSize.textContent = `Size: ${progress.size}`;
            } else {
                progressSize.textContent = ''; // if no valid size data, don't show
            }
            
            if (progress.status === 'Completed!') {
                lastOutputPath = progress.outputPath;
                dialogContent.textContent = `File saved to: ${progress.outputPath}`;
                completionDialog.style.display = 'block';
                convertBtn.disabled = false;
            } else {
                status.textContent = progress.status;
            }
        }
    });

    // listen error
    window.electronAPI.onError((event, error) => {
        status.textContent = `Error: ${error}`;
        progressContainer.style.display = 'none';
        convertBtn.disabled = false;
    });

    // add change output path handler
    document.getElementById('changeOutputPath').addEventListener('click', async () => {
        const newPath = await window.electronAPI.selectOutputPath();
        if (newPath) {
            currentOutputPath = newPath;
            document.getElementById('outputPath').value = newPath;
        }
    });

    // add dialog event handler
    openFileBtn.addEventListener('click', async () => {
        if (lastOutputPath) {
            await window.electronAPI.openFile(lastOutputPath);
        }
        completionDialog.style.display = 'none';
    });

    openFolderBtn.addEventListener('click', async () => {
        if (lastOutputPath) {
            await window.electronAPI.openFolder(lastOutputPath);
        }
        completionDialog.style.display = 'none';
    });

    closeDialogBtn.addEventListener('click', () => {
        completionDialog.style.display = 'none';
    });
});

async function convertVideo() {
  
    const options = {
        inputPath: fileInput.files[0].path,
        outputPath: currentOutputPath, // use selected output path
        options: {
            encoder: encoderSelect.value,
            isLossless: conversionMode === 'lossless',
            preset: speedSelect.value,
            crf: qualitySelect.value,
            resolution: resolutionSelect.value,
            hdrMode: hdrSelect.value
        }
    };
    
} 