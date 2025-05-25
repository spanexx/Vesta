// Test script for profile picture upload
const testProfilePictureUpload = async () => {
  const testUrl = 'http://localhost:6388/api/media/profile-picture/test123';
  const testData = {
    base64Data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    filename: 'test.png',
    contentType: 'image/png'
  };

  // First, let's test without auth
  console.log('Testing profile picture upload to:', testUrl);
  console.log('Test data:', testData);

  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response text:', await response.text());
  } catch (error) {
    console.error('Test error:', error);
  }
};

testProfilePictureUpload();
