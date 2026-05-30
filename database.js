// database.js - MySQL connection using mysql2
const mysql = require('mysql2');

// Create connection pool (better performance)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'pass1234',     // change to your MySQL password
    database: 'girls_clothing',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to girls_clothing database');
        connection.release();
    }
});

module.exports = pool.promise(); // using promise API for async/await