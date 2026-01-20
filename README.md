# Jaw Monitor

A TypeScript web application that monitors your mouth's open/closed state using your iPhone's front-facing camera. Perfect for practicing piano or singing - it alerts you with a sound if your mouth stays closed for more than 1 second.

## Features

- 🎥 Uses front-facing camera for real-time face detection
- 👄 Detects mouth open/closed state using MediaPipe Face Mesh
- ⏱️ Monitors for mouth closed duration (1 second threshold)
- 🔊 Plays continuous audio alert when mouth is closed too long
- ✅ Stops alert immediately when mouth opens
- 📱 Optimized for iPhone/Safari mobile viewing

## Usage

### Quick Start

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Serve the application:
   ```bash
   npm run serve
   ```

5. Open your iPhone browser and navigate to `http://your-computer-ip:8000`
   - Find your computer's IP address (e.g., `192.168.1.100`)
   - On iPhone Safari, go to `http://192.168.1.100:8000`

6. Click "Start Monitoring" and allow camera access when prompted

7. Place your iPhone on your music stand with the front camera facing you

### How It Works

1. **Initialization**: Click "Start Monitoring" to initialize the camera and face detection
2. **Monitoring**: The app continuously tracks facial landmarks to detect mouth state
3. **Alert**: If your mouth remains closed for more than 1 second, an audio tone plays
4. **Stop**: The alert stops immediately when you open your mouth
5. **Continue**: Monitoring continues, alerting again if needed

## Requirements

- Modern web browser with camera support (tested on iPhone Safari)
- HTTPS or localhost (required for camera access)
- Front-facing camera

## Development

- **Watch mode**: `npm run watch` - Automatically recompile TypeScript on changes
- **Build**: `npm run build` - Compile TypeScript to JavaScript
- **Serve**: `npm run serve` - Start local HTTP server on port 8000

## Technology Stack

- **TypeScript**: Type-safe application code
- **MediaPipe Face Mesh**: Real-time facial landmark detection
- **Web Audio API**: Sound generation for alerts
- **MediaStream API**: Camera access

## Notes

- Camera access requires HTTPS in production or localhost in development
- For production deployment, use a proper HTTPS server
- The app is optimized for mobile viewing (iPhone/Safari)
- Visual feedback includes mouth status display and closed duration timer