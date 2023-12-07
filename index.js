const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const port = process.env.PORT || 3000;
const router = express.Router();

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
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'Gl@cierlij73',
    resave: false,
    saveUninitialized: false
}));

// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.redirect('/login');
    }
};

// Route for the landing page
app.get('/', async (req, res) => {
    try {
        res.render('index');
    } catch (error) {
        console.error('Error rendering landing page:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route for displaying user data
app.get('/data', authenticateUser, async (req, res) => {
    try {
        const query = knex
            .select(
                'userinfo.userid as userid',
                'userinfo.age as age',
                'userinfo.gender as gender',
                'userinfo.relationshipstatus as relationshipstatus',
                'userinfo.occupationstatus as occupationstatus',
                'locationinfo.city as city',
                'locationinfo.county as county',
                'locationinfo.state as state',
                'locationinfo.locationid as locationid', // Add this line to select locationid
                'usersocialmediaplatforminfo.socialmediaplatformid as socialmediaplatformid',
                'socialmediaplatforminfo.socialmediaplatform as socialmediaplatform',
                'userorganizationaffiliationinfo.organizationaffiliationid as organizationaffiliationid',
                'organizationaffinfo.organizationaffiliation as organizationaffiliation',
                'overallresponseinfo.overalldistractionlevel as overalldistractionlevel',
                'overallresponseinfo.overallworrylevel as overallworrylevel',
                'overallresponseinfo.overallconcentrationlevel as overallconcentrationlevel',
                'overallresponseinfo.depressionfrequency as depressionfrequency',
                'overallresponseinfo.interestindailyactivitiesfluctuate as interestindailyactivitiesfluctuate',
                'overallresponseinfo.faceissuesregardingsleep as faceissuesregardingsleep',
                'socialmediaresponseinfo.smusage as smusage',
                'socialmediaresponseinfo.averagetimesmperday as averagetimesmperday',
                'socialmediaresponseinfo.smwithoutpurpose as smwithoutpurpose',
                'socialmediaresponseinfo.distractedbysm as distractedbysm',
                'socialmediaresponseinfo.restlessfromnosm as restlessfromnosm',
                'socialmediaresponseinfo.comparisonlevelsm as comparisonlevelsm',
                'socialmediaresponseinfo.feelingsoncomparisons as feelingsoncomparisons',
                'socialmediaresponseinfo.validationfrequencyfromsm as validationfrequencyfromsm',
                'userinfo.timestamp as timestamp'
            )
            .from('userinfo')
            .innerJoin('locationinfo', 'userinfo.locationid', 'locationinfo.locationid')
            .innerJoin('usersocialmediaplatforminfo', 'userinfo.userid', 'usersocialmediaplatforminfo.userid')
            .innerJoin('socialmediaplatforminfo', 'usersocialmediaplatforminfo.socialmediaplatformid', 'socialmediaplatforminfo.socialmediaplatformid')
            .innerJoin('userorganizationaffiliationinfo', 'userinfo.userid', 'userorganizationaffiliationinfo.userid')
            .innerJoin('organizationaffinfo', 'userorganizationaffiliationinfo.organizationaffiliationid', 'organizationaffinfo.organizationaffiliationid')
            .innerJoin('overallresponseinfo', 'userinfo.userid', 'overallresponseinfo.userid')
            .innerJoin('socialmediaresponseinfo', 'userinfo.userid', 'socialmediaresponseinfo.userid');

            const data = await query;

            // Create an array to store memberids with selected organizationaffiliationid values
            const organizationAffiliationMembers = {};
    
            // Create an array to store memberids with selected socialmediaplatformid values
            const socialMediaPlatformMembers = {};
    
            // Process user data to populate the arrays
            data.forEach(userinfo => {
                const memberId = userinfo.userid;
    
                // Check if organizationaffiliationid is selected
                if (userinfo.organizationaffiliationid) {
                    if (!organizationAffiliationMembers[memberId]) {
                        organizationAffiliationMembers[memberId] = [];
                    }
                    organizationAffiliationMembers[memberId].push(userinfo.organizationaffiliationid);
                }
    
                // Check if socialmediaplatformid is selected
                if (userinfo.socialmediaplatformid) {
                    if (!socialMediaPlatformMembers[memberId]) {
                        socialMediaPlatformMembers[memberId] = [];
                    }
                    socialMediaPlatformMembers[memberId].push(userinfo.socialmediaplatformid);
                }
            });
    
            console.log('Organization Affiliation Members:', organizationAffiliationMembers);
            console.log('Social Media Platform Members:', socialMediaPlatformMembers);
    
            // Set editUserId based on the first user in the data array
            const editUserId = data.length > 0 ? data[0].userid : null;
    
            // Render the data.ejs template with the additional information
            res.render('data', { user: data, organizationAffiliationMembers, socialMediaPlatformMembers, editUserId });
    
            // The misplaced line should be outside the forEach loop
            if (!req.session.user) {
                res.redirect('/login');
                return;
            }
        } catch (error) {
            console.error('Error fetching or rendering data:', error.message);
            res.status(500).send(`Internal Server Error: ${error.message}`);
        }
    });



// Route for displaying bucket list
app.get('/bucket_list', authenticateUser, async (req, res) => {
    try {
        const items = await knex.select('*').from('provo');
        res.render('Provo', { items });
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

app.get('/add', (req, res) => {
    res.render('add');
});

const { format } = require('date-fns');

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

        console.log('Received Timestamp:', timestamp);
        
        const formattedTimestamp = timestamp ? format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss') : null;
        console.log('Formatted Timestamp:', formattedTimestamp);

        // Insert user information and retrieve the generated userid
        const [userIdObject] = await knex('userinfo').insert({
            age,
            gender,
            relationshipstatus,
            occupationstatus,
            timestamp: formattedTimestamp || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),

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

        res.redirect('/thankyou');
    } catch (error) {
        console.error('Error adding data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

app.get('/thankyou', (req, res) => {
    res.render('thankyou');
});

// Route for rendering login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Route for rendering signup page
app.get('/signup', (req, res) => {
    res.render('login');
});

const { compare } = require('bcrypt');

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await knex('Authentication').select('*').where({ username });

        if (result.length > 0) {
            const user = result[0];

            // Check if the stored password is hashed
            if (user.is_hashed) {
                // Compare hashed password using bcrypt
                const passwordMatch = await compare(password, user.password);

                if (passwordMatch) {
                    // Set the user in the session
                    req.session.user = user;
                    res.redirect('/data');
                } else {
                    res.status(401).send('Invalid username/password');
                }
            } else {
                // Compare non-hashed password
                if (password === user.password) {
                    // Set the user in the session
                    req.session.user = user;
                    res.redirect('/data');
                } else {
                    res.status(401).send('Invalid username/password');
                }
            }
        } else {
            res.status(401).send('Invalid username/password');
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/signup', async (req, res) => {
    const { access_key, username, password, email, phone } = req.body;

    try {
        if (access_key !== 'ProvoCity') {
            return res.status(400).send('Invalid access_key. Account not created.');
        }

        const existingUser = await knex('authentication')
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

        await knex('authentication').insert({
            username,
            password, // Store password in plaintext
            email,
            phone,
            access_key
        });

        res.redirect('/login');
    } catch (error) {
        console.error('Error during signup:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/data/edit/:userid', authenticateUser, async (req, res) => {
    try {
        const userId = req.params.userid;

        // Fetch user data for the specified user ID
        const userData = await knex('userinfo').where('userid', userId).first();

        if (!userData) {
            // Handle case where user is not found
            return res.status(404).send('User not found');
        }

        // Render the edit form with the user data
        res.render('edit', { user: userData });
    } catch (error) {
        console.error('Error fetching user data for edit:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

// Route for handling the edited data submission
app.post('/data/edit/:userid', authenticateUser, async (req, res) => {
    try {
        const userId = req.params.userid;

        // Retrieve the edited data from the request body
        const editedAge = req.body.editedAge;
        const editedGender = req.body.editedGender;

        // Update the user data in the database
        await knex('userinfo').where('userid', userId).update({
            age: editedAge,
            gender: editedGender,
            // Add other fields as needed
        });

        // Log the edited fields
        console.log(`User ${userId} edited data:`, {
            age: editedAge,
            gender: editedGender,
            // Add other fields as needed
        });

        // Redirect back to the user data page after editing
        res.redirect('/data');
    } catch (error) {
        console.error('Error updating user data:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});



 
// Route for deleting data from the "userinfo" table
app.post('/deleteuser', (req, res) => {
    knex('userinfo')
        .where('userid', req.body.userToDelete)
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
