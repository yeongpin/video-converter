# ➤ Video Converter
<div align="center">
<p align="center">
  <img src="./public/assets/app-icon.svg" alt="Video Converter Logo" width="200"/>
</p>

<p align="center">

[![Release](https://img.shields.io/github/v/release/yeongpin/video-converter?style=flat-square&logo=github&color=blue)](https://github.com/yeongpin/video-converter/releases/latest)
[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC_BY--NC--ND_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
[![Stars](https://img.shields.io/github/stars/yeongpin/video-converter?style=flat-square&logo=github)](https://github.com/yeongpin/video-converter/stargazers)

A modern and efficient video format converter built with Electron and FFmpeg.

[Download](https://github.com/yeongpin/video-converter/releases) • [Features](#features)

</p>

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| Framework | ![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) |
| Frontend | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) |
| Core | ![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=flat-square&logo=ffmpeg&logoColor=white) |
| Development | ![Electron Builder](https://img.shields.io/badge/Electron_Builder-47848F?style=flat-square&logo=electron&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black) |

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎥 Multiple Formats | Support for various input/output video formats including MP4, MKV, MOV, WebM etc. |
| 🔄 Lossless Mode | Convert between formats without quality loss, perfect for high-quality content |
| ⚡ Advanced Encoding | Support for H.264 and H.265 (HEVC) with customizable settings |
| 🎨 Modern Interface | Clean, intuitive UI with dark/light theme support |
| 🖥️ Resolution Control | Multiple resolution options from 720p to 4K (3840x2160) |
| 🌈 HDR Support | Maintain or convert HDR content with metadata preservation |
| 📊 Progress Tracking | Real-time conversion progress with speed, ETA and file size info |
| 💾 Output Control | Customizable output location and filename format |
| ⚙️ Quality Control | Adjustable quality settings (CRF) for optimal size/quality balance |
| 🚀 Speed Options | Multiple encoding speed presets from "Very Fast" to "Very Slow" |
| 🔊 Audio Control | Configurable audio bitrate and codec settings |
| 📱 Cross-Platform | Works on Windows, macOS, and Linux |

## 📝 Format Support

| Input Formats | Description |
|--------------|-------------|
| MP4 | MPEG-4 Part 14 (.mp4) |
| MKV | Matroska Video (.mkv) |
| MOV | QuickTime Movie (.mov) |
| WebM | Web Media (.webm) |
| AVI | Audio Video Interleave (.avi) |
| FLV | Flash Video (.flv) |
| WMV | Windows Media Video (.wmv) |
| M4V | MPEG-4 Video (.m4v) |
| TS/MTS | MPEG Transport Stream (.ts, .mts) |

| Output Formats | Supported Codecs |
|---------------|------------------|
| MP4 | H.264/AVC, H.265/HEVC |
| MKV | H.264/AVC, H.265/HEVC |
| MOV | H.264/AVC, H.265/HEVC |
| WebM | VP8, VP9 |
| AVI | MPEG-4, H.264 |
| FLV | H.264 |
| WMV | WMV3 |
| M4V | H.264/AVC |
| TS | H.264/AVC |

## 🛠️ Development

| Requirement | Version |
|------------|---------|
| Node.js | v14.0.0 or higher |
| npm/yarn | Latest stable version |
| Git | Latest stable version |

### 🛠️ Environment Setup
```
# Clone the repository
git clone https://github.com/yeongpin/video-converter.git

# Navigate to the project directory
cd video-converter

# Install dependencies
npm install

# Start the development server
npm start
```

### 📦 Build Commands
```
# Build for your current platform
npm run build

# Build for specific platforms
npm run build:win
npm run build:mac
npm run build:linux
```

## 📁 Project Structure 

```
video-converter/
├── package.json
├── README.md
├── src/
│ ├── main/        # Main process files
│ │ ├── main.js    # Main entry point
│ │ └── ffmpeg.js  # FFmpeg integration
│ └── preload/     # Preload scripts
├── public/        # Frontend files
│ ├── css/         # Stylesheets
│ ├── js/          # Frontend scripts
│ └── assets/      # Images and icons
└── build/         # Build configuration
```

## 🔧 Configuration

The application can be configured through the following files:
- `package.json` - Project configuration and dependencies
- `build/electron-builder.yml` - Build configuration
- `.env` - Environment variables

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License - see the [LICENSE](LICENSE.md) file for details.

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) - For the amazing desktop framework
- [FFmpeg](https://ffmpeg.org/) - For powerful video processing capabilities
- All our [contributors](https://github.com/yeongpin/video-converter/graphs/contributors)

---

<p align="center">Made with ❤️ by <a href="https://github.com/yeongpin">yeongpin</a></p><a href="https://github.com/yeongpin">
  <img src="https://github.com/yeongpin.png" width="50" height="50" style="border-radius:50%"/>
</a>

</div>

