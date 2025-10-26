import React, { useState, useEffect } from 'react';
import LiveSignDetection from './components/LiveSignDetection';

const App = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [signs, setSigns] = useState([]);
  const [selectedSign, setSelectedSign] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available signs on component mount
  useEffect(() => {
    fetchSigns();
  }, []);

  const fetchSigns = async () => {
    try {
      const response = await fetch('http://localhost:8000/signs');
      const data = await response.json();
      setSigns(data.available_signs);
    } catch (error) {
      console.error('Error fetching signs:', error);
    }
  };

  const fetchSignInfo = async (letter) => {
    try {
      const response = await fetch(`http://localhost:8000/sign/${letter}`);
      const data = await response.json();
      setSelectedSign(data);
    } catch (error) {
      console.error('Error fetching sign info:', error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/detect-sign?annotated=true', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setDetectionResult(data);
    } catch (error) {
      console.error('Error detecting sign:', error);
      setDetectionResult({ error: 'Failed to process image' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a2e',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#ffffff'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#16213e',
        color: '#ffffff',
        padding: '40px 0',
        textAlign: 'center',
        borderBottom: '1px solid #2c3e50'
      }}>
        <h1 style={{ 
          margin: '0', 
          fontSize: '2.5rem',
          fontWeight: '600',
          color: '#ffffff',
          letterSpacing: '-0.5px'
        }}>
          AI Sign Language Recognition
        </h1>
        <p style={{ 
          margin: '10px 0 0 0', 
          fontSize: '1.1rem', 
          color: '#bdc3c7',
          fontWeight: '400'
        }}>
          Real-time finger detection and sign language analysis
        </p>
      </header>

      {/* Navigation */}
      <nav style={{
        backgroundColor: '#16213e',
        padding: '0',
        borderBottom: '1px solid #2c3e50'
      }}>
        <div style={{
          display: 'flex',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setActiveTab('live')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: activeTab === 'live' ? '#3498db' : 'transparent',
              color: activeTab === 'live' ? '#ffffff' : '#bdc3c7',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === 'live' ? '3px solid #3498db' : '3px solid transparent'
            }}
            onMouseOver={(e) => {
              if (activeTab !== 'live') {
                e.target.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                e.target.style.color = '#ffffff';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'live') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#bdc3c7';
              }
            }}
          >
            Live Detection
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: activeTab === 'upload' ? '#3498db' : 'transparent',
              color: activeTab === 'upload' ? '#ffffff' : '#bdc3c7',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === 'upload' ? '3px solid #3498db' : '3px solid transparent'
            }}
            onMouseOver={(e) => {
              if (activeTab !== 'upload') {
                e.target.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                e.target.style.color = '#ffffff';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'upload') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#bdc3c7';
              }
            }}
          >
            Upload Image
          </button>
          <button
            onClick={() => setActiveTab('learn')}
            style={{
              padding: '16px 24px',
              border: 'none',
              backgroundColor: activeTab === 'learn' ? '#3498db' : 'transparent',
              color: activeTab === 'learn' ? '#ffffff' : '#bdc3c7',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === 'learn' ? '3px solid #3498db' : '3px solid transparent'
            }}
            onMouseOver={(e) => {
              if (activeTab !== 'learn') {
                e.target.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                e.target.style.color = '#ffffff';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'learn') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#bdc3c7';
              }
            }}
          >
            Learn Signs
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {activeTab === 'live' && (
          <LiveSignDetection />
        )}

        {activeTab === 'upload' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
              Upload Image for Detection
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  padding: '10px',
                  border: '2px dashed #ddd',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '16px'
                }}
              />
            </div>

            {isLoading && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666'
              }}>
                Processing image...
              </div>
            )}

            {detectionResult && !isLoading && (
              <div>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>
                  Detection Results
                </h3>
                
                {detectionResult.error ? (
                  <div style={{
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    padding: '15px',
                    borderRadius: '4px',
                    border: '1px solid #ef5350'
                  }}>
                    {detectionResult.error}
                  </div>
                ) : (
                  <div>
                    <div style={{
                      backgroundColor: detectionResult.detected ? '#e8f5e8' : '#fff3e0',
                      border: `2px solid ${detectionResult.detected ? '#4CAF50' : '#FF9800'}`,
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>
                        {detectionResult.detected ? 'Hands Detected!' : 'No Hands Detected'}
                      </h4>
                      <p style={{ margin: '0' }}>
                        {detectionResult.message}
                      </p>
                      
                      {detectionResult.detected_letters && detectionResult.detected_letters.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                          <h5 style={{ margin: '0 0 10px 0' }}>Recognized Signs:</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {detectionResult.detected_letters.map((sign, index) => (
                              <div
                                key={index}
                                style={{
                                  backgroundColor: 'white',
                                  border: '1px solid #ddd',
                                  borderRadius: '6px',
                                  padding: '10px 15px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center'
                                }}
                              >
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                  {sign.letter}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {(sign.confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {detectionResult.annotated_image && (
                      <div>
                        <h4>Annotated Image:</h4>
                        <img
                          src={detectionResult.annotated_image}
                          alt="Annotated detection"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            border: '1px solid #ddd'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'learn' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
              Learn Sign Language
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {signs.map(sign => (
                <button
                  key={sign}
                  onClick={() => fetchSignInfo(sign)}
                  style={{
                    padding: '20px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: selectedSign?.letter === sign ? '#e3f2fd' : 'white',
                    cursor: 'pointer',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#333',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (selectedSign?.letter !== sign) {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedSign?.letter !== sign) {
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {sign}
                </button>
              ))}
            </div>

            {selectedSign && (
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '25px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '72px',
                  fontWeight: 'bold',
                  color: '#2196F3',
                  marginBottom: '15px'
                }}>
                  {selectedSign.letter}
                </div>
                <p style={{
                  fontSize: '18px',
                  color: '#495057',
                  margin: '0 0 10px 0',
                  lineHeight: '1.5'
                }}>
                  {selectedSign.description}
                </p>
                <div style={{
                  fontSize: '14px',
                  color: '#6c757d',
                  marginTop: '15px'
                }}>
                  Category: {selectedSign.category}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#333',
        color: 'white',
        textAlign: 'center',
        padding: '20px 0',
        marginTop: '40px'
      }}>
        <p style={{ margin: '0' }}>
          AI Sign Language Recognition System - Built with FastAPI and React
        </p>
      </footer>
    </div>
  );
};

export default App;
