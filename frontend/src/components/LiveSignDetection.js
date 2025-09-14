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
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>
        Live Sign Language Detection
      </h1>
      
      {/* Status indicators */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ 
          padding: '8px 16px', 
          borderRadius: '20px',
          backgroundColor: isConnected ? '#4CAF50' : '#f44336',
          color: 'white',
          fontSize: '14px'
        }}>
          Server: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        <div style={{ 
          padding: '8px 16px', 
          borderRadius: '20px',
          backgroundColor: isDetecting ? '#2196F3' : '#9E9E9E',
          color: 'white',
          fontSize: '14px'
        }}>
          Detection: {isDetecting ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ef5350'
        }}>
          {error}
        </div>
      )}

      {/* Video and canvas */}
      <div style={{ 
        position: 'relative', 
        marginBottom: '20px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: 'auto',
            display: isDetecting ? 'block' : 'none'
          }}
        />
        
        {!isDetecting && (
          <div style={{
            width: '100%',
            height: '300px',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '18px'
          }}>
            Click "Start Detection" to begin
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px',
        marginBottom: '20px'
      }}>
        <button
          onClick={startDetection}
          disabled={isDetecting}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isDetecting ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isDetecting ? 'not-allowed' : 'pointer'
          }}
        >
          {isDetecting ? 'Detecting...' : 'Start Detection'}
        </button>
        
        <button
          onClick={stopDetection}
          disabled={!isDetecting}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: !isDetecting ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isDetecting ? 'not-allowed' : 'pointer'
          }}
        >
          Stop Detection
        </button>
      </div>

      {/* Current detected sign */}
      {currentSign && (
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '20px',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#2E7D32',
            marginBottom: '15px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            {currentSign.letter}
          </div>
          <p style={{ 
            margin: '0 0 15px 0', 
            color: '#388E3C',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            {currentSign.description}
          </p>
          <div style={{
            fontSize: '14px',
            color: '#666',
            backgroundColor: 'rgba(255,255,255,0.7)',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            Confidence: {(currentSign.confidence * 100).toFixed(0)}% • Method: {currentSign.method}
          </div>
        </div>
      )}

      {/* Recent detected signs */}
      {detectedLetters.length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>
            Recent Signs Detected
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {detectedLetters.map((sign, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '15px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '100px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#2196F3',
                  marginBottom: '8px'
                }}>
                  {sign.letter}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  textAlign: 'center',
                  marginBottom: '5px'
                }}>
                  {(sign.confidence * 100).toFixed(0)}% confidence
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  {sign.method}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196F3',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1976D2' }}>
          How to Use Live Sign Detection
        </h3>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#424242' }}>
          <li><strong>Good Lighting:</strong> Ensure your hand is well-lit and visible</li>
          <li><strong>Clear Position:</strong> Position your hand clearly in front of the camera</li>
          <li><strong>Steady Movement:</strong> Hold signs steady for better recognition</li>
          <li><strong>Try Different Signs:</strong> Practice different sign language letters</li>
          <li><strong>Clean Background:</strong> Use a plain background for better detection</li>
          <li><strong>Single Hand:</strong> Start with one hand for clearer results</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveSignDetection;
