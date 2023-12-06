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
        password: process.env.RDS_PASSWORD || 'Gl@cierlij73',
        database: process.env.RDS_DB_NAME || 'Provo',
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
        const data = await knex.select('*').from('userinfo');
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
        const items = await knex.select('*').from('provo');
        res.render('Provo', { items });
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route for adding data to the "country" table
app.get('/add', (req, res) => {
    res.render('add');
});

const { format } = require('date-fns'); // Import the format function from date-fns

app.post('/add', async (req, res) => {
    console.log('Received data:', req.body);

    try {
        // Assuming the incoming data has the same format for all tables
        const {
            socialmediaplatformid,
            organizationaffiliationid,
            age,
            gender,
            relationshipstatus,
            occupationstatus,
            overalldistractionlevel,
            overallworrylevel,
            overallconcentrationlevel,
            depressionfrequency,
            interestindailyactivitiesfluctuate,
            faceissuesregardingsleep,
            smusage,
            averagetimesmperday,
            smwithoutpurpose,
            distractedbysm,
            restlessfromnosm,
            comparisonlevelsm,
            feelingsoncomparisons,
            validationfrequencyfromsm,
            timestamp
        } = req.body;

        // Insert user information and retrieve the generated userid
        const [userIdObject] = await knex('userinfo').insert({
            age,
            gender,
            relationshipstatus,
            occupationstatus,
            timestamp: timestamp || format(new Date(), 'yyyy-MM-dd HH:mm:ss'), // Use provided timestamp or current time
        }, 'userid');

        // Extract the "userid" property from the returned object
        const userId = userIdObject.userid;

        

       // Check if socialmediaplatformid is defined and an array
        const parsedPlatformIds = socialmediaplatformid && Array.isArray(socialmediaplatformid)
        ? socialmediaplatformid.map(id => parseInt(id))
        : [];

        // Insert each selected socialmediaplatformid separately
        for (const platformId of parsedPlatformIds) {
        await knex('usersocialmediaplatforminfo').insert({
            socialmediaplatformid: platformId,
            userid: userId,
        });
        }

        // Parse organizationaffiliationid values as integers and insert each one separately
        for (const affiliationId of organizationaffiliationid) {
            const parsedAffiliationId = parseInt(affiliationId);

            if (isNaN(parsedAffiliationId)) {
                console.error('Invalid value for organizationaffiliation:', affiliationId);
                throw new Error('Invalid value for organizationaffiliation');
            }

            await knex('userorganizationaffiliationinfo').insert({
                userid: userId,
                organizationaffiliationid: parsedAffiliationId,
            });
        }

        await knex('overallresponseinfo').insert({
            userid: userId,
            overalldistractionlevel,
            overallworrylevel,
            overallconcentrationlevel,
            depressionfrequency,
            interestindailyactivitiesfluctuate,
            faceissuesregardingsleep,
        });

        await knex('socialmediaresponseinfo').insert({
            userid: userId,
            smusage,
            averagetimesmperday,
            smwithoutpurpose,
            distractedbysm,
            restlessfromnosm,
            comparisonlevelsm,
            feelingsoncomparisons,
            validationfrequencyfromsm,
        });

        res.redirect('/thankyou'); // Redirect to the desired page after successful form submission

    } catch (error) {
        console.error('Error adding data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

app.get('/thankyou', (req, res) => {
    res.render('thankyou'); // Assuming you're using a templating engine like EJS
});


// Route for rendering login page
app.get('/login', (req, res) => {
    res.render('login'); // Rendering the "login.ejs" file for the "/login" route
});

// Route for rendering signup page
app.get('/signup', (req, res) => {
    res.render('login'); // Rendering the "login.ejs" file for the "/signup" route
});

// Route for processing login data
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await knex('Authentication').select('*').where({ username });

        if (result.length > 0) {
            const user = result[0];

            // Compare the provided password with the hashed password in the database
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // Passwords match, allow access
                res.render('data', { user });
            } else {
                // Invalid password
                res.status(401).send('Invalid username/password');
            }
        } else {
            // No user found with the given username
            res.status(401).send('Invalid username/password');
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

/// Route for processing signup data
// Route for processing signup data
app.post('/signup', async (req, res) => {
    console.log('Received data:', req.body);
    const { username, password, email, phone, Access_key } = req.body;

    try {
        // Check for a valid Access_key
        if (Access_key !== 'ProvoCity') {
            return res.status(400).send('Invalid Access_key. Account not created.');
        }

        // Check for duplicated username, email, or phone number
        const existingUser = await knex('Authentication')
            .select('username', 'email', 'phone')
            .where('username', username)
            .orWhere('email', email)
            .orWhere('phone', phone)
            .first();

        if (existingUser) {
            const duplicatedFields = [];
            if (existingUser.username === username) duplicatedFields.push('Username');
            if (existingUser.email === email) duplicatedFields.push('Email');
            if (existingUser.phone === phone) duplicatedFields.push('Phone');

            const errorMessage = `The following fields are already taken: ${duplicatedFields.join(', ')}`;
            return res.status(400).send(errorMessage);
        }

        // Signup logic
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedAccessKey = await bcrypt.hash(Access_key, 10);

        await knex('Authentication').insert({
            username,
            password: hashedPassword,
            email,
            phone,
            Access_key: hashedAccessKey,
        });

        res.redirect('/login'); // Redirect to login page after signup
    } catch (error) {
        console.error('Error during signup:', error.message);
        res.status(500).send('Internal Server Error');
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
app.listen(port, () => console.log(`Server is running on port ${port} this is the outer index.js`));
