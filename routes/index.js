/*
* Complete Express.js Application Code (Finished)
* This file implements the pseudocode functionality using Express and Firestore.
*/

const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const { body, validationResult } = require('express-validator');
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Configure body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup view engine (this example uses EJS; adjust if you use another engine)
app.set('view engine', 'twig');

// Initialize Firebase Admin SDK for Firestore (ensure you have a valid service account key)
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./bubbly-journey-283623-e4d4d7c69cea.json'); // Adjust the path as needed

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});

const firestore = firebaseAdmin.firestore();
firestore.settings({ ignoreUndefinedProperties: true }); 

// Global variable initialization as referenced in the pseudocode
global.globalDSSImageSetMapping = null;

// In-memory store for user sessions (for demonstration purposes)
let userSessions = {};

// Global variable to toggle skipping assisted rounds for testing
let skipAssistedRoundEnabled = false; // Default to false

// ======================
// 1. Core Data Structures
// ======================

// Define assistance types with metadata
const ASSISTANCE_TYPES = {
  HUMAN_LARGE: { type: 'human', size: 'large', color: '#4ba5ff' },    
  HUMAN_MED: { type: 'human', size: 'medium', color: '#4ba5ff' },     
  ML_LARGE: { type: 'machine', size: 'large', color: '#9dc8bf' },     
  ML_MED: { type: 'machine', size: 'medium', color: '#9dc8bf' }       
};

// Generate all possible pairwise combinations
function generatePairs() {
  return [
    [ASSISTANCE_TYPES.HUMAN_LARGE, ASSISTANCE_TYPES.ML_LARGE],
    [ASSISTANCE_TYPES.HUMAN_LARGE, ASSISTANCE_TYPES.ML_MED],
    [ASSISTANCE_TYPES.HUMAN_MED, ASSISTANCE_TYPES.ML_LARGE],
    [ASSISTANCE_TYPES.HUMAN_MED, ASSISTANCE_TYPES.ML_MED]
  ];
}
  

// Practice questions with correct answers
const practiceQuestions = [
  { questionNumber: 1, correctAnswer: 'No', image: 'practice1.png', look:'not present' },
  { questionNumber: 2, correctAnswer: 'No', image: 'practice2.png', look:'not present' },
  { questionNumber: 3, correctAnswer: 'No', image: 'practice3.png', look:'not present' },
  { questionNumber: 4, correctAnswer: 'No', image: 'practice4.png', look:'not present' },
  { questionNumber: 5, correctAnswer: 'No', image: 'practice5.png', look:'not present' },
  { questionNumber: 6, correctAnswer: 'No', image: 'practice6.png', look:'not present' },
  { questionNumber: 7, correctAnswer: 'No', image: 'practice7.png', look:'not present' },
  { questionNumber: 8, correctAnswer: 'Yes', image: 'practice8.png', look:'bottom left' },
  { questionNumber: 9, correctAnswer: 'Yes', image: 'practice9.png', look:'top center' },
  { questionNumber: 10, correctAnswer: 'Yes', image: 'practice10.png', look:'bottom right' },
  { questionNumber: 11, correctAnswer: 'Yes', image: 'practice11.png', look:'center right, behind reindeer' },
  { questionNumber: 12, correctAnswer: 'Yes', image: 'practice12.png', look:'bottom right' },
  { questionNumber: 13, correctAnswer: 'Yes', image: 'practice13.png', look:'top center' },
  { questionNumber: 14, correctAnswer: 'Yes', image: 'practice14.png', look:'bottom left' },
  { questionNumber: 15, correctAnswer: 'Yes', image: 'practice15.png', look:'top left' }
];

// Map each image to its human and machine recommendation correctness
const imageData = {
// Block 1
"Image1":  { humanRec: "Correct",  machineRec: "Incorrect" },  
"Image9":  { humanRec: "Incorrect",  machineRec: "Incorrect" },
"Image13": { humanRec: "Correct",  machineRec: "Correct"   },
"Image17": { humanRec: "Correct",  machineRec: "Correct"   },  
"Image18": { humanRec: "Incorrect",machineRec: "Correct"   },
"Image22": { humanRec: "Correct",machineRec:   "Correct"   },
"Image23": { humanRec: "Correct",  machineRec: "Correct"   },
"Image29": { humanRec: "Correct",  machineRec: "Correct"   },
"Image31": { humanRec: "Correct",  machineRec: "Correct"   },
"Image38": { humanRec: "Incorrect",  machineRec: "Incorrect" },
"Image42": { humanRec: "Correct",  machineRec: "Correct"   },
"Image43": { humanRec: "Correct",  machineRec: "Correct"   },
"Image47": { humanRec: "Correct",  machineRec: "Correct"   },
"Image52": { humanRec: "Correct",  machineRec: "Incorrect" },
"Image55": { humanRec: "Correct",  machineRec: "Correct"   },
"Image65": { humanRec: "Correct",  machineRec: "Correct"   },
"Image67": { humanRec: "Correct",  machineRec: "Correct" },
"Image70": { humanRec: "Correct",  machineRec: "Correct" },
"Image78": { humanRec: "Incorrect",machineRec: "Correct"   },
"Image80": { humanRec: "Correct",  machineRec: "Correct"   },

// Block 2
"Image4":  { humanRec: "Correct",  machineRec: "Correct"   },
"Image6":  { humanRec: "Correct",  machineRec: "Correct"   },  
"Image12": { humanRec: "Correct",  machineRec: "Incorrect" },
"Image15": { humanRec: "Correct",machineRec: "Correct"   },
"Image16": { humanRec: "Correct",  machineRec: "Correct"   },
"Image19": { humanRec: "Correct",  machineRec: "Correct"   },
"Image28": { humanRec: "Correct",  machineRec: "Correct"   },  
"Image32": { humanRec: "Correct",  machineRec: "Correct"   },  
"Image34": { humanRec: "Correct",  machineRec: "Incorrect"   },
"Image36": { humanRec: "Correct",  machineRec: "Incorrect" },
"Image41": { humanRec: "Incorrect",machineRec: "Correct"   },  
"Image45": { humanRec: "Correct",  machineRec: "Correct" },
"Image46": { humanRec: "Incorrect",machineRec: "Correct"   },
"Image58": { humanRec: "Correct",  machineRec: "Correct"   },
"Image59": { humanRec: "Correct",  machineRec: "Correct"   },
"Image56": { humanRec: "Incorrect",machineRec: "Correct"   },
"Image69": { humanRec: "Correct",  machineRec: "Incorrect" },
"Image71": { humanRec: "Correct",  machineRec: "Correct"   },
"Image72": { humanRec: "Incorrect",machineRec: "Correct"   },
"Image74": { humanRec: "Correct",  machineRec: "Correct"   },

// Block 3
"Image5":  { humanRec: "Correct",  machineRec: "Correct"   },  
"Image7":  { humanRec: "Correct",  machineRec: "Correct"   },
"Image8":  { humanRec: "Correct",  machineRec: "Incorrect"   },
"Image11": { humanRec: "Correct",  machineRec: "Correct"   },
"Image24": { humanRec: "Incorrect",machineRec: "Incorrect" },
"Image25": { humanRec: "Incorrect",machineRec: "Correct"   },
"Image26": { humanRec: "Correct",  machineRec: "Incorrect"   },
"Image30": { humanRec: "Correct",  machineRec: "Correct"   },
"Image33": { humanRec: "Correct",  machineRec: "Correct"   },
"Image39": { humanRec: "Correct",  machineRec: "Correct"   },
"Image48": { humanRec: "Correct",  machineRec: "Correct"   },
"Image49": { humanRec: "Incorrect",machineRec: "Correct"   },
"Image50": { humanRec: "Correct",  machineRec: "Correct" },
"Image54": { humanRec: "Correct",  machineRec: "Correct"   },
"Image64": { humanRec: "Correct",  machineRec: "Correct"   },
"Image73": { humanRec: "Correct",  machineRec: "Incorrect" },
"Image75": { humanRec: "Correct",  machineRec: "Correct"   },
"Image79": { humanRec: "Incorrect",  machineRec: "Correct"   },
"Image62": { humanRec: "Correct",  machineRec: "Correct"   },  
"Image76": { humanRec: "Correct",  machineRec: "Correct"   },  

// Block 4
"Image2":  { humanRec: "Incorrect",  machineRec: "Correct"   },  
"Image3":  { humanRec: "Correct",  machineRec: "Correct"   },
"Image10": { humanRec: "Correct",  machineRec: "Correct"   },  
"Image14": { humanRec: "Incorrect",machineRec: "Incorrect" },
"Image20": { humanRec: "Correct",  machineRec: "Correct"   },
"Image21": { humanRec: "Correct",  machineRec: "Incorrect" },
"Image27": { humanRec: "Correct",  machineRec: "Correct"   },
"Image35": { humanRec: "Correct",  machineRec: "Correct"   },
"Image37": { humanRec: "Correct",  machineRec: "Correct"   },
"Image40": { humanRec: "Correct",  machineRec: "Incorrect"   },
"Image44": { humanRec: "Incorrect",machineRec: "Correct"   },
"Image60": { humanRec: "Correct",  machineRec: "Correct"   },
"Image63": { humanRec: "Correct",  machineRec: "Correct"   },
"Image66": { humanRec: "Correct",  machineRec: "Correct"   },
"Image68": { humanRec: "Correct",machineRec: "Correct"   },
"Image77": { humanRec: "Correct",  machineRec: "Correct"   },
"Image51": { humanRec: "Correct",  machineRec: "Correct"   },  
"Image53": { humanRec: "Incorrect",machineRec: "Correct"   }, 
"Image57": { humanRec: "Correct",machineRec: "Incorrect" },
"Image61": { humanRec: "Correct",  machineRec: "Correct"   }
  };
  
const CURATED_BLOCKS = {
    0: [  1,  9, 13, 17, 18, 22, 23, 29, 31, 38,
         42, 43, 47, 52, 55, 65, 67, 70, 78, 80 ],   // “Block 1”
    1: [  4,  6, 12, 15, 16, 19, 28, 32, 34, 36,
         41, 45, 46, 56, 58, 59, 69, 71, 72, 74 ],   // “Block 2”
    2: [  5,  7,  8, 11, 24, 25, 26, 30, 33, 39,
         48, 49, 50, 54, 62, 64, 73, 75, 76, 79 ],   // “Block 3”
    3: [  2,  3, 10, 14, 20, 21, 27, 35, 37, 40,
         44, 51, 53, 57, 60, 61, 63, 66, 68, 77 ]    // “Block 4”
  };


const imageToBlock = {};
  Object.entries(CURATED_BLOCKS).forEach(([bid, arr]) =>
    arr.forEach(n => { imageToBlock[n] = Number(bid); })
  );



// Function to convert ground truth and recommendation correctness to actual recommendation
function getRecommendation(groundTruth, isCorrect) {
  const isTrue = groundTruth.includes("True");
  if (isTrue && isCorrect === "Correct") return "present";
  if (isTrue && isCorrect === "Incorrect") return "absent";
  if (!isTrue && isCorrect === "Correct") return "absent";
  if (!isTrue && isCorrect === "Incorrect") return "present";
  throw new Error(`Invalid inputs: groundTruth=${groundTruth}, isCorrect=${isCorrect}`);
}

// Sample images with recommendations
const images = Array.from({ length: 80 }, (_, i) => {
  const imageNumber = i + 1;
  
  // Determine ground truth based on image number
  let groundTruth = "";
  if (imageNumber >= 1 && imageNumber <= 13) groundTruth = "Difficult, False";
  else if (imageNumber >= 14 && imageNumber <= 26) groundTruth = "Difficult, True";
  else if (imageNumber >= 27 && imageNumber <= 40) groundTruth = "Medium, False";
  else if (imageNumber >= 41 && imageNumber <= 54) groundTruth = "Medium, True";
  else if (imageNumber >= 55 && imageNumber <= 67) groundTruth = "Easy, False";
  else if (imageNumber >= 68 && imageNumber <= 80) groundTruth = "Easy, True";
  
  // Get human and machine recommendation correctness from data
  const imageKey = `Image${imageNumber}`;
  const data = imageData[imageKey];
  let humanRec = "Correct"; // Default to Correct if data is missing
  let machineRec = "Correct"; // Default to Correct if data is missing
  
  if (data) {
    humanRec = data.humanRec;
    machineRec = data.machineRec;
  }
  
  return {
    filename: `image${imageNumber}.png`,
    blockID:  imageToBlock[imageNumber],   // <<< new line
    recommendation: {
      Crowd:  getRecommendation(groundTruth, humanRec),
      AI:     getRecommendation(groundTruth, machineRec)
    }
  };
});



/* -------------------------------------------------
   1. Application Entry and Session Initialization
------------------------------------------------- */

// Get home page (consent form)
router.get('/', (req, res) => {
  res.render('index'); // Renders index.ejs (consent form)
});

// Admin route to toggle skipping assisted rounds for testing
router.get('/admin/toggle-skip-assisted', (req, res) => {
  skipAssistedRoundEnabled = !skipAssistedRoundEnabled;
  res.send(`Skip assisted round feature is now ${skipAssistedRoundEnabled ? 'enabled' : 'disabled'}`);
});

// Handle consent form submission
router.post('/consent', [
  body('consentAgreement').equals('on').withMessage('You must agree to the consent form.'),
  body('notNCSUEmployee').equals('on').withMessage('You must state that you are not an employee of North Carolina State University.')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('index', { error: errors.array().map(e => e.msg).join(' ') });
  }
  res.redirect('/start'); // Redirect to start page on successful consent
});

// Render start page (user ID input form)
router.get('/start', (req, res) => {
  res.render('start');
});

// Update the practice_intro route handler
router.post('/practice_intro', async (req, res) => {
  const userID = generateUniqueUserID();
  try {
    await initializeUserSession(userID);
    res.render('practice_intro', { userID: userID });
  } catch (error) {
    console.error('Session initialization failed:', error);
    res.status(500).send('Error initializing user session');
  }
});

/* -------------------------------------------------
   2. Practice Phase
------------------------------------------------- */

// Start practice questions
router.post('/activity', async (req, res) => {
  const userID = sanitizeHtml(req.body.userID);
  const userSessionData = await fetchUserRecord(userID);
  const firstPracticeQuestion = userSessionData.practiceQuestions[0];
  
  res.render('practice', {
    userID: userID,
    questionNumber: 0,
    questionImage: firstPracticeQuestion.image,
    correctAnswer: firstPracticeQuestion.correctAnswer,
    look: firstPracticeQuestion.look
  });
});

// Handle practice questions progression
router.post('/activity/:userID/practice', async (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  const questionNumber = parseInt(req.body.questionNumber, 10);
  const userAnswer = req.body.selectedAnswer || '';
  const timeTaken = parseInt(req.body.timeTaken, 10);

  // Log the practice response
  logPracticeResponse(userID, questionNumber, userAnswer, timeTaken);
  
  if (hasMorePracticeQuestions(userID, questionNumber)) {
    await renderNextPracticeQuestion(userID, questionNumber, res);
  } else {
    res.redirect(`/activity/${userID}/practice/0/confidence`);
  }
});

// Confidence assessment after practice
router.get('/activity/:userID/practice/0/confidence', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  res.render('confidence', {
    userID: userID,
    nextRoute: `/activity/${userID}/practice/0/confidence/data`,
    isPracticeRound: true
  });
});

// Store practice confidence data and proceed to buffer phase
// Modified practice confidence route
router.post('/activity/:userID/practice/0/confidence/data', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  const confidence = parseInt(req.body.confidence, 10);
  
  if (isNaN(confidence)) {
    return res.status(400).send('Invalid confidence value');
  }
  
  // Store practice confidence using the same approach as assisted rounds
  firestore.collection('confidenceData').add({
    userID: userID,
    phase: 'practice',
    confidence: confidence,
    timestamp: new Date()
  })
  .then(() => res.redirect(`/activity/${userID}/buffer`))
  .catch(error => {
    console.error('Error logging practice confidence:', error);
    res.status(500).send('Error saving confidence data');
  });
});

/* -------------------------------------------------
   3. New Assistance Cycle Implementation
------------------------------------------------- */

// Post handler to start the assistance selection process
router.post('/activity/:userID/buffer/next', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  res.redirect(`/activity/${userID}/select_assistance`);
});

router.get('/activity/:userID/buffer', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  res.render('buffer', { userID: userID });
});

// Display pairwise selection options
router.get('/activity/:userID/select_assistance', async (req, res) => {
  try {
    const userID = sanitizeHtml(req.params.userID);
    console.log(`[select_assistance] user=${userID}`);

    /* ---------- 1. Pull the user session ---------------------------------- */
    const userRecord = await fetchUserRecord(userID);
    if (!userRecord) {
      console.error(`[select_assistance] session not found for ${userID}`);
      return res.status(404).send('User session not found. Please restart the activity.');
    }

    /* ---------- 2. Basic sanity checks ------------------------------------ */
    if (!Array.isArray(userRecord.pairs)) {
      console.error(`[select_assistance] pairs array missing for ${userID}`);
      return res.status(500).send('Session data corrupted. Please contact the administrator.');
    }
    const idx = userRecord.currentIteration;
    if (idx == null || idx >= userRecord.pairs.length) {
      console.error(`[select_assistance] bad iteration idx=${idx} for ${userID}`);
      return res.status(500).send('Session progress error. Please contact the administrator.');
    }

    const currentPair = userRecord.pairs[idx];
    if (!Array.isArray(currentPair.pair) || currentPair.pair.length < 2) {
      console.error(`[select_assistance] invalid pair data at iter ${idx} for ${userID}`, currentPair);
      return res.status(500).send('Configuration error with assistance types. Please contact the administrator.');
    }

    /* ---------- 3. Decide which adviser sits left vs. right --------------- */
    // Acceptable values stored in session: 'left' or 'right'.
    // If it’s missing (legacy data), choose randomly *for display only*.
    const position = (currentPair.position === 'left' || currentPair.position === 'right')
                     ? currentPair.position
                     : (Math.random() < 0.5 ? 'left' : 'right');

    const isLeftPosition = (position === 'left');
    const leftOption  = isLeftPosition ? currentPair.pair[0] : currentPair.pair[1];
    const rightOption = isLeftPosition ? currentPair.pair[1] : currentPair.pair[0];

    console.log(`[select_assistance] iter=${idx}  LEFT=${leftOption.type}_${leftOption.size}  RIGHT=${rightOption.type}_${rightOption.size}`);

    /* ---------- 4. Render the selection page ------------------------------ */
    res.render('select_assistance', {
      userID,
      leftOption,
      rightOption,
      iteration: idx
    });

  } catch (err) {
    console.error('Error in select_assistance route:', err);
    res.status(500).send('An unexpected error occurred. Please try again later.');
  }
});

// Handle assistance selection
router.post('/activity/:userID/select_assistance', async (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  const selectedSide = req.body.selectedOption;          // 'left' or 'right'
  const timeTaken     = parseFloat(req.body.timeTaken) || 0;

  const userRecord  = await fetchUserRecord(userID);
  const currentPair = userRecord.pairs[userRecord.currentIteration];

  const chosen =
      selectedSide === 'left'
      ? (currentPair.position === 'left'  ? currentPair.pair[0] : currentPair.pair[1])
      : (currentPair.position === 'left'  ? currentPair.pair[1] : currentPair.pair[0]);

  /* --- write choice straight back, no deception --- */
  currentPair.selected   = chosen;
  currentPair.completed  = true;
  currentPair.timeTaken  = timeTaken;

  userRecord.currentQuestion = 0;
  await storeUserSession(userID, userRecord);

  res.redirect(`/activity/${userID}/assisted_round/0`);
});


// Display assisted question
router.get('/activity/:userID/assisted_round/:questionIndex', async (req, res) => {
  const userID        = sanitizeHtml(req.params.userID);
  const qIdx          = parseInt(req.params.questionIndex, 10);

  const session       = await fetchUserRecord(userID);
  const pair          = session.pairs[session.currentIteration];

  const blockImgs     = await getImageBlock(userID, session.currentBlock);
  const img           = blockImgs[qIdx];

  const assistance    = pair.selected;  // what the participant chose
  const recommendation = assistance.type === 'human'
        ? img.recommendationCrowd
        : img.recommendationAI;

  res.render('assisted_round', {
    userID,
    iteration: session.currentIteration,
    questionNumber: qIdx + 1,
    questionImage: img.filename,
    recommendation,
    assistanceType:  `${assistance.type} ${assistance.size}`,
    assistanceColor: assistance.color,
    totalQuestions: 20,
    progress: Math.floor((qIdx / 20) * 100),
    skipEnabled: skipAssistedRoundEnabled
  });
});

// Handle skipping the rest of the assisted round (for testing)
router.post('/activity/:userID/skip-assisted-round', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  
  // Only allow skipping if the feature is enabled
  if (!skipAssistedRoundEnabled) {
    return res.status(403).send('Skip feature is not enabled');
  }
  
  console.log(`User ${userID} skipped remaining assisted questions (testing mode)`);
  res.redirect(`/activity/${userID}/assisted_round/${userRecord.currentIteration}/confidence`);
});

// Process assisted question response
router.post('/activity/:userID/assisted_round', async (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  const answer = req.body.selectedAnswer;
  const timeTaken = parseInt(req.body.timeTaken, 10);
  const timeExpired = req.body.timeExpired === 'true';
  const questionImage = req.body.questionImage;
  const recommendation = req.body.recommendation;
  
  let userRecord = await fetchUserRecord(userID);
  
  // Log the response data
  const responseData = {
    userID,
    iteration: userRecord.currentIteration,
    question:  userRecord.currentQuestion,
    answer,
    timeTaken,
    timeExpired,
    image: questionImage,
    recommendation,
    assistanceType: pair.selected.type,
    assistanceSize: pair.selected.size,
    timestamp: new Date()
  };
  
  await logAssistedResponse(userID, responseData);
  
  // Increment question index
  userRecord.currentQuestion++;
  await storeUserSession(userID, userRecord);
  
  // Check if block is complete
  if (userRecord.currentQuestion >= 20) {
    // Move to confidence assessment
    res.redirect(`/activity/${userID}/assisted_round/${userRecord.currentIteration}/confidence`);
  } else {
    // Continue to next question
    res.redirect(`/activity/${userID}/assisted_round/${userRecord.currentQuestion}`);
  }
});

// Confidence assessment after an assisted block
router.get('/activity/:userID/assisted_round/:iteration/confidence', async (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  const iteration = parseInt(req.params.iteration, 10);
  const userRecord = await fetchUserRecord(userID);
  
  // Get the current pair and selected assistance
  const currentPair = userRecord.pairs[iteration];
  const selectedAssistance = currentPair.selected;
  
  // Determine the unselected assistance
  let unselectedAssistance;
  if (currentPair.pair[0].type === selectedAssistance.type && 
      currentPair.pair[0].size === selectedAssistance.size) {
    // If the first option was selected, the unselected is the second
    unselectedAssistance = currentPair.pair[1];
  } else {
    // Otherwise, the unselected is the first
    unselectedAssistance = currentPair.pair[0];
  }
  
  res.render('confidence', {
    userID: userID,
    nextRoute: `/activity/${userID}/assisted_round/${iteration}/confidence/data`,
    isPracticeRound: false,
    chosenAssistance: `${selectedAssistance.type} ${selectedAssistance.size}`,
    unselectedAssistance: `${unselectedAssistance.type} ${unselectedAssistance.size}`
  });
});


// Process confidence data after the assisted block
router.post('/activity/:userID/assisted_round/:iteration/confidence/data', async (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  const iteration = parseInt(req.params.iteration, 10);
  
  // Extract data using the form field names
  const confidenceData = {
    confidence: parseInt(req.body.confidence, 10),
    useRecommendation: parseInt(req.body.useRecommendation, 10),
    reliability: parseInt(req.body.reliability, 10),
    choiceReason: sanitizeHtml(req.body.choiceReason || ''),
    timestamp: new Date(),
    iteration: iteration
  };

  // Validate confidence values
  if (isNaN(confidenceData.confidence) || 
      (confidenceData.useRecommendation !== undefined && isNaN(confidenceData.useRecommendation)) ||
      (confidenceData.reliability !== undefined && isNaN(confidenceData.reliability))) {
    return res.status(400).send('Invalid confidence values');
  }

  try {
    // Use a consistent approach for storing data
    await firestore.collection('confidenceData').add({
      userID: userID,
      phase: 'assisted',
      ...confidenceData
    });
    
    // Update user record
    const userRecord = await fetchUserRecord(userID);
    userRecord.currentIteration++;
    userRecord.currentQuestion = 0;
    
    if (userRecord.currentBlock < 3) {
      userRecord.currentBlock++;
    }
    
    await storeUserSession(userID, userRecord);
    
    if (userRecord.currentIteration < userRecord.pairs.length) {
      res.redirect(`/activity/${userID}/break?nextIteration=${userRecord.currentIteration}`);
    } else {
      res.redirect(`/survey/${userID}`);
    }
  } catch (error) {
    console.error('Confidence data error:', error);
    res.status(500).send('Error saving confidence data');
  }
});

// Break page between blocks
router.get('/activity/:userID/break', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  const nextIteration = parseInt(req.query.nextIteration, 10);
  
  // Render break page with timer
  res.render('break', {
    userID: userID,
    nextIteration: nextIteration,
    breakDuration: 180 // 3 minutes in seconds
  });
});

// Handle break completion
router.post('/activity/:userID/break/next', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  res.redirect(`/activity/${userID}/select_assistance`);
});

/* -------------------------------------------------
   4. Survey and Debrief Phase
------------------------------------------------- */

// Survey page
router.get('/survey/:userID', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  res.render('survey', { userID: userID });
});

// Process survey submission
// Route to submit survey data
router.post(
  '/submitSurvey',
  [
    body('age')
      .notEmpty().withMessage('Age is required')
      .isInt({ min: 0, max: 120 }).withMessage('Age must be a number'),
    body('gender')
      .notEmpty().withMessage('Gender is required')
      .isIn(['Male','Female','Other','Prefer not to answer'])
      .withMessage('Invalid gender selection')
  ],
  async function(req, res, next) {
    // 1) validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).render('survey', {
        userID: req.body.userID,
        error:  errors.array()[0].msg
      });
    }

    // 2) sanitize + assemble
    const userID     = sanitizeHtml(req.body.userID);
    const surveyData = {
      age:    sanitizeHtml(req.body.age),
      gender: sanitizeHtml(req.body.gender)
    };

    console.log(`Received survey data for user: ${userID}`, surveyData);

    try {
      // 3) write to Firestore
      await firestore.collection('surveys').add({
        user: userID,
        data: surveyData
      });

      // 4) redirect on success
      return res.redirect(`/activity/${userID}/debrief`);

    } catch (err) {
      console.error('Error during survey submit:', err);
      return res.status(500).send('Internal Server Error');
    }
  }
);

// Debrief page
router.get('/activity/:userID/debrief', (req, res) => {
  const userID = sanitizeHtml(req.params.userID);
  res.render('debrief', { userID: userID });
});

/* -------------------------------------------------
   5. Core Utility Functions
-------------------------------------------------*/

// Store user session 
async function storeUserSession(userID, sessionData) {
  const firestoreSession = {
    ...sessionData,
    pairs: sessionData.pairs.map(pair => ({
      pairId: pair.pairId,
      pair: pair.pair, // Store full array
      option1: pair.option1,
      option2: pair.option2,
      position: pair.position,
      completed: pair.completed,
      selected: pair.selected,
      timestamp: pair.timestamp
    })),
    blockRefs: sessionData.blockRefs
  };

  await firestore.collection('userSessions').doc(userID).set(firestoreSession);
  userSessions[userID] = sessionData;
}

// Generate a unique user ID
function generateUniqueUserID() {
  return `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// A simple seeded random number generator based on a string seed.
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = seed.charCodeAt(i) + ((h << 5) - h);
  }
  
  return function() {
    // A simple mix to update 'h' and produce a number in [0, 1)
    h = Math.imul(48271, h) & 0xffffffff;
    return (h >>> 0) / 4294967295;
  };
}

// A shuffle function that uses seeded randomness.
function seededShuffle(array, seed) {
  const random = seededRandom(seed);
  const newArray = array.slice(); // Create a copy to avoid modifying the original
  
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  
  return newArray;
}

// Create 4 blocks of 20 images each with seeded randomization
function assignUserImageBlocks(userID) {
  const blocks = [[], [], [], []];           // prepare 4 buckets

  images.forEach(img => {
    const bid = img.blockID;                 // 0-3 from step 2
    if (bid === undefined)
      throw new Error(`Block ID missing for image ${img.filename}`);
    blocks[bid].push(img);
  });

  // Shuffle *within* each curated block (seeded per-user)
  for (let i = 0; i < 4; i++) {
    blocks[i] = seededShuffle(blocks[i], `${userID}-block-${i}`);
  }
  return blocks;                             // [ [20], [20], [20], [20] ]
}



// Initialize user session with all necessary data
async function initializeUserSession(userID) {
  // Shuffle practice questions
  const shuffledPracticeQuestions = seededShuffle([...practiceQuestions], `${userID}-practice`);
  
  // Generate and shuffle pairs for assistance options
  const allPairs = generatePairs();
  const basePairs = generatePairs();
  const shuffledPairs = basePairs
  .map(pair => Math.random() < 0.5 ? [pair[1], pair[0]] : pair) // Randomize left/right
  .sort(() => Math.random() - 0.5); // Shuffle pair order

  // Create image blocks
  const imageBlocks = assignUserImageBlocks(userID);
  
  const newUserSession = {
    user: userID,
    practiceQuestions: shuffledPracticeQuestions,
    currentIteration: 0, // Which pair we're on
    currentBlock: 0, // Which image block we're on
    currentQuestion: 0, // Current question within a block
    pairs: shuffledPairs.map((pair, index) => ({
      pairId: index,
      pair: pair, // Store actual pair objects
      option1: pair[0].type + '_' + pair[0].size,
      option2: pair[1].type + '_' + pair[1].size,
      position: 'random', // No longer needed with direct pair storage
      completed: false,
      selected: null,
      timestamp: new Date()
    })),
    // Store block references instead of nested arrays
    blockRefs: [0, 1, 2, 3]
  };
  
  // Store user session
  userSessions[userID] = newUserSession;
  await storeUserSession(userID, newUserSession);
  
  // Store image blocks separately with block IDs
  for (let i = 0; i < imageBlocks.length; i++) {
    await firestore.collection('userImageBlocks').doc(`${userID}-block-${i}`).set({
      userID: userID,
      blockID: i,
      images: imageBlocks[i].map(img => ({
        filename: img.filename,
        recommendationAI: img.recommendation.AI,
        recommendationCrowd: img.recommendation.Crowd
      }))
    });
  }
  
  return newUserSession;
}


// Fetch the user session record and block data if needed
async function fetchUserRecord(userID) {
  let sessionData = userSessions[userID] || await firestore.collection('userSessions').doc(userID).get()
    .then(doc => doc.exists ? doc.data() : null);

  if (sessionData?.pairs) {
    sessionData.pairs = sessionData.pairs.map(pair => ({
      ...pair,
      pair: pair.pair || [ // Fallback for legacy data
        ASSISTANCE_TYPES[pair.option1.split('_')[0].toUpperCase() + '_' + pair.option1.split('_')[1].toUpperCase()],
        ASSISTANCE_TYPES[pair.option2.split('_')[0].toUpperCase() + '_' + pair.option2.split('_')[1].toUpperCase()]
      ]
    }));
  }
  if (sessionData) {
    userSessions[userID] = sessionData;      // <-- NEW LINE
  }

  return sessionData;
}

// Get image block data
async function getImageBlock(userID, blockID) {
  const blockDoc = await firestore.collection('userImageBlocks')
    .doc(`${userID}-block-${blockID}`).get();
  
  if (!blockDoc.exists) {
    console.error(`Block ${blockID} not found for user ${userID}`);
    return [];
  }
  
  return blockDoc.data().images;
}


// Log practice response
function logPracticeResponse(userID, questionNumber, userAnswer, timeTaken) {
  console.log(`User ${userID} practice Q${questionNumber}: answer=${userAnswer}, time=${timeTaken}ms`);
  
  // Store in Firestore
  return firestore.collection('practiceResponses').add({
    userID: userID,
    questionNumber: questionNumber,
    userAnswer: userAnswer,
    timeTaken: timeTaken,
    timestamp: new Date()
  });
}

// Render the next practice question
async function renderNextPracticeQuestion(userID, questionNumber, res) {
  let session = await fetchUserRecord(userID);
  let nextQuestionIndex = questionNumber + 1;
  
  if (nextQuestionIndex < session.practiceQuestions.length) {
    const question = session.practiceQuestions[nextQuestionIndex];
    res.render('practice', {
      userID: userID,
      questionNumber: nextQuestionIndex,
      questionImage: question.image,
      correctAnswer: question.correctAnswer,
      look: question.look
    });
  } else {
    res.redirect(`/activity/${userID}/practice/0/confidence`);
  }
}

// Check if there are more practice questions
function hasMorePracticeQuestions(userID, questionNumber) {
  let session = userSessions[userID];
  return questionNumber + 1 < session.practiceQuestions.length;
}

// Log confidence data
// Modified logConfidenceData function
async function logConfidenceData(userID, phase, confidenceData, iteration) {
  console.log(`User ${userID} submitted ${phase} phase confidence data`);

  // Create the document data structure
  const docData = {
    userID: userID,
    phase: phase,
    timestamp: new Date()
  };

  // If confidenceData is a simple number, treat it as the confidence value
  if (typeof confidenceData === 'number') {
    docData.confidence = confidenceData;
  } else {
    // Otherwise merge the object
    Object.assign(docData, confidenceData);
  }

  // Only add iteration if it's defined
  if (iteration !== undefined) {
    docData.iteration = iteration;
  }

  return firestore.collection('confidenceData').add(docData);
}

// Log assisted response
async function logAssistedResponse(userID, responseData) {
  console.log(`User ${userID} assisted answer: ${responseData.answer}, time=${responseData.timeTaken}ms`);
  
  // Store in Firestore
  return firestore.collection('assistedResponses').add(responseData);
}

// Log survey data
function logSurveyData(userID, surveyData) {
  console.log(`Survey data for user ${userID}:`, surveyData);
  
  // Store in Firestore
  return firestore.collection('surveyResponses').add({
    userID: userID,
    surveyData: surveyData,
    timestamp: new Date()
  });
}

/* -------------------------------------------------
   Mount router & start server
-------------------------------------------------*/

// Add this at the end of the file before exporting
router.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('An unexpected error occurred');
});

module.exports = router; // Export the router
