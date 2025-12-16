// server.js
const express = require('express');
const pool = require('./database');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 3000;

const app = express();

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));

app.use(express.json());  // Parses incoming requests with JSON payloads and is based on body-parser.
app.use(cookieParser());  // Parse Cookie header and populate req.cookies with an object keyed by the cookie names.

const secret = "3sja39shf93sh3ksha1923030f02jabdakdazmeri372bw2sh2dw";
const maxAge = 60 * 60; // seconds

// Generates to user a JWT
const generateJWT = (id) => {
    return jwt.sign({ id }, secret, { expiresIn: maxAge })
}

// To check whether a user is authinticated
app.get('/auth/authenticate', async(req, res) => {
    console.log('authentication request has been arrived');
    const token = req.cookies.jwt;
    let authenticated = false;
    try {
        if (token) { // Checks if the token exists
            await jwt.verify(token, secret, (err) => {
                if (err) { // not verified
                    console.log(err.message);
                    console.log('token is not verified');
                    res.send({ "authenticated": authenticated }); // authenticated = false
                } else { // token exists and it is verified
                    console.log('author is authinticated');
                    authenticated = true;
                    res.send({ "authenticated": authenticated }); // authenticated = true
                }
            })
        } else {
            console.log('author is not authinticated');
            res.send({ "authenticated": authenticated }); // authenticated = false
        }
    } catch (err) {
        console.error(err.message);
        res.status(400).send(err.message);
    }
});

// Signup a user
app.post('/auth/signup', async(req, res) => {
    try {
        console.log("a signup request has arrived");
        const { email, password } = req.body;

        // Checks does this email is used in database
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1", [email]
        );

        if (existingUser.rows.length > 0) {
            return res
                .status(400)
                .json({ error: "User already exists" });
        }

        const salt = await bcrypt.genSalt();
        const bcryptPassword = await bcrypt.hash(password, salt)
        const authUser = await pool.query(
            "INSERT INTO users(email, password) values ($1, $2) RETURNING*", [email, bcryptPassword]
        );
        console.log(authUser.rows[0].id);
        const token = await generateJWT(authUser.rows[0].id);
        res
            .status(201)
            .cookie('jwt', token, { maxAge: 6000000, httpOnly: true })
            .json({ user_id: authUser.rows[0].id })
            .send;
    } catch (err) {
        console.error(err.message);
        res.status(400).send(err.message);
    }
});

// Login a user
app.post('/auth/login', async(req, res) => {
    try {
        console.log("a login request has arrived");
        const { email, password } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(401).json({ error: "User is not registered" });

        // Checking if the password is correct
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) return res.status(401).json({ error: "Incorrect password" });

        const token = await generateJWT(user.rows[0].id);
        res
            .status(201)
            .cookie('jwt', token, { maxAge: 6000000, httpOnly: true })
            .json({ user_id: user.rows[0].id })
            .send;
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Logout a user and deletes the jwt
app.get('/auth/logout', (req, res) => {
    console.log('delete jwt request arrived');
    res.status(202).clearCookie('jwt').json({ "Msg": "cookie cleared" }).send
});

//-----------------------------
//Get all posts from database
app.get('/posts', async(req, res) => {
    try {
        console.log("get posts request has arrived");
        const posts = await pool.query(
            "SELECT * FROM poststable"
        );
        res.json(posts.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// Get a single post by ID

app.get('/posts/:id', async(req, res) => {
    try {
        const { id } = req.params;
        console.log("Requested ID:", id);
        const post = await pool.query("SELECT * FROM poststable WHERE id = $1", [id]);
        res.json(post.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

//Delete all posts
app.delete('/posts', async(req, res) => {
    try {
        await pool.query("DELETE FROM poststable");
        res.json({ message: "All posts deleted"});
    } catch (err) {
        console.error(err.message);
    }
});

//Delete a single post
app.delete('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log("delete a post request has arrived");
        const deletepost = await pool.query("DELETE FROM poststable WHERE id = $1", [id]); // used AI to find how to delete a single post from the database (prompt: How to delete a row in SQL using its id.) 
        res.json(deletepost);
    } catch (err) {
        console.error(err.message);
    }
})

//Updating an existing post
app.put('/posts/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const { body } = req.body;
        console.log("update request has arrived");
        const updatepost = await pool.query(
            "UPDATE poststable SET body = $1 WHERE id = $2 RETURNING *", [body, id]
        );
        res.json(updatepost);
    } catch (err) {
        console.error(err.message);
    }
});
//Add new post
app.post('/posts', async(req, res) => {
    try {
        console.log("a post request has arrived");
        const { body }= req.body;
        const newpost = await pool.query(
            "INSERT INTO poststable(body) values ($1) RETURNING *", [body]
        );
        res.json(newpost);
    } catch (err) {
        console.error(err.message);
    }
});
app.listen(port, () => {
    console.log("Server is listening to port " + port)
});
