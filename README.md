# Video Format Converter

A versatile video format converter built with Electron and FFmpeg.

## Supported Input Formats
- MKV (Matroska)
- MP4 (MPEG-4 Part 14)
- AVI (Audio Video Interleave)
- MOV (QuickTime Movie)
- WMV (Windows Media Video)
- FLV (Flash Video)
- WebM
- M4V (MPEG-4 Video)
- MPG/MPEG (Moving Picture Experts Group)
- TS (MPEG Transport Stream)

## Output Formats
- MP4 (H.264/H.265)
- MKV (H.264/H.265)
- MOV (H.264/H.265)

## Features
- Support for multiple input and output formats
- HDR video support
- Lossless conversion option
- H.264 and H.265 (HEVC) encoding
- Adjustable quality and encoding speed
- Progress tracking with ETA
- Maintains HDR metadata when applicable

## Installation
1. Clone the repository
2. Run `npm install`
3. Run `npm start` to launch the application

## Building
Run `npm run build` to create an executable

## Project Structure 
mkv-converter/
├── package.json
├── README.md
├── src/
│ ├── main/ # Main process files
│ └── preload/ # Preload scripts
└── public/ # Frontend files


## License

MIT

