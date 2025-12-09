import {Transform} from "./Transform.js";

export class SpatialSound extends Transform {
    constructor(src = "", options = {}) {
        const {
            name = "Spatial Sound",
            maxDistance = 10000,
            rollOff = 1,
            coneInnerAngle = 360,
            coneOuterAngle = 0,
            coneOuterGain = 0.3,
            loop = false,
            autoplay = false,
            volume = 1.0,
        } = options;

        super(name, {...options});

        this.src = src;
        this.loop = loop;
        this.autoplay = autoplay;
        this.isPlaying = false;
        this.isLoaded = false;

        // Create the panner node for spatial audio
        this.panner = new PannerNode(this.gpu.audioContext, {
            panningModel: "HRTF",
            distanceModel: "linear",
            positionX: this.position.x,
            positionY: this.position.y,
            positionZ: this.position.z,
            orientationX: this.forward.x,
            orientationY: this.forward.y,
            orientationZ: this.forward.z,
            refDistance: 1,
            maxDistance: maxDistance,
            rolloffFactor: rollOff,
            coneInnerAngle: coneInnerAngle,
            coneOuterAngle: coneOuterAngle,
            coneOuterGain: coneOuterGain,
        });

        // Create gain node for volume control
        this.gainNode = new GainNode(this.gpu.audioContext, {
            gain: volume
        });

        // Connect panner -> gain -> destination
        this.panner.connect(this.gainNode);
        this.gainNode.connect(this.gpu.audioContext.destination);

        // Load the audio file
        if (this.src) {
            this.LoadAudio().then(r => {
                document.addEventListener("playerInteracted", () => {
                    if (this.autoplay) {
                        this.Play();
                    }
                })
            });
        }
        
    }

    async LoadAudio() {
        try {
            const response = await fetch(this.src);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.gpu.audioContext.decodeAudioData(arrayBuffer);
            this.isLoaded = true;

            
            if (this.autoplay) {
                this.Play();
            }
            
        } catch (error) {
            console.error(`Failed to load audio from ${this.src}:`, error);
        }
    }

    Play(startTime = 0) {
        if (!this.isLoaded) {
            console.warn("Audio not loaded yet");
            return;
        }

        // Stop current playback if any
        if (this.source) {
            this.Stop();
        }

        // Create a new buffer source
        this.source = new AudioBufferSourceNode(this.gpu.audioContext, {
            buffer: this.audioBuffer,
            loop: this.loop
        });

        // Connect source -> panner
        this.source.connect(this.panner);

        // Start playback
        this.source.start(0, startTime);
        this.isPlaying = true;

        // Handle ended event
        this.source.onended = () => {
            if (!this.loop) {
                this.isPlaying = false;
            }
        };
    }

    Stop() {
        if (this.source && this.isPlaying) {
            this.source.stop();
            this.source.disconnect();
            this.source = null;
            this.isPlaying = false;
        }
    }

    Pause() {
        // Web Audio API doesn't have pause, so we stop and track time
        if (this.source && this.isPlaying) {
            this.pauseTime = this.gpu.audioContext.currentTime;
            this.Stop();
        }
    }

    SetVolume(volume) {
        this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }

    // Update position and orientation in the Update loop
    Update() {
        super.Update();

        // Update panner position to match transform position
        this.panner.positionX.value = this.globalPosition.x;
        this.panner.positionY.value = this.globalPosition.y;
        this.panner.positionZ.value = this.globalPosition.z;

        // Update orientation to match transform forward direction
        const forward = this.forward;
        this.panner.orientationX.value = -forward.x;
        this.panner.orientationY.value = forward.y;
        this.panner.orientationZ.value = -forward.z;
    }

    // Clean up when object is destroyed
    destroy() {
        this.Stop();
        this.panner.disconnect();
        this.gainNode.disconnect();
    }
}