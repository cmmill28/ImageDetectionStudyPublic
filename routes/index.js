var express = require('express');
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

// Get user instance function
let getUserInstance = uid => users.find(user => user.id === uid);

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Decision Support Options
const decisionSupportOptions = [
    { type: 'human', expertise: 'low' },
    { type: 'human', expertise: 'medium' },
    { type: 'human', expertise: 'high' },
    { type: 'machine', expertise: 'low' },
    { type: 'machine', expertise: 'medium' },
    { type: 'machine', expertise: 'high' }
];

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

// Initialize Images with Metadata
const images = Array.from({ length: 45 }, (_, i) => ({
    filename: `image${i + 1}.png`,
    recommendations: {
        human_low: `Recommendation for human low for image${i + 1}`,
        human_medium: `Recommendation for human medium for image${i + 1}`,
        human_high: `Recommendation for human high for image${i + 1}`,
        machine_low: `Recommendation for machine low for image${i + 1}`,
        machine_medium: `Recommendation for machine medium for image${i + 1}`,
        machine_high: `Recommendation for machine high for image${i + 1}`
    }
}));

// Correct answers and images for practice questions
const practiceQuestions = [
    { questionNumber: 1, correctAnswer: 'Yes', image: 'practice1.png' },
    { questionNumber: 2, correctAnswer: 'No', image: 'practice2.png' },
    { questionNumber: 3, correctAnswer: 'Yes', image: 'practice3.png' },
    { questionNumber: 4, correctAnswer: 'No', image: 'practice4.png' },
    { questionNumber: 5, correctAnswer: 'Yes', image: 'practice5.png' },
    { questionNumber: 6, correctAnswer: 'No', image: 'practice6.png' },
    { questionNumber: 7, correctAnswer: 'Yes', image: 'practice7.png' },
    { questionNumber: 8, correctAnswer: 'No', image: 'practice8.png' },
    { questionNumber: 9, correctAnswer: 'Yes', image: 'practice9.png' },
    { questionNumber: 10, correctAnswer: 'No', image: 'practice10.png' },
    { questionNumber: 11, correctAnswer: 'Yes', image: 'practice11.png' },
    { questionNumber: 12, correctAnswer: 'No', image: 'practice12.png' },
    { questionNumber: 13, correctAnswer: 'Yes', image: 'practice13.png' },
    { questionNumber: 14, correctAnswer: 'No', image: 'practice14.png' },
    { questionNumber: 15, correctAnswer: 'Yes', image: 'practice15.png' }
];

// Helper function to log activity to the database
const logActivity = (db, collection, item) => {
    return db.collection(collection).insertOne(item);
};

// Function to fetch user record from the database
const fetchUserRecord = (db, userID) => {
    return db.collection('users').findOne({ "user": userID });
};

// Function to initialize a user session
const initializeUserSession = (userID, db) => {
    shuffleArray(images);
    const imageSets = [];
    for (let i = 0; i < images.length; i += 5) {
        imageSets.push(images.slice(i, i + 5));
    }

    const combinations = shuffleArray(generateHumanMachineCombinations());
    const userSession = [];
    for (let i = 0; i < 9; i++) {
        userSession.push({
            ...combinations[i],
            imageSet: imageSets[i]
        });
    }

    return {
        user: userID,
        practiceQuestions: shuffleArray([...practiceQuestions]), // Shuffle the practice questions as a whole
        userSession: userSession,
        currentIteration: 0,
        currentQuestionIndex: 0
    };
};

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
router.post('/intermediate', [
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

    res.render('intermediate', { userID: currentUser.id });
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
                correctAnswer: "Yes"
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
            if (userAnswer === currentQuestion.correctAnswer) {
                feedback = 'Correct!';
            } else {
                feedback = `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`;
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

        res.render('select_assistance', {
            userID: userID,
            iteration: currentIteration,
            option1: options.dssOption1,
            option2: options.dssOption2
        });
    }).catch(error => {
        console.error('Error occurred while displaying assistance options:', error);
        res.status(500).send('Internal Server Error');
    });
};

// Route to handle assistance selection
router.post('/activity/:userID/select_assistance', function (req, res, next) {
    const userID = sanitizeHtml(req.params.userID);
    const selectedOption = req.body.selectedOption;

    co(function* () {
        const db = dbClient.db(datab);
        const userRecord = yield fetchUserRecord(db, userID);
        if (!userRecord) {
            res.status(500).send('Internal Server Error: User record not found.');
            return;
        }

        const currentIteration = userRecord.currentIteration;
        const chosenOption = userRecord.userSession[currentIteration][selectedOption];
        const unselectedOption = selectedOption === "dssOption1" ? userRecord.userSession[currentIteration]["dssOption2"] : userRecord.userSession[currentIteration]["dssOption1"];
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
            timestamp: new Date()
        };

        yield logActivity(db, 'assistance_selection', item);

        // Initialize current question index for assisted round
        yield db.collection('users').updateOne(
            { "user": userID },
            { $set: { "currentQuestionIndex": 0, "selectedOption": chosenOption } }
        );

        handleAssistedRound(userID, res, db);
    }).catch(error => {
        console.error('Error occurred while handling assistance selection:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Function to handle assisted round questions
const handleAssistedRound = (userID, res, db) => {
    co(function* () {
        const userRecord = yield fetchUserRecord(db, userID);
        const currentIteration = userRecord.currentIteration;
        const currentQuestionIndex = userRecord.currentQuestionIndex;
        const chosenOption = userRecord.selectedOption;
        if (!chosenOption || !chosenOption.type || !chosenOption.expertise) {
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

            res.render('assisted_round', {
                userID: userID,
                iteration: currentIteration,
                questionNumber: currentQuestionIndex + 1,
                questionImage: question.filename,
                recommendation: question.recommendations[`${chosenOption.type}_${chosenOption.expertise}`],
                dssOption: chosenOption
            });
        } else {
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

        if (newQuestionIndex < userRecord.userSession[currentIteration].imageSet.length) {
            yield db.collection('users').updateOne(
                { "user": userID },
                { $set: { "currentQuestionIndex": newQuestionIndex } }
            );
            handleAssistedRound(userID, res, db);
        } else {
            // Increment the iteration and reset the question index
            const newIteration = currentIteration + 1;

            if (newIteration < userRecord.userSession.length) {
                yield db.collection('users').updateOne(
                    { "user": userID },
                    { $set: { "currentIteration": newIteration, "currentQuestionIndex": 0 } }
                );
                // Redirect to confidence assessment
                res.redirect(`/activity/${userID}/assisted_round/${newIteration}/confidence`);
            } else {
                // Redirect to survey
                res.redirect(`/survey/${userID}`);
            }
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
    res.render('confidence', { userID: userID, nextRoute: `/activity/${userID}/assisted_round/${iteration}/confidence/data`, isPracticeRound: false });
});

// Store confidence data and load assistance selection page after assisted round
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

        // Update the user document with the confidence data
        yield db.collection('users').updateOne(
            { "user": userID },
            { $set: { 
                [`assistedRoundConfidence_${iteration}`]: confidence,
                [`useRecommendation_${iteration}`]: useRecommendation,
                [`reliability_${iteration}`]: reliability,
                [`choiceReason_${iteration}`]: choiceReason,
                [`assistedRoundConfidenceTimestamp_${iteration}`]: new Date()
            }}
        );

        console.log('Assisted round confidence posted to db!');

        handleAssistanceSelectionAndActivity(userID, res, db);
    }).catch(error => {
        console.error('Error occurred while storing assisted round confidence data:', error);
        res.status(500).send('Internal Server Error');
    });
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
    body('employed').notEmpty().withMessage('Employment status is required'),
    body('nativeSpeaker').notEmpty().withMessage('Native speaker status is required'),
    body('stayInUS').notEmpty().withMessage('Duration in the US is required'),
    body('estimation').notEmpty().withMessage('MTurk participation status is required'),
    body('userID').notEmpty().withMessage('UserID is required')
], function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send('Invalid input');
    }

    const userID = sanitizeHtml(req.body.userID);
    const surveyData = {
        age: sanitizeHtml(req.body.age),
        gender: sanitizeHtml(req.body.gender),
        employed: sanitizeHtml(req.body.employed),
        nativeSpeaker: sanitizeHtml(req.body.nativeSpeaker),
        nativeLanguage: sanitizeHtml(req.body.nativeLanguage),
        stayInUS: sanitizeHtml(req.body.stayInUS),
        estimation: sanitizeHtml(req.body.estimation),
        specify: sanitizeHtml(req.body.specify)
    };

    console.log(`Received survey data for user: ${userID}`);
    console.log('Survey data:', surveyData);

    co(function* () {
        const db = dbClient.db(datab);

        // Handle the survey data (e.g., save to database)
        yield db.collection('surveys').insertOne({ user: userID, data: surveyData });

        // Check if MTurk code already exists for the user
        let userRecord = yield db.collection('users').findOne({ user: userID });
        if (!userRecord) {
            userRecord = { user: userID, mturkCode: generateMTurkCode() };
            yield db.collection('users').insertOne(userRecord);
        } else if (!userRecord.mturkCode) {
            userRecord.mturkCode = generateMTurkCode();
            yield db.collection('users').updateOne({ user: userID }, { $set: { mturkCode: userRecord.mturkCode } });
        }

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

        // Fetch the MTurk code for the user
        const userRecord = yield db.collection('users').findOne({ user: userID });
        if (userRecord && userRecord.mturkCode) {
            res.render('debrief', { mturkCode: userRecord.mturkCode });
        } else {
            res.status(404).send('User or MTurk code not found');
        }
    }).catch(error => {
        console.error('Error occurred while fetching MTurk code:', error);
        res.status(500).send('Internal Server Error');
    });
});

// 404 Error handler
router.use((req, res, next) => {
    res.status(404).send('404 Not Found');
});

// Function to generate a MTurk code
const generateMTurkCode = () => {
    return Math.random().toString(36).substring(7);
};

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
