// Author: Kondwani Phiri
require('./config/env');
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'myzambia'
};

// Function to connect to the database
async function connectToDatabase() {
  try {
    if (!config.user || typeof config.password != 'string') throw new Error('Set DB_USER and DB_PASSWORD before starting the application.');
    const connection = await mysql.createConnection(config);
    console.log('Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    throw error; // Ensure the error is thrown so the caller can handle it
  }
}

module.exports = connectToDatabase;