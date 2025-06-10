import axios from 'axios';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI;
const dbName = 'Vesta';

const registerUser = async (userData) => {
  try {
    console.log(`Registering user ${userData.email}...`);
    const response = await axios.post('http://localhost:6388/api/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error(`Error registering user ${userData.email}:`, error.response?.data || error.message);
    return null;
  }
};

const users = [
  { 
    username: 'sophia_rose', 
    email: 'sophia@example.com', 
    password: 'password123', 
    birthdate: '1995-03-15',
    gender: 'female',
    currentLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'United States'
    }
  },
  { 
    username: 'emma_luxe', 
    email: 'emma@example.com', 
    password: 'password123', 
    birthdate: '1992-07-22',
    gender: 'female',
    currentLocation: {
      latitude: 34.0522,
      longitude: -118.2437,
      city: 'Los Angeles',
      country: 'United States'
    }
  },
  { 
    username: 'alex_model', 
    email: 'alex@example.com', 
    password: 'password123', 
    birthdate: '1993-11-08',
    gender: 'male',
    currentLocation: {
      latitude: 41.8781,
      longitude: -87.6298,
      city: 'Chicago',
      country: 'United States'
    }
  },
  { 
    username: 'luna_vip', 
    email: 'luna@example.com', 
    password: 'password123', 
    birthdate: '1990-05-12',
    gender: 'trans',
    currentLocation: {
      latitude: 29.7604,
      longitude: -95.3698,
      city: 'Houston',
      country: 'United States'
    }
  },
  { 
    username: 'maya_angel', 
    email: 'maya@example.com', 
    password: 'password123', 
    birthdate: '1994-09-30',
    gender: 'female',
    currentLocation: {
      latitude: 33.4484,
      longitude: -112.0740,
      city: 'Phoenix',
      country: 'United States'
    }
  },
  { 
    username: 'jordan_elite', 
    email: 'jordan@example.com', 
    password: 'password123', 
    birthdate: '1991-12-03',
    gender: 'male',
    currentLocation: {
      latitude: 39.9526,
      longitude: -75.1652,
      city: 'Philadelphia',
      country: 'United States'
    }
  },
  { 
    username: 'aria_star', 
    email: 'aria@example.com', 
    password: 'password123', 
    birthdate: '1996-02-18',
    gender: 'female',
    currentLocation: {
      latitude: 32.7767,
      longitude: -96.7970,
      city: 'Dallas',
      country: 'United States'
    }
  },
  { 
    username: 'blake_premium', 
    email: 'blake@example.com', 
    password: 'password123', 
    birthdate: '1989-06-25',
    gender: 'male',
    currentLocation: {
      latitude: 29.4241,
      longitude: -98.4936,
      city: 'San Antonio',
      country: 'United States'
    }
  },
  { 
    username: 'zara_goddess', 
    email: 'zara@example.com', 
    password: 'password123', 
    birthdate: '1993-04-14',
    gender: 'trans',
    currentLocation: {
      latitude: 32.7157,
      longitude: -117.1611,
      city: 'San Diego',
      country: 'United States'
    }
  },
  { 
    username: 'rio_deluxe', 
    email: 'rio@example.com', 
    password: 'password123', 
    birthdate: '1992-10-07',
    gender: 'female',
    currentLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      city: 'San Francisco',
      country: 'United States'
    }
  },
  { 
    username: 'phoenix_king', 
    email: 'phoenix@example.com', 
    password: 'password123', 
    birthdate: '1988-08-19',
    gender: 'male',
    currentLocation: {
      latitude: 47.6062,
      longitude: -122.3321,
      city: 'Seattle',
      country: 'United States'
    }
  },
  { 
    username: 'valencia_queen', 
    email: 'valencia@example.com', 
    password: 'password123', 
    birthdate: '1995-01-28',
    gender: 'female',
    currentLocation: {
      latitude: 25.7617,
      longitude: -80.1918,
      city: 'Miami',
      country: 'United States'
    }
  },
  { 
    username: 'sage_mystique', 
    email: 'sage@example.com', 
    password: 'password123', 
    birthdate: '1991-03-11',
    gender: 'trans',
    currentLocation: {
      latitude: 39.7392,
      longitude: -104.9903,
      city: 'Denver',
      country: 'United States'
    }
  },
  { 
    username: 'dante_luxury', 
    email: 'dante@example.com', 
    password: 'password123', 
    birthdate: '1990-07-04',
    gender: 'male',
    currentLocation: {
      latitude: 42.3601,
      longitude: -71.0589,
      city: 'Boston',
      country: 'United States'
    }
  },  { 
    username: 'nova_divine', 
    email: 'nova@example.com', 
    password: 'password123', 
    birthdate: '1994-12-16',
    gender: 'female',
    currentLocation: {
      latitude: 36.1627,
      longitude: -86.7816,
      city: 'Nashville',
      country: 'United States'
    }
  },
  { 
    username: 'crystal_enchant', 
    email: 'crystal@example.com', 
    password: 'password123', 
    birthdate: '1992-08-09',
    gender: 'female',
    currentLocation: {
      latitude: 35.2271,
      longitude: -80.8431,
      city: 'Charlotte',
      country: 'United States'
    }
  },
  { 
    username: 'marcus_elite', 
    email: 'marcus@example.com', 
    password: 'password123', 
    birthdate: '1987-11-22',
    gender: 'male',
    currentLocation: {
      latitude: 39.2904,
      longitude: -76.6122,
      city: 'Baltimore',
      country: 'United States'
    }
  },
  { 
    username: 'ruby_sensation', 
    email: 'ruby@example.com', 
    password: 'password123', 
    birthdate: '1995-04-03',
    gender: 'trans',
    currentLocation: {
      latitude: 38.9072,
      longitude: -77.0369,
      city: 'Washington',
      country: 'United States'
    }
  },
  { 
    username: 'diego_charm', 
    email: 'diego@example.com', 
    password: 'password123', 
    birthdate: '1990-01-15',
    gender: 'male',
    currentLocation: {
      latitude: 43.0389,
      longitude: -87.9065,
      city: 'Milwaukee',
      country: 'United States'
    }
  },
  { 
    username: 'aurora_dream', 
    email: 'aurora@example.com', 
    password: 'password123', 
    birthdate: '1993-09-27',
    gender: 'female',
    currentLocation: {
      latitude: 45.5152,
      longitude: -122.6784,
      city: 'Portland',
      country: 'United States'
    }
  },
  { 
    username: 'kai_mystique', 
    email: 'kai@example.com', 
    password: 'password123', 
    birthdate: '1991-06-13',
    gender: 'trans',
    currentLocation: {
      latitude: 40.4406,
      longitude: -79.9959,
      city: 'Pittsburgh',
      country: 'United States'
    }
  },
  { 
    username: 'stella_luxe', 
    email: 'stella@example.com', 
    password: 'password123', 
    birthdate: '1996-02-29',
    gender: 'female',
    currentLocation: {
      latitude: 39.1612,
      longitude: -75.5264,
      city: 'Wilmington',
      country: 'United States'
    }
  },
  { 
    username: 'titan_power', 
    email: 'titan@example.com', 
    password: 'password123', 
    birthdate: '1988-12-05',
    gender: 'male',
    currentLocation: {
      latitude: 41.4993,
      longitude: -81.6944,
      city: 'Cleveland',
      country: 'United States'
    }
  },
  { 
    username: 'luna_fantasy', 
    email: 'lunaf@example.com', 
    password: 'password123', 
    birthdate: '1994-07-18',
    gender: 'female',
    currentLocation: {
      latitude: 42.3314,
      longitude: -83.0458,
      city: 'Detroit',
      country: 'United States'
    }
  },
  { 
    username: 'orion_supreme', 
    email: 'orion@example.com', 
    password: 'password123', 
    birthdate: '1989-10-31',
    gender: 'male',
    currentLocation: {
      latitude: 39.7391,
      longitude: -104.9847,
      city: 'Denver',
      country: 'United States'
    }
  },
  { 
    username: 'venus_divine', 
    email: 'venus@example.com', 
    password: 'password123', 
    birthdate: '1993-03-08',
    gender: 'trans',
    currentLocation: {
      latitude: 36.7783,
      longitude: -119.4179,
      city: 'Fresno',
      country: 'United States'
    }
  },
  { 
    username: 'ace_platinum', 
    email: 'ace@example.com', 
    password: 'password123', 
    birthdate: '1990-05-21',
    gender: 'male',
    currentLocation: {
      latitude: 33.7490,
      longitude: -84.3880,
      city: 'Atlanta',
      country: 'United States'
    }
  },
  { 
    username: 'jasmine_elegance', 
    email: 'jasmine@example.com', 
    password: 'password123', 
    birthdate: '1995-11-14',
    gender: 'female',
    currentLocation: {
      latitude: 30.2672,
      longitude: -97.7431,
      city: 'Austin',
      country: 'United States'
    }
  },
  { 
    username: 'raven_mystery', 
    email: 'raven@example.com', 
    password: 'password123', 
    birthdate: '1992-01-07',
    gender: 'trans',
    currentLocation: {
      latitude: 35.7796,
      longitude: -78.6382,
      city: 'Raleigh',
      country: 'United States'
    }
  },
  { 
    username: 'storm_legend', 
    email: 'storm@example.com', 
    password: 'password123', 
    birthdate: '1987-08-26',
    gender: 'male',
    currentLocation: {
      latitude: 43.6532,
      longitude: -116.3113,
      city: 'Boise',
      country: 'United States'
    }
  }
];

async function dropDatabase() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    await db.dropDatabase();
    console.log('Database dropped');
  } catch (error) {
    console.error('Error dropping database:', error);
  } finally {
    await client.close();
  }
}

dropDatabase().then(() => {
  Promise.all(users.map(async (user) => {
    try {
      const existingUser = await axios.get(`http://localhost:6388/api/auth/user/${user.email}`);
      if (existingUser.data) {
        console.log(`User ${user.email} already exists, skipping registration`);
        return;
      }
    } catch (error) {
      // User doesn't exist, proceed with registration
      if (error.response?.status === 404) {
        console.log(`User ${user.email} doesn't exist, proceeding with registration`);
      } else {
        console.error(`Error checking if user ${user.email} exists:`, error.response?.data || error.message);
      }
    }

    const registeredUser = await registerUser(user);
    if (registeredUser) {
      console.log(`Successfully registered user: ${user.email}`);
    } else {
      console.log(`Failed to register user: ${user.email}`);
    }
  })).then(() => {
    console.log('User registration seeding completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Error during user registration seeding:', error);
    process.exit(1);
  });
});