require('dotenv').config();
const createError = require('http-errors');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const indexRouter = require('./routes/index');

const app = express();

// Verify that environment variables are loaded correctly
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Connect to MongoDB using Mongoose
const mongoDB = process.env.MONGODB_URI;
if (!mongoDB) {
  console.error('MongoDB URI is not set. Please check your environment variables.');
  process.exit(1);
}

mongoose.set('debug', true); // Enable Mongoose debugging

mongoose.connect(mongoDB, { tls: true, tlsInsecure: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

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
app.use(function(req, res, next) {
  console.log('404 error handler');
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.error('Error handler', err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error'); // Make sure 'error' matches your error view file name
});

module.exports = app;
