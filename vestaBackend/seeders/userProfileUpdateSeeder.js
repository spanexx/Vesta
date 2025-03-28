const axios = require('axios');

const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await axios.put(`http://localhost:6388/api/profiles/${userId}`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
  }
};

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2MyYmE5ODc0NzNlMGZkZmVjMWIzYTgiLCJpYXQiOjE3NDA4MTUwMTAsImV4cCI6MTc0MDgxODYxMH0.xDwXSNBVT4IAlZWISHq9oAHeEK7a-9qWvjzS32NFd6k";

const users = [
  { email: 'user1@example.com' },
  { email: 'user2@example.com' },
  { email: 'user3@example.com' },
  { email: 'user4@example.com' },
  { email: 'user5@example.com' },
  { email: 'user6@example.com' },
  { email: 'user7@example.com' },
  { email: 'user8@example.com' },
  { email: 'user9@example.com' },
  { email: 'user10@example.com' },
];

const profileData = {
  "bio": "This is a sample bio",
  "services": ["incall", "outcall"],
  "rates": {
    "incall": {
      "30 minutes": 100,
      "1 hour": 200
    },
    "outcall": {
      "30 minutes": 150,
      "1 hour": 300
    }
  },
  "physicalAttributes": {
    "gender": "female",
    "birthdate": "1990-01-01",
    "height": 165,
    "weight": 55,
    "ethnicity": "Asian",
    "bustSize": "32B",
    "bustType": "Natural",
    "pubicHair": "Shaved",
    "tattoos": true,
    "piercings": false
  },
  "availabileToMeet": {
    "meetingWith": ["men", "women"],
    "available24_7": true,
    "advanceBooking": true
  },
  "contact": {
    "phone": "+1234567890",
    "country": "USA",
    "city": "New York",
    "location": {
      "type": "Point",
      "coordinates": [-74.0059, 40.7128]
    }
  },
  "workingTime": "9am-5pm",
  "availability": {
    "schedule": {
      "Monday": true,
      "Tuesday": true,
      "Wednesday": true,
      "Thursday": true,
      "Friday": true,
      "Saturday": false,
      "Sunday": false
    },
    "timezone": "EST"
  },
  "termsAccepted": true,
  "verificationStatus": "pending",
  "moderationFlags": {
    "contentWarnings": 0,
    "lastReviewed": "2022-01-01",
    "reviewerNotes": "Sample notes"
  },
  "verificationDocuments": ["document1.jpg", "document2.pdf"]
};

Promise.all(users.map(async (user) => {
  try {
    const existingUser = await axios.get(`http://localhost:6388/api/auth/user/${user.email}`);
    console.log(existingUser)
    if (existingUser.data) {
      const userId = existingUser.data._id;
      const updatedProfileData = { ...profileData };
      const updatedProfile = await updateUserProfile(userId, updatedProfileData);
      console.log(`User ${user.email} profile updated`);
    }
  } catch (error) {
    console.error(`Error updating profile for user ${user.email}:`, error);
  }
})).then(() => {
  console.log('All users profiles updated');
}).catch((error) => {
  console.error(error);
});