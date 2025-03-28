import axios from 'axios';
import { MongoClient } from 'mongodb';
const url = 'mongodb+srv://girlfriendExp:cc58uyAWEgVu7KT6@girlfriendexp.7qu5l.mongodb.net/Vesta?retryWrites=true&w=majority&appName=girlfriendExp';
const dbName = 'Vesta';

const registerUser = async (email, password, birthdate) => {
  try {
    console.log(`Registering user ${email}...`);
    const response = await axios.post('http://localhost:6388/api/auth/register', {
      email,
      password,
      birthdate,
    });
    return response.data;
  } catch (error) {
    console.error(`Error registering user ${email}:`, error);
  }
};

const users = [
  { email: 'user1@example.com', password: 'password1', birthdate: '2000-01-01' },
  { email: 'user2@example.com', password: 'password2', birthdate: '2001-01-01' },
  { email: 'user3@example.com', password: 'password3', birthdate: '2002-01-01' },
  { email: 'user4@example.com', password: 'password4', birthdate: '2003-01-01' },
  { email: 'user5@example.com', password: 'password5', birthdate: '2004-01-01' },
  { email: 'user6@example.com', password: 'password6', birthdate: '2005-01-01' },
  { email: 'user7@example.com', password: 'password7', birthdate: '2006-01-01' },
  { email: 'user8@example.com', password: 'password8', birthdate: '2007-01-01' },
  { email: 'user9@example.com', password: 'password9', birthdate: '2008-01-01' },
  { email: 'user10@example.com', password: 'password10', birthdate: '2009-01-01' },
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
      console.error(`Error checking if user ${user.email} exists:`, error);
    }

    const registeredUser = await registerUser(user.email, user.password, user.birthdate);
  })).then(() => {
    console.log('All users registered');
  }).catch((error) => {
    console.error(error);
  });
});