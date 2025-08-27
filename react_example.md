# React Integration Examples

## Basic API Calls

### Fetch Available Signs
```javascript
const fetchSigns = async () => {
  try {
    const response = await fetch('http://localhost:8000/signs');
    const data = await response.json();
    console.log('Available signs:', data.available_signs);
  } catch (error) {
    console.error('Error fetching signs:', error);
  }
};
```

### Get Specific Sign Info
```javascript
const getSignInfo = async (letter) => {
  try {
    const response = await fetch(`http://localhost:8000/sign/${letter}`);
    const data = await response.json();
    console.log(`Sign ${letter}:`, data.description);
  } catch (error) {
    console.error('Error fetching sign info:', error);
  }
};
```

### Upload Image for Sign Detection
```javascript
const detectSign = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await fetch('http://localhost:8000/detect-sign', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    console.log('Detection result:', data);
  } catch (error) {
    console.error('Error detecting sign:', error);
  }
};
```

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const SignLanguageApp = () => {
  const [signs, setSigns] = useState([]);
  const [selectedSign, setSelectedSign] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);

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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await detectSign(file);
    }
  };

  const detectSign = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await fetch('http://localhost:8000/detect-sign', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setDetectionResult(data);
    } catch (error) {
      console.error('Error detecting sign:', error);
    }
  };

  return (
    <div>
      <h1>AI Sign Language App</h1>
      
      <div>
        <h2>Available Signs</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {signs.map(sign => (
            <button 
              key={sign} 
              onClick={() => setSelectedSign(sign)}
              style={{ padding: '10px', margin: '5px' }}
            >
              {sign}
            </button>
          ))}
        </div>
      </div>

      {selectedSign && (
        <div>
          <h3>Sign: {selectedSign}</h3>
          <p>Description will be fetched from API</p>
        </div>
      )}

      <div>
        <h2>Upload Image for Detection</h2>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload}
        />
        
        {detectionResult && (
          <div>
            <h3>Detection Result:</h3>
            <pre>{JSON.stringify(detectionResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignLanguageApp;
```

## Environment Setup

Make sure your React app can access the API:

1. **CORS is already enabled** in the FastAPI backend
2. **API runs on localhost:8000** by default
3. **Use the exact endpoint URLs** shown in the examples

## Next Steps

1. Implement the sign description fetching
2. Add error handling and loading states
3. Style your components
4. Add real-time video processing (when ready)
5. Implement user authentication and progress tracking

