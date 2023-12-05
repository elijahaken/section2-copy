const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;
const bcrypt = require('bcrypt'); // Added this line

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME || 'localhost',
        user: process.env.RDS_USERNAME || 'postgres',
        password: process.env.RDS_PASSWORD || 'Gl@cierlij73' || 'alozar',
        database: process.env.RDS_DB_NAME || 'bucket_list',
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
    },
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Moved this line to the top
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route for the landing page
app.get('/', async (req, res) => {
    try {
        // Assuming this renders the landing page
        res.render('index');
    } catch (error) {
        console.error('Error rendering landing page:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route for displaying data
app.get('/data', async (req, res) => {
    try {
        const data = await knex.select('*').from('country');
        console.log('Data from PostgreSQL:', data);
        res.render('data', { data });
    } catch (error) {
        console.error('Error fetching or rendering data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route for displaying bucket list
app.get('/bucket_list', async (req, res) => {
    try {
        const items = await knex.select('*').from('bucket-list');
        res.render('bucket_list', { items });
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route for adding data to the "country" table
app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', async (req, res) => {
    try {
        const { country_name, popular_site, capital, population, visited, covid_level } = req.body;

        await knex('country').insert({
            country_name,
            popular_site,
            capital,
            population,
            visited,
            covid_level,
        });

        res.redirect('/');
    } catch (error) {
        console.error('Error adding data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route for rendering the signup page
app.get('/login', (req, res) => {
    res.render('login'); // Rendering the "login.ejs" file for the "/signup" route
});

// Route for processing signup data
app.post('/login', async (req, res) => {
    try {
        const { username, password, email, phone, Access_key } = req.body;

        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10);

        await knex('Authentication').insert({
            username,
            password: hashedPassword,
            email,
            phone,
            Access_key,
        });

        res.redirect('/');
    } catch (error) {
        console.error('Error adding data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route for deleting data from the "country" table
app.post('/deletecountry', (req, res) => {
    knex('country')
        .where('country_id', req.body.countryToDelete)
        .del()
        .then(() => {
            res.redirect('/');
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
});

// Start the server
app.listen(port, () => console.log(`Server is running on port ${port}`));
