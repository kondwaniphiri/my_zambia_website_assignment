const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'kondwani1',
  database: 'myzambia'
};

// Function to connect to the database
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    throw error; // Ensure the error is thrown so the caller can handle it
  }
}

module.exports = connectToDatabase;