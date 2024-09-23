var express = require('express');
const seedrandom = require('seedrandom');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
const co = require('co');
const User = require('../User');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

var url = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
var datab = 'DSSActivityDB';
let users = [];

// MongoDB connection client
let dbClient;
MongoClient.connect(url, { useUnifiedTopology: true })
    .then(client => {
        dbClient = client;
        console.log('Connected to database');
    })
    .catch(error => {
        console.error('Database connection failed:', error);
    });

// Decision Support Options
const decisionSupportOptions = [
    { type: 'human', expertise: 'small' },
    { type: 'human', expertise: 'medium' },
    { type: 'human', expertise: 'large' },
    { type: 'machine', expertise: 'small' },
    { type: 'machine', expertise: 'medium' },
    { type: 'machine', expertise: 'large' }
];

// Initialize Images with Metadata for 60 images
const images = [
    { filename: "Image1.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image2.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image3.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image4.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image5.png", recommendation: { AI: "absent", Crowd: "present" } },
    { filename: "Image6.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image7.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image8.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image9.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image10.png", recommendation: { AI: "present", Crowd: "absent" } },
    
    { filename: "Image11.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image12.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image13.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image14.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image15.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image16.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image17.png", recommendation: { AI: "absent", Crowd: "present" } },
    { filename: "Image18.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image19.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image20.png", recommendation: { AI: "absent", Crowd: "absent" } },

    { filename: "Image21.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image22.png", recommendation: { AI: "present", Crowd: "absent" } },
    { filename: "Image23.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image24.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image25.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image26.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image27.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image28.png", recommendation: { AI: "absent", Crowd: "present" } },
    { filename: "Image29.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image30.png", recommendation: { AI: "present", Crowd: "present" } },
    { filename: "Image31.png", recommendation: { AI: "present", Crowd: "present" } },

    { filename: "Image32.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image33.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image34.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image35.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image36.png", recommendation: { AI: "present", Crowd: "absent" } },
    { filename: "Image37.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image38.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image39.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image40.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image41.png", recommendation: { AI: "absent", Crowd: "present" } },

    { filename: "Image42.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image43.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image44.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image45.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image46.png", recommendation: { AI: "present", Crowd: "absent" } },
    { filename: "Image47.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image48.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image49.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image50.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image51.png", recommendation: { AI: "absent", Crowd: "present" } },

    { filename: "Image52.png", recommendation: { AI: "present", Crowd: "absent" } },
    { filename: "Image53.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image54.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image55.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image56.png", recommendation: { AI: "absent", Crowd: "present" } },
    { filename: "Image57.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image58.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image59.png", recommendation: { AI: "absent", Crowd: "absent" } },
    { filename: "Image60.png", recommendation: { AI: "absent", Crowd: "absent" } }
];


// Correct answers and images for practice questions
const practiceQuestions = [
    { questionNumber: 1, correctAnswer: 'Yes', image: 'practice1.png', look:'top left' },
    { questionNumber: 2, correctAnswer: 'No', image: 'practice2.png', look:'not present' },
    { questionNumber: 3, correctAnswer: 'Yes', image: 'practice3.png', look:'top left' },
    { questionNumber: 4, correctAnswer: 'No', image: 'practice4.png', look:'not present' },
    { questionNumber: 5, correctAnswer: 'Yes', image: 'practice5.png', look:'top left' },
    { questionNumber: 6, correctAnswer: 'No', image: 'practice6.png', look:'not present' },
    { questionNumber: 7, correctAnswer: 'Yes', image: 'practice7.png', look:'center left' },
    { questionNumber: 8, correctAnswer: 'No', image: 'practice8.png', look:'not present' },
    { questionNumber: 9, correctAnswer: 'Yes', image: 'practice9.png', look:'top center' },
    { questionNumber: 10, correctAnswer: 'No', image: 'practice10.png', look:'not present' },
    { questionNumber: 11, correctAnswer: 'Yes', image: 'practice11.png', look:'center left, behind reindeer' },
    { questionNumber: 12, correctAnswer: 'No', image: 'practice12.png', look:'not present' },
    { questionNumber: 13, correctAnswer: 'Yes', image: 'practice13.png', look:'top center' },
    { questionNumber: 14, correctAnswer: 'No', image: 'practice14.png', look:'not present' },
    { questionNumber: 15, correctAnswer: 'Yes', image: 'practice15.png', look:'top left' }
];
// Global seed value to ensure consistency (you can set this to anything)
const GLOBAL_SEED = "1234"; 

// Function to shuffle an array using a seeded random number generator
function shuffleArray(array, seed, trackOriginalOrder = false) {
    const rng = seedrandom(seed);  // Initialize the random number generator with a seed
    const originalIndices = array.map((_, index) => index);  // Track the original indices if needed
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));  // Use seeded randomness
        [array[i], array[j]] = [array[j], array[i]];  // Swap elements
        if (trackOriginalOrder) {
            [originalIndices[i], originalIndices[j]] = [originalIndices[j], originalIndices[i]];  // Swap indices
        }
    }
    return trackOriginalOrder ? { shuffledArray: array, originalIndices } : array;
}

// Get user instance function
let getUserInstance = uid => users.find(user => user.id === uid);

// Generate human-machine combinations of decision support options
function generateHumanMachineCombinations() {
    const combinations = [];
    const humanOptions = decisionSupportOptions.filter(option => option.type === 'human');
    const machineOptions = decisionSupportOptions.filter(option => option.type === 'machine');
    
    humanOptions.forEach(humanOption => {
        machineOptions.forEach(machineOption => {
            combinations.push({
                dssOption1: humanOption,
                dssOption2: machineOption
            });
        });
    });

    return combinations;
}

// Global DSS-to-image set mapping
let globalDSSImageSetMapping = null;

// Initialize DSS and image sets once for all users, using seeded randomness
function initializeGlobalDSSImageSetMapping() {
    const shuffledImages = shuffleArray([...images], `${GLOBAL_SEED}-images`);

    const imageSets = [];
    for (let i = 0; i < 9; i++) {
        imageSets.push(shuffledImages.slice(i * 6, (i + 1) * 6));
    }

    const shuffledDSSCombinations = shuffleArray(generateHumanMachineCombinations(), `${GLOBAL_SEED}-dss`);

    globalDSSImageSetMapping = shuffledDSSCombinations.map((dssCombination, index) => ({
        dssCombination: dssCombination,
        imageSet: imageSets[index]
    }));

    console.log("Global DSS to Image Set Mapping Created:", globalDSSImageSetMapping);
}

// Function to shuffle the order of imagesG within each set for a user, using a seed for per-user randomness
function shuffleImageSetsForUser(userID) {
    // Shuffle the DSS-to-image set mapping for each user
    const shuffledMapping = shuffleArray([...globalDSSImageSetMapping], `${userID}-dss-order`);
    
    return shuffledMapping.map(mapping => ({
        dssCombination: mapping.dssCombination,
        imageSet: shuffleArray([...mapping.imageSet], `${Date.now()}-${userID}-set`)  // Shuffle order of images within the set for each user
    }));
}

// Helper function to log activity to the database
const logActivity = (db, collection, item) => {
    return db.collection(collection).insertOne(item);
};

// Function to fetch user record from the database
const fetchUserRecord = (db, userID) => {
    return db.collection('users').findOne({ "user": userID });
};

// Initialize a new session for each user
function initializeUserSession(userID, db) {
    return co(function* () {
        const dbCollection = db.collection('users');
        const existingUser = yield dbCollection.findOne({ user: userID });

        if (!existingUser) {
            if (!globalDSSImageSetMapping) {
                initializeGlobalDSSImageSetMapping();  // Ensures global sets are created only once
            }
            
            const shuffledPracticeQuestions = shuffleArray([...practiceQuestions], `${userID}-practice`);
            const userSession = shuffleImageSetsForUser(userID);  // Unique shuffle for this user

            const newUserSession = {
                user: userID,
                practiceQuestions: shuffledPracticeQuestions,
                userSession: userSession,
                currentIteration: 0,
                currentQuestionIndex: 0
            };

            yield dbCollection.insertOne(newUserSession);
            console.log(`Created new session for user ${userID}`);

            return newUserSession;
        } else {
            console.log(`Session already exists for user ${userID}`);
            return existingUser;
        }
    });
    
}

// If not already initialized, initialize the global DSS-image set mapping

// Debugging: Log global DSS image set mapping
console.log("Global DSS Image Set Mapping:", globalDSSImageSetMapping);

// Get home page
router.get('/', function (req, res, next) {
    res.render('index');
});


// Handle consent form submission
router.post('/consent', [
    body('consentAgreement').equals('on').withMessage('You must agree to the consent form.'),
    body('notNCSUEmployee').equals('on').withMessage('You must state that you are not an employee of North Carolina State University.')
], function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('index', { error: errors.array().map(e => e.msg).join(' ') });
    }

    res.redirect('/start');
});

// Render start page
router.get('/start', function (req, res, next) {
    res.render('start'); // This should render the user ID input form
});

// Render intermediate page after start
router.post('/practice_intro', [
    body('userID').trim().isLength({ min: 5, max: 20 }).isAlphanumeric().withMessage('User ID must be alphanumeric and between 5 to 20 characters')
], function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('start', { error: errors.array().map(e => e.msg).join(' ') });
    }

    const userID = sanitizeHtml(req.body.userID);

    let currentUser = getUserInstance(userID);

    if (!currentUser) {
        users.push(new User(userID));
        currentUser = getUserInstance(userID);
    }

    res.render('practice_intro', { userID: currentUser.id });
});

// Handle intermediate page form submission and start with practice questions
router.post('/activity', [
    body('userID').trim().isLength({ min: 5, max: 20 }).isAlphanumeric().withMessage('User ID must be alphanumeric and between 5 to 20 characters')
], function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('start', { error: errors.array().map(e => e.msg).join(' ') });
    }

    const userID = sanitizeHtml(req.body.userID);

    let currentUser = getUserInstance(userID);

    if (!currentUser) {
        users.push(new User(userID));
        currentUser = getUserInstance(userID);
    }

    co(function* () {
        const db = dbClient.db(datab);
        let usersCol = db.collection('users');

        let check = yield usersCol.findOne({ "user": currentUser.id });

        if (check === null && currentUser.id != null) {
            const userSessionData = initializeUserSession(currentUser.id, db);
            yield usersCol.insertOne(userSessionData);

            console.log('User session data initialized:', userSessionData);

            res.render('practice', {
                userID: currentUser.id,
                questionNumber: 1,
                questionImage: "practice1.png",
                correctAnswer: "Yes",
                look: "top left"
            });

        } else {
            res.render('start', { error: "ERROR: User ID already exists" });
        }
    }).catch(error => {
        console.error('Error occurred while storing user in /start/ route:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Load practice questions
router.post('/activity/:userID/practice', [
    body('questionNumber').isInt(),
    body('selectedAnswer').optional().trim().escape(),
    body('correctAnswer').optional().trim().escape()
], function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    const questionNumber = parseInt(req.body.questionNumber, 10);
    const userAnswer = req.body.selectedAnswer ? sanitizeHtml(req.body.selectedAnswer) : '';
    const correctAnswer = req.body.correctAnswer ? sanitizeHtml(req.body.correctAnswer) : '';
    const timeTaken = parseInt(req.body.timeTaken, 10);

    co(function* () {
        const db = dbClient.db(datab);
        const userRecord = yield fetchUserRecord(db, userID);
        if (!userRecord || !userRecord.practiceQuestions) {
            console.error('No practice questions found for user:', userID);
            res.status(500).send('Internal Server Error: No practice questions found.');
            return;
        }

        const maxPracticeQuestions = userRecord.practiceQuestions.length;
        const currentQuestion = userRecord.practiceQuestions[questionNumber - 1]; // Get the current question

        if (!currentQuestion) {
            console.error('No current question found for question number:', questionNumber);
            res.status(500).send('Internal Server Error: No current question found.');
            return;
        }

        let feedback = '';
        if (userAnswer) {
            switch (currentQuestion.correctAnswer) {
                case 'Yes':
                    if (userAnswer === 'Yes') {
                        feedback = 'Correct!';
                    } else {
                        feedback = `Incorrect. The correct answer was: Yes. The object is located ${currentQuestion.look}.`;
                    }
                    break;
                case 'No':
                    if (userAnswer === 'No') {
                        feedback = 'Correct!';
                    } else {
                        feedback = 'Incorrect. The correct answer was: No.';
                    }
                    break;
                default:
                    feedback = 'Error: Invalid correct answer.';
            }
        }

        if (questionNumber < maxPracticeQuestions) {
            const nextQuestion = userRecord.practiceQuestions[questionNumber]; // Get the next question in order

            const item = {
                user: userID,
                questionNumber: questionNumber,
                questionType: 'practice',
                timestamp: new Date(),
                userAnswer: userAnswer,
                correctAnswer: currentQuestion.correctAnswer,
                timeTaken: timeTaken // Store the time taken for each question
            };

            yield logActivity(db, 'practice_log', item);

            res.render('practice', {
                userID: userID,
                questionNumber: questionNumber + 1,
                questionImage: nextQuestion ? nextQuestion.image : '', // Ensuring the next question image is fetched correctly
                correctAnswer: nextQuestion ? nextQuestion.correctAnswer : '',
                look: nextQuestion ? nextQuestion.look : '',
                feedback: feedback
            });
        } else {
            res.redirect(`/activity/${userID}/practice/0/confidence`);
        }
    }).catch(error => {
        console.error('Error occurred while logging practice activity:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Load confidence assessment page for practice
router.get('/activity/:userID/practice/0/confidence', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    res.render('confidence', { userID: userID, nextRoute: `/activity/${userID}/practice/0/confidence/data`, isPracticeRound: true });
});

// Store confidence data and load buffer page after practice
router.post('/activity/:userID/practice/0/confidence/data', [
    body('confidence').isInt({ min: 0, max: 10 })
], function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Invalid input');
    }

    const userID = sanitizeHtml(req.params.userID);
    const confidence = req.body.confidence;

    co(function* () {
        const db = dbClient.db(datab);

        // Update the user document with the confidence data
        yield db.collection('users').updateOne(
            { "user": userID },
            { $set: { "practiceConfidence": confidence, "practiceConfidenceTimestamp": new Date() } }
        );

        console.log('Practice confidence posted to db!');

        res.redirect(`/activity/${userID}/buffer`);
    }).catch(error => {
        console.error('Error occurred while storing practice confidence data:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Route to render the buffer page
router.get('/activity/:userID/buffer', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    res.render('buffer', { userID: userID });
});

// Route to handle the buffer page form submission and redirect to select assistance
router.post('/activity/:userID/buffer/next', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    handleAssistanceSelectionAndActivity(userID, res, dbClient.db(datab));
});

// Function to handle assistance selection and activity
const handleAssistanceSelectionAndActivity = (userID, res, db) => {
    co(function* () {
        const userRecord = yield fetchUserRecord(db, userID);
        if (!userRecord) {
            res.status(500).send('Internal Server Error: User record not found.');
            return;
        }

        const currentIteration = userRecord.currentIteration;

        if (currentIteration >= 9) {
            res.redirect(`/survey/${userID}`);
            return;
        }

        const options = userRecord.userSession[currentIteration];

        // Check if DSS combination exists
        if (!options || !options.dssCombination) {
            console.error('Invalid DSS combination:', options); // Debugging log
            res.status(500).send('Internal Server Error: DSS combination is invalid.');
            return;
        }

        const chosenOption = options.dssCombination.dssOption1;
        const unselectedOption = options.dssCombination.dssOption2;

        // Validate that both options have the 'type' property
        if (!chosenOption.type || !unselectedOption.type) {
            console.error('Chosen or unselected option is missing type:', chosenOption, unselectedOption); // Debugging log
            res.status(500).send('Internal Server Error: Chosen or unselected option is missing type.');
            return;
        }

        console.log(`User ${userID} selecting between:`, chosenOption, unselectedOption); // Debugging log

        // Save the chosen and unselected options to the user record
        yield db.collection('users').updateOne(
            { user: userID },
            {
                $set: {
                    chosenAssistance: `${chosenOption.type}: ${chosenOption.expertise}`,
                    unselectedAssistance: `${unselectedOption.type}: ${unselectedOption.expertise}`
                }
            }
        );

        res.render('select_assistance', {
            userID: userID,
            iteration: currentIteration,
            option1: chosenOption,
            option2: unselectedOption
        });
    }).catch(error => {
        console.error('Error occurred while displaying assistance options:', error); // Debugging log
        res.status(500).send('Internal Server Error');
    });
};



// Route to display the assistance selection page
router.get('/activity/:userID/select_assistance', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    handleAssistanceSelectionAndActivity(userID, res, dbClient.db(datab));
});

router.post('/activity/:userID/select_assistance', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    const selectedOption = req.body.selectedOption;  // "dssOption1" or "dssOption2"
    const timeTaken = parseFloat(req.body.timeTaken);  // Time taken to make the choice

    co(function* () {
        const db = dbClient.db(datab);
        const userRecord = yield fetchUserRecord(db, userID);

        if (!userRecord) {
            res.status(500).send('Internal Server Error: User record not found.');
            return;
        }

        const currentIteration = userRecord.currentIteration;
        const userSession = userRecord.userSession[currentIteration];

        // Ensure userSession and dssCombination are available and correctly structured
        if (!userSession || !userSession.dssCombination) {
            console.error('Invalid session structure:', userSession);
            res.status(500).send('Internal Server Error: Invalid session structure.');
            return;
        }

        const { dssOption1, dssOption2 } = userSession.dssCombination;

        // Determine the chosen and unselected options
        const chosenOption = selectedOption === 'dssOption1' ? dssOption1 : dssOption2;
        const unselectedOption = selectedOption === 'dssOption1' ? dssOption2 : dssOption1;

        // Validate the selected option
        if (!chosenOption || !chosenOption.type || !chosenOption.expertise) {
            console.error('Invalid chosen option:', chosenOption);
            res.status(500).send('Internal Server Error: Chosen option is invalid.');
            return;
        }

        const item = {
            user: userID,
            iteration: currentIteration,
            selectedOption: chosenOption,
            unselectedOption: unselectedOption,
            timestamp: new Date(),
            timeTaken: isNaN(timeTaken) ? 0 : timeTaken  // Ensure timeTaken is valid
        };

        // Log activity and update user session
        yield logActivity(db, 'assistance_selection', item);

        // Update the user's selected and unselected options in the database
        yield db.collection('users').updateOne(
            { "user": userID },
            { $set: { "currentQuestionIndex": 0, "selectedOption": chosenOption, "unselectedOption": unselectedOption } }
        );

        handleAssistedRound(userID, res, db);
    }).catch(error => {
        console.error('Error occurred during assistance selection:', error);
        res.status(500).send('Internal Server Error');
    });
});



// Function to handle assisted round questions
const handleAssistedRound = (userID, res, db) => {
    co(function* () {
        const userRecord = yield fetchUserRecord(db, userID);
        let currentIteration = userRecord.currentIteration;
        const currentQuestionIndex = userRecord.currentQuestionIndex;
        const chosenOption = userRecord.selectedOption;

        if (!chosenOption || !chosenOption.type) {
            console.error('Invalid chosen option during assisted round:', chosenOption);
            res.status(500).send('Internal Server Error: Chosen option is invalid.');
            return;
        }

        const imageSet = userRecord.userSession[currentIteration].imageSet;

        if (!imageSet || !Array.isArray(imageSet)) {
            console.error('Invalid image set during assisted round:', imageSet);
            res.status(500).send('Internal Server Error: Image set is invalid.');
            return;
        }

        if (currentQuestionIndex < imageSet.length) {
            const question = imageSet[currentQuestionIndex];

            // Adjusted logic: No tiers, just AI and Crowd recommendation
            const recommendation = chosenOption.type === 'human' 
                ? question.recommendation.Crowd 
                : question.recommendation.AI;

                res.render('assisted_round', {
                    userID: userID,
                    iteration: currentIteration,
                    questionNumber: currentQuestionIndex + 1,
                    questionImage: question.filename.toLowerCase(),
                
                    // Change "Recommendation: present" to "Target Present"
                    recommendation: `\nTarget ${recommendation.charAt(0).toUpperCase() + recommendation.slice(1)}`, 
                    
                    // Change "Source: Human, Tier: Small" to "Source: Human Small"
                    source: `Source: ${chosenOption.type.charAt(0).toUpperCase() + chosenOption.type.slice(1)} ${chosenOption.expertise.charAt(0).toUpperCase() + chosenOption.expertise.slice(1)}`
                });
                
        } else {
            // Redirect to confidence assessment for current iteration
            res.redirect(`/activity/${userID}/assisted_round/${currentIteration}/confidence`);
        }
    }).catch(error => {
        console.error('Error occurred while loading assisted round:', error);
        res.status(500).send('Internal Server Error');
    });
};

// Route to handle assisted round
router.post('/activity/:userID/assisted_round', [
    body('answer').optional().trim().escape(),
    body('timeTaken').isInt({ min: 0, max: 60 }),
    body('timeExpired').isBoolean(),
    body('selectedAnswer').trim().escape(),
    body('recommendation').trim().escape(),
    body('questionImage').trim().escape()
], function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    const answer = req.body.answer ? sanitizeHtml(req.body.answer) : '';
    const timeTaken = parseInt(req.body.timeTaken, 10);
    const timeExpired = req.body.timeExpired;
    const selectedAnswer = req.body.selectedAnswer;
    const recommendation = req.body.recommendation;
    const questionImage = req.body.questionImage;

    co(function* () {
        const db = dbClient.db(datab);
        const userRecord = yield fetchUserRecord(db, userID);
        if (!userRecord) {
            res.status(500).send('Internal Server Error: User record not found.');
            return;
        }

        const currentIteration = userRecord.currentIteration;
        const currentQuestionIndex = userRecord.currentQuestionIndex;

        const item = {
            user: userID,
            iteration: currentIteration,
            questionNumber: currentQuestionIndex,
            timestamp: new Date(),
            timeTaken: timeTaken,
            timeExpired: timeExpired,
            selectedAnswer: selectedAnswer,
            recommendation: recommendation,
            questionImage: questionImage
        };

        yield logActivity(db, 'assisted_round_log', item);

        // Update current question index
        const newQuestionIndex = currentQuestionIndex + 1;

        if (newQuestionIndex < userRecord.userSession[currentIteration].imageSet.length + 1) {
            yield db.collection('users').updateOne(
                { "user": userID },
                { $set: { "currentQuestionIndex": newQuestionIndex } }
            );
            handleAssistedRound(userID, res, db);
        } else {
            // Redirect to confidence assessment for current iteration
            res.redirect(`/activity/${userID}/assisted_round/${currentIteration}/confidence`);
        }
    }).catch(error => {
        console.error('Error occurred while logging assisted round data:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Load confidence assessment page for assisted round
router.get('/activity/:userID/assisted_round/:iteration/confidence', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    const iteration = req.params.iteration;
    const db = dbClient.db(datab);

    co(function* () {
        const userRecord = yield fetchUserRecord(db, userID);
        if (!userRecord) {
            res.status(500).send('Internal Server Error: User record not found.');
            return;
        }

        const selectedOption = userRecord.selectedOption;
        const unselectedOption = userRecord.unselectedOption;

        res.render('confidence', {
            userID: userID,
            nextRoute: `/activity/${userID}/assisted_round/${iteration}/confidence/data`,
            isPracticeRound: false,
            chosenAssistance: `${selectedOption.type} ${selectedOption.expertise}`,
            unselectedAssistance: `${unselectedOption.type} ${unselectedOption.expertise}`
        });
    }).catch(error => {
        console.error('Error occurred while loading confidence assessment:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Store confidence data and handle next steps
router.post('/activity/:userID/assisted_round/:iteration/confidence/data', [
    body('confidence').isInt({ min: 0, max: 10 }),
    body('useRecommendation').isInt({ min: 0, max: 10 }).optional({ checkFalsy: true }),
    body('reliability').isInt({ min: 0, max: 10 }).optional({ checkFalsy: true }),
    body('choiceReason').optional({ checkFalsy: true }).trim().escape()
], function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Invalid input');
    }

    const userID = sanitizeHtml(req.params.userID);
    const iteration = sanitizeHtml(req.params.iteration);
    const confidence = req.body.confidence;
    const useRecommendation = req.body.useRecommendation ? req.body.useRecommendation : '';
    const reliability = req.body.reliability ? req.body.reliability : '';
    const choiceReason = req.body.choiceReason ? sanitizeHtml(req.body.choiceReason) : '';

    co(function* () {
        const db = dbClient.db(datab);

        // Fetch the user record to ensure it's available in this context
        const userRecord = yield fetchUserRecord(db, userID);
        if (!userRecord) {
            res.status(500).send('Internal Server Error: User record not found.');
            return;
        }

        // Update the user document with the confidence data
        yield db.collection('users').updateOne(
            { "user": userID },
            {
                $set: {
                    [`assistedRoundConfidence_${iteration}`]: confidence,
                    [`useRecommendation_${iteration}`]: useRecommendation,
                    [`reliability_${iteration}`]: reliability,
                    [`choiceReason_${iteration}`]: choiceReason,
                    [`assistedRoundConfidenceTimestamp_${iteration}`]: new Date()
                }
            }
        );

        console.log('Assisted round confidence posted to db!');

        // Increment the iteration counter
        const newIteration = parseInt(iteration, 10) + 1;
        yield db.collection('users').updateOne(
            { "user": userID },
            { $set: { "currentIteration": newIteration, "currentQuestionIndex": 0 } }
        );

        // Redirect to break page on the 3rd and 6th iterations
        if (newIteration === 3 || newIteration === 6) {
            console.log(`Redirecting user: ${userID} to break page`);
            res.redirect(`/activity/${userID}/break?nextIteration=${newIteration}`);
        } else {
            console.log(`Proceeding to next activity for user: ${userID}, iteration: ${newIteration}`);
            res.redirect(`/activity/${userID}/select_assistance`);
        }
    }).catch(error => {
        console.error('Error occurred while storing assisted round confidence data:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Load break page after each confidence assessment
router.get('/activity/:userID/break', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    const nextIteration = parseInt(req.query.nextIteration, 10);
    res.render('break', { userID: userID, nextIteration: nextIteration });
});

// Route to handle the buffer page form submission and redirect to select assistance
router.post('/activity/:userID/buffer/next', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    const nextIteration = parseInt(req.body.nextIteration, 10);
    handleAssistanceSelectionAndActivity(userID, res, dbClient.db(datab));
});

// GET route to load survey page
router.get('/survey/:userID', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    console.log(`GET Survey route hit for user: ${userID}`);
    res.render('survey', { userID: userID });
});

// POST route to load survey page if needed
router.post('/survey/:userID', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    console.log(`POST Survey route hit for user: ${userID}`);
    res.render('survey', { userID: userID });
});

// Route to submit survey data
router.post('/submitSurvey', [
    body('age').notEmpty().withMessage('Age is required'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('userID').notEmpty().withMessage('UserID is required')
], function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Invalid input');
    }

    const userID = sanitizeHtml(req.body.userID);
    const surveyData = {
        age: sanitizeHtml(req.body.age),
        gender: sanitizeHtml(req.body.gender)
    };

    console.log(`Received survey data for user: ${userID}`);
    console.log('Survey data:', surveyData);

    co(function* () {
        const db = dbClient.db(datab);

        // Handle the survey data (e.g., save to database)
        yield db.collection('surveys').insertOne({ user: userID, data: surveyData });

        // Redirect to debrief page
        res.redirect(`/activity/${userID}/debrief`);
    }).catch(error => {
        console.error('Error occurred while submitting survey data:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Route to load debriefing page
router.get('/activity/:userID/debrief', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);

    co(function* () {
        const db = dbClient.db(datab);

        // Fetch the user record to verify the user exists
        const userRecord = yield db.collection('users').findOne({ user: userID });
        if (userRecord) {
            res.render('debrief', { userID: userID });
        } else {
            res.status(404).send('User not found');
        }
    }).catch(error => {
        console.error('Error occurred while fetching user data:', error);
        res.status(500).send('Internal Server Error');
    });
});

// 404 Error handler
router.use((req, res, next) => {
    res.status(404).send('404 Not Found');
});

// Store activity data
router.post('/activity/:userID/data', [
    body('userID').trim().escape(),
    body('time').isInt({ min: 0, max: 60 }),
    body('q1').trim().escape(),
    body('q2').isInt(),
    body('q3').trim().escape(),
    body('x').trim().escape(),
    body('y').trim().escape(),
    body('timeExpired').isBoolean()
], function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Invalid input');
    }

    const userID = sanitizeHtml(req.params.userID);
    let currentUser = getUserInstance(userID);
    const question = currentUser.currentQ();

    let group = Object.keys(req.body);
    group = JSON.parse(group);

    group[2] = group[2].substring(0, group[2].length - 1);
    group[2] = parseInt(group[2]);
    console.log(group);

    const TimeLeft = group[0];
    currentUser.setPrevTime(TimeLeft);
    const time = 60 - TimeLeft;
    const timeExpired = req.body.timeExpired === 'true';

    console.log('timeLeft  ', TimeLeft);
    console.log('time spent  ', time);
    console.log('time expired', timeExpired);

    co(function* () {
        const db = dbClient.db(datab);

        const item = {
            user: userID,
            question: question,
            time: time,
            timeExpired: timeExpired,
            q1: group[1],
            q2: group[2],
            q3: group[3],
            x: group[4],
            y: group[5],
            timestamp: new Date()
        };

        if (group[1] != -2 && group[3] != -2) {
            yield logActivity(db, 'responses', item);
            console.log('Posted to db!');
        } else {
            console.log("Invalid input, retry");
        }
    }).catch(error => {
        console.error('Error occurred while storing data:', error);
        res.status(500).send('Internal Server Error');
    });
});

module.exports = router;