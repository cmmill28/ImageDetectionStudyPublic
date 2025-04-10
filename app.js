require('dotenv').config();
const createError = require('http-errors');
const { Firestore } = require('@google-cloud/firestore');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const indexRouter = require('./routes/index');

const app = express();

// Firestore setup with absolute path for AWS environment
const firestore = new Firestore({
  projectId: 'bubbly-journey-283623',
  keyFilename: path.join(__dirname, 'bubbly-journey-283623-e4d4d7c69cea.json')
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.body);
  next();
});

// Better error handling for Firestore connection test
firestore
  .collection('testCollection')
  .doc('testDoc')
  .set({ testField: 'testValue' })
  .then(() => console.log('Firestore connected and test data written'))
  .catch(err => {
    console.error('Firestore connection error:', err);
    // Continue running app even if connection fails
  });

// Add health check endpoint for AWS load balancer health checks
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// Log each request to help with debugging
app.use((req, res, next) => {
  console.log(`Request URL: ${req.originalUrl}`);
  next();
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log('404 error handler');
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.error('Error handler', err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Add graceful shutdown for AWS environments
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
