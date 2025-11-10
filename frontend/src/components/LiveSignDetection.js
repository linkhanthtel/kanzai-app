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
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#ffffff',
        fontSize: '2rem',
        fontWeight: '600',
        marginBottom: '8px',
        letterSpacing: '-0.5px'
      }}>
        Live Sign Detection
      </h1>
      <p style={{
        textAlign: 'center',
        color: '#bdc3c7',
        fontSize: '1rem',
        marginBottom: '40px',
        fontWeight: '400'
      }}>
        Real-time finger detection and sign language recognition
      </p>
      
      {/* Status indicators */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ 
          padding: '12px 20px', 
          borderRadius: '6px',
          backgroundColor: isConnected ? '#27ae60' : '#e74c3c',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ffffff'
          }} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        <div style={{ 
          padding: '12px 20px', 
          borderRadius: '6px',
          backgroundColor: isDetecting ? '#3498db' : '#95a5a6',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ffffff'
          }} />
          {isDetecting ? 'Detecting' : 'Inactive'}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          backgroundColor: '#e74c3c',
          border: '1px solid #c0392b',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '20px',
          color: '#ffffff',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Video and canvas */}
      <div style={{ 
        position: 'relative', 
        marginBottom: '40px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#2c3e50',
        border: '1px solid #34495e'
      }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: 'auto',
            display: isDetecting ? 'block' : 'none',
            borderRadius: '8px'
          }}
        />
        
        {!isDetecting && (
          <div style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#2c3e50',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#bdc3c7',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '500' }}>Camera Ready</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Click "Start Detection" to begin
            </div>
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
        gap: '16px',
        marginBottom: '40px'
      }}>
        <button
          onClick={startDetection}
          disabled={isDetecting}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            backgroundColor: isDetecting ? '#95a5a6' : '#3498db',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: isDetecting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (!isDetecting) {
              e.target.style.backgroundColor = '#2980b9';
            }
          }}
          onMouseOut={(e) => {
            if (!isDetecting) {
              e.target.style.backgroundColor = '#3498db';
            }
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
            fontWeight: '500',
            backgroundColor: !isDetecting ? '#95a5a6' : '#e74c3c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: !isDetecting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (isDetecting) {
              e.target.style.backgroundColor = '#c0392b';
            }
          }}
          onMouseOut={(e) => {
            if (isDetecting) {
              e.target.style.backgroundColor = '#e74c3c';
            }
          }}
        >
          Stop Detection
        </button>
      </div>

      {/* Current detected sign */}
      {currentSign && (
        <div style={{
          backgroundColor: '#2c3e50',
          border: '1px solid #34495e',
          borderRadius: '8px',
          padding: '40px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '80px',
            fontWeight: '700',
            color: '#3498db',
            marginBottom: '16px'
          }}>
            {currentSign.letter}
          </div>
          
          <p style={{ 
            margin: '0 0 20px 0', 
            color: '#bdc3c7',
            fontSize: '18px',
            fontWeight: '400',
            lineHeight: '1.5'
          }}>
            {currentSign.description}
          </p>
          
          <div style={{
            fontSize: '14px',
            color: '#95a5a6',
            backgroundColor: '#34495e',
            padding: '8px 16px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            Confidence: {(currentSign.confidence * 100).toFixed(0)}% • Method: {currentSign.method}
          </div>
        </div>
      )}

      {/* Recent detected signs */}
      {detectedLetters.length > 0 && (
        <div style={{
          backgroundColor: '#2c3e50',
          border: '1px solid #34495e',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '40px'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#ffffff',
            fontSize: '1.25rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Recent Signs
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {detectedLetters.map((sign, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#34495e',
                  border: '1px solid #4a5f7a',
                  borderRadius: '6px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '80px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#4a5f7a';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#34495e';
                }}
              >
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#3498db',
                  marginBottom: '8px'
                }}>
                  {sign.letter}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#bdc3c7',
                  textAlign: 'center',
                  marginBottom: '4px'
                }}>
                  {(sign.confidence * 100).toFixed(0)}%
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#95a5a6',
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
        backgroundColor: '#2c3e50',
        border: '1px solid #34495e',
        borderRadius: '8px',
        padding: '24px',
        marginTop: '40px'
      }}>
        <h3 style={{ 
          margin: '0 0 20px 0', 
          color: '#ffffff',
          fontSize: '1.25rem',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          How to Use
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px',
          color: '#bdc3c7'
        }}>
          <div style={{
            backgroundColor: '#34495e',
            border: '1px solid #4a5f7a',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <h4 style={{ color: '#3498db', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Good Lighting</h4>
            <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.4' }}>
              Ensure your hand is well-lit and visible. Avoid shadows and direct light sources.
            </p>
          </div>
          
          <div style={{
            backgroundColor: '#34495e',
            border: '1px solid #4a5f7a',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <h4 style={{ color: '#3498db', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Clear Position</h4>
            <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.4' }}>
              Position your hand clearly in front of the camera. Maintain steady position for better detection.
            </p>
          </div>
          
          <div style={{
            backgroundColor: '#34495e',
            border: '1px solid #4a5f7a',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <h4 style={{ color: '#3498db', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Steady Movement</h4>
            <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.4' }}>
              Hold signs steady for better recognition. Avoid rapid movements during detection.
            </p>
          </div>
          
          <div style={{
            backgroundColor: '#34495e',
            border: '1px solid #4a5f7a',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <h4 style={{ color: '#3498db', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Clean Background</h4>
            <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.4' }}>
              Use a plain background for better detection. Start with one hand for clearer results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSignDetection;
