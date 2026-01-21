"use strict";
// Jaw Monitor Application
// Monitors mouth open/closed state using MediaPipe Face Mesh
class JawMonitor {
    constructor() {
        this.mouthState = {
            isOpen: true,
            closedStartTime: null
        };
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isAlertPlaying = false;
        this.CLOSED_THRESHOLD = 0.05; // Threshold for detecting closed mouth (configurable)
        this.ALERT_DELAY = 1000; // 1 second delay before alerting
        this.ALERT_FREQUENCY = 440; // A4 note frequency
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.mouthStatusElement = document.getElementById('mouthStatus');
        this.timerElement = document.getElementById('timer');
        this.startButton = document.getElementById('startButton');
        this.errorElement = document.getElementById('error');
        this.statusContainer = document.getElementById('status');
        this.thresholdInput = document.getElementById('thresholdInput');
        this.updateThresholdButton = document.getElementById('updateThresholdButton');
        this.currentThresholdElement = document.getElementById('currentThreshold');
        this.startButton.addEventListener('click', () => this.initialize());
        this.updateThresholdButton.addEventListener('click', () => this.updateThreshold());
    }
    async initialize() {
        try {
            this.startButton.disabled = true;
            this.mouthStatusElement.textContent = 'Loading...';
            // Initialize audio context (requires user interaction)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Initialize MediaPipe Face Mesh
            await this.initializeFaceMesh();
            // Start camera
            await this.startCamera();
            this.mouthStatusElement.textContent = 'Monitoring...';
            this.startButton.style.display = 'none';
        }
        catch (error) {
            console.error('Initialization error:', error);
            this.showError(`Error: ${error.message}`);
            this.startButton.disabled = false;
        }
    }
    async initializeFaceMesh() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`;
            }
        });
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        this.faceMesh.onResults((results) => this.onResults(results));
    }
    async startCamera() {
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                await this.faceMesh.send({ image: this.video });
            },
            width: 640,
            height: 480,
            facingMode: 'user' // Front-facing camera
        });
        await this.camera.start();
    }
    onResults(results) {
        // Clear canvas
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            // Calculate mouth openness
            const mouthOpen = this.calculateMouthOpenness(landmarks);
            // Update mouth state
            this.updateMouthState(mouthOpen);
            // Draw landmarks (optional, for debugging)
            this.drawMouthLandmarks(landmarks);
        }
        else {
            // No face detected
            this.resetMouthState();
        }
        // Update UI
        this.updateUI();
    }
    calculateMouthOpenness(landmarks) {
        // Upper lip center: landmark 13
        // Lower lip center: landmark 14
        // These are the key points for mouth opening detection
        // Lips landmarks for better detection
        const upperLipTop = landmarks[13]; // Upper lip top center
        const lowerLipBottom = landmarks[14]; // Lower lip bottom center
        // Calculate vertical distance between upper and lower lip
        const mouthHeight = Math.abs(lowerLipBottom.y - upperLipTop.y);
        // Additional points for more robust detection
        const upperLipInner = landmarks[12];
        const lowerLipInner = landmarks[15];
        const innerMouthHeight = Math.abs(lowerLipInner.y - upperLipInner.y);
        // Average the measurements
        const avgHeight = (mouthHeight + innerMouthHeight) / 2;
        // Determine if mouth is open based on threshold
        return avgHeight > this.CLOSED_THRESHOLD;
    }
    updateMouthState(isOpen) {
        const currentTime = Date.now();
        if (!isOpen) {
            // Mouth is closed
            if (this.mouthState.isOpen) {
                // Transition from open to closed
                this.mouthState.isOpen = false;
                this.mouthState.closedStartTime = currentTime;
            }
            else {
                // Still closed, check if we need to alert
                const closedDuration = currentTime - (this.mouthState.closedStartTime || currentTime);
                if (closedDuration >= this.ALERT_DELAY && !this.isAlertPlaying) {
                    this.startAlert();
                }
            }
        }
        else {
            // Mouth is open
            if (!this.mouthState.isOpen) {
                // Transition from closed to open
                this.mouthState.isOpen = true;
                this.mouthState.closedStartTime = null;
                this.stopAlert();
            }
        }
    }
    resetMouthState() {
        this.mouthState.isOpen = true;
        this.mouthState.closedStartTime = null;
        this.stopAlert();
    }
    startAlert() {
        if (!this.audioContext || this.isAlertPlaying)
            return;
        try {
            // Create oscillator for beep sound
            this.oscillator = this.audioContext.createOscillator();
            this.gainNode = this.audioContext.createGain();
            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(this.ALERT_FREQUENCY, this.audioContext.currentTime);
            // Set volume
            this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            // Connect nodes
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            // Start oscillator
            this.oscillator.start();
            this.isAlertPlaying = true;
            // Add visual feedback
            this.statusContainer.classList.add('alerting');
        }
        catch (error) {
            console.error('Error starting alert:', error);
        }
    }
    stopAlert() {
        if (this.oscillator && this.isAlertPlaying) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
                this.oscillator = null;
                if (this.gainNode) {
                    this.gainNode.disconnect();
                    this.gainNode = null;
                }
                this.isAlertPlaying = false;
                // Remove visual feedback
                this.statusContainer.classList.remove('alerting');
            }
            catch (error) {
                console.error('Error stopping alert:', error);
            }
        }
    }
    updateUI() {
        const currentTime = Date.now();
        if (this.mouthState.isOpen) {
            this.mouthStatusElement.textContent = 'Mouth: OPEN';
            this.mouthStatusElement.className = 'open';
            this.timerElement.textContent = '';
        }
        else {
            this.mouthStatusElement.textContent = 'Mouth: CLOSED';
            this.mouthStatusElement.className = 'closed';
            if (this.mouthState.closedStartTime) {
                const closedDuration = Math.floor((currentTime - this.mouthState.closedStartTime) / 1000);
                this.timerElement.textContent = `Closed for: ${closedDuration}s`;
                if (this.isAlertPlaying) {
                    this.timerElement.textContent += ' - ALERTING!';
                }
            }
        }
    }
    drawMouthLandmarks(landmarks) {
        // Draw mouth area for visual feedback
        const mouthIndices = [
            61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, // Upper lip
            78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308 // Lower lip
        ];
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        mouthIndices.forEach((index) => {
            const landmark = landmarks[index];
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    showError(message) {
        this.errorElement.textContent = message;
        this.errorElement.style.display = 'block';
    }
    updateThreshold() {
        const newThreshold = parseFloat(this.thresholdInput.value);
        if (isNaN(newThreshold) || newThreshold <= 0 || newThreshold > 0.2) {
            this.showError('Please enter a valid threshold between 0.01 and 0.2');
            return;
        }
        this.CLOSED_THRESHOLD = newThreshold;
        this.currentThresholdElement.textContent = `Current: ${newThreshold.toFixed(2)}`;
        this.errorElement.style.display = 'none';
    }
}
// Initialize the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new JawMonitor());
}
else {
    new JawMonitor();
}
