// database.js
const Pool = require('pg').Pool;
const pool = new Pool({
    user: "postgres",
    password: "henrilipping",
    database: "testWad",
    host: "localhost",
    port: "5432"
});

// Executes a SQL query
const execute = async(query) => {
    try {
        await pool.connect();
        await pool.query(query);
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

// Creates users table in SQL
const createTblQuery = `
    CREATE TABLE IF NOT EXISTS "users" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(200) NOT NULL UNIQUE,
        password VARCHAR(200) NOT NULL 
    );`;

// Executes the createTblQuery on application startup
execute(createTblQuery).then(result => {
    if (result) {
        console.log('Table "users" is created');
    }
});

//Creates posts table in SQL, used AI to add the timestamp to the post in the database (prompt: In SQL how do i create a table that adds timestamp of the time a new item is added.)
const createPostsTblQuery = `
    CREATE TABLE IF NOT EXISTS "poststable" (
        "id" SERIAL PRIMARY KEY,
        "body" VARCHAR,
        "created" TIMESTAMP DEFAULT NOW() 
    );`;

execute(createPostsTblQuery).then(result => {
    if (result) {
        console.log('Table "poststable" is created'); 
    }
});

// Exports the database connection pool to other files
module.exports = pool;
