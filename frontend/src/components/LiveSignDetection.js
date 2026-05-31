import React, { useState, useEffect, useRef, useCallback } from 'react';

// Sign analysis is now handled by the backend

const LiveSignDetection = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLetters, setDetectedLetters] = useState([]);
  const [currentSign, setCurrentSign] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  // Initialize webcam
  const initializeWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (err) {
      setError('Unable to access webcam. Please check permissions.');
      return false;
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/live-detect');
      
      ws.onopen = () => {
        console.log('WebSocket connected to ws://localhost:8000/ws/live-detect');
        setIsConnected(true);
        setError(null);
      };
      
      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        const data = JSON.parse(event.data);
        console.log('Parsed data:', data);
        
        if (data.error) {
          setError(data.error);
          return;
        }
        
        if (data.detected && data.signs_detected && data.signs_detected.length > 0) {
          // Use the signs detected by the backend
          const detectedSigns = data.signs_detected.map((sign, index) => ({
            letter: sign.letter,
            confidence: sign.confidence || 0.8,
            description: sign.description,
            method: sign.method || 'unknown'
          }));
          
          setDetectedLetters(detectedSigns);
          
          // Update current sign with highest confidence
          if (detectedSigns.length > 0) {
            const bestMatch = detectedSigns.reduce((prev, current) => 
              (prev.confidence > current.confidence) ? prev : current
            );
            setCurrentSign(bestMatch);
          } else {
            setCurrentSign(null);
          }
        } else {
          setDetectedLetters([]);
          setCurrentSign(null);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection failed');
        setIsConnected(false);
      };
      
      wsRef.current = ws;
    } catch (err) {
      setError('Failed to connect to detection server');
    }
  }, []);

  // Capture frame and send to server
  const captureAndDetect = useCallback(() => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not ready for capture:', {
        video: !!videoRef.current,
        ws: !!wsRef.current,
        wsState: wsRef.current?.readyState
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) {
      console.log('Canvas or video not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Send to server
    console.log('Sending image data to server...');
    wsRef.current.send(JSON.stringify({ image: imageData }));
  }, []);

  // Start detection
  const startDetection = useCallback(async () => {
    setError(null);
    
    // Initialize webcam
    const webcamReady = await initializeWebcam();
    if (!webcamReady) return;
    
    // Connect to WebSocket
    connectWebSocket();
    
    // Wait a moment for WebSocket to connect
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        setIsDetecting(true);
        
        // Start capturing frames every 200ms
        detectionIntervalRef.current = setInterval(captureAndDetect, 200);
      } else {
        setError('Failed to connect to detection server');
      }
    }, 1000);
  }, [initializeWebcam, connectWebSocket, captureAndDetect]);

  // Stop detection
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    
    // Clear interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Stop webcam
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setDetectedLetters([]);
    setCurrentSign(null);
    setIsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return (
    <section className="card">
      <h2 className="section-title">Live Sign Detection</h2>
      <p className="section-subtitle">
        Turn on your camera and we'll read your hand signs as you make them.
      </p>

      {/* Status indicators */}
      <div className="status-row">
        <span className={`badge ${isConnected ? 'badge--on' : 'badge--off'}`}>
          <span className="badge__dot" />
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
        <span className={`badge ${isDetecting ? 'badge--active' : 'badge--off'}`}>
          <span className="badge__dot" />
          {isDetecting ? 'Detecting' : 'Paused'}
        </span>
      </div>

      {/* Error message */}
      {error && <div className="alert alert--error">{error}</div>}

      {/* Video and canvas */}
      <div className="video-frame">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: isDetecting ? 'block' : 'none' }}
        />

        {!isDetecting && (
          <div className="video-placeholder">
            <div className="video-placeholder__title">Camera ready</div>
            <div>Press "Start Detection" to begin.</div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          type="button"
          className="btn btn--primary"
          onClick={startDetection}
          disabled={isDetecting}
        >
          {isDetecting ? 'Detecting…' : 'Start Detection'}
        </button>

        <button
          type="button"
          className="btn btn--danger"
          onClick={stopDetection}
          disabled={!isDetecting}
        >
          Stop Detection
        </button>
      </div>

      {/* Current detected sign */}
      {currentSign && (
        <div className="result-card">
          <div className="result-card__letter">{currentSign.letter}</div>
          <p className="result-card__desc">{currentSign.description}</p>
          <span className="chip">
            {(currentSign.confidence * 100).toFixed(0)}% sure • {currentSign.method}
          </span>
        </div>
      )}

      {/* Recent detected signs */}
      {detectedLetters.length > 0 && (
        <div className="mt-40">
          <h3 className="section-title">Recent Signs</h3>
          <div className="tile-grid">
            {detectedLetters.map((sign, index) => (
              <div key={index} className="tile">
                <div className="tile__letter">{sign.letter}</div>
                <div className="tile__meta">{(sign.confidence * 100).toFixed(0)}%</div>
                <div className="tile__meta">{sign.method}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-40">
        <h3 className="section-title">Tips for Best Results</h3>
        <div className="tips-grid">
          <div className="tip">
            <div className="tip__title">Good Lighting</div>
            <p className="tip__text">
              Keep your hand well-lit and visible. Avoid shadows and harsh light.
            </p>
          </div>
          <div className="tip">
            <div className="tip__title">Clear Position</div>
            <p className="tip__text">
              Hold your hand clearly in front of the camera and keep it steady.
            </p>
          </div>
          <div className="tip">
            <div className="tip__title">Steady Movement</div>
            <p className="tip__text">
              Hold each sign for a moment. Avoid quick movements while detecting.
            </p>
          </div>
          <div className="tip">
            <div className="tip__title">Clean Background</div>
            <p className="tip__text">
              Use a plain background and start with one hand for clearer results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveSignDetection;
