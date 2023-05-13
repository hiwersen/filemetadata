require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage;

const app = express();

const port = process.env.PORT || 3000;
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fileMetadata';
module.exports = dbUri;

/**
 * Enable CORS (Cross-origin resource sharing) middleware
 * so that the API is remotely testable by FreeCodeCamp.
 * @see {@link https://www.npmjs.com/package/cors}
 */
app.use(cors());

// Establish a connection to the MongoDB database using Mongoose with specified options,
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, });

// Retrieve the instance of the active MongoDB connection managed by Mongoose.
const connection = mongoose.connection;

// Log the connection error to the console, upon 'error' event.
connection.on('error', console.error.bind(console, 'connection error:'));

// Log the connection name to the console, upon 'open' event.
connection.once('open', () => {
  console.log(`Connected to database: ${connection.name}`); // also: connection.db.databaseName
});

/**
 * Serve static files (CSS, JavaScript, images) from the 'public' directory
 */
app.use('/public', express.static(__dirname + '/public'));

/**
 * Handle the root route and serve the index.html file
 */
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

const storage = new GridFsStorage({
  url: dbUri,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: 'uploads',
    };
  },
});

// Create a multer instance with the specified storage configuration
const upload = multer({ storage });

/**
 * Multer middleware adds a body object and a file or files object to the request object
 * The body object contains the values of the text fields of the form
 * The file or files object contains the file(s) uploaded via the form
 * 
 * @see {@link https://github.com/expressjs/multer#usage}
 */
app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  // req.file.originalname = Name of the file on the user's computer VS 
  // req.file.filename = The name of the file as stored on the server
  // @see {@link https://github.com/expressjs/multer#file-information}
  const { originalname: name, mimetype: type, size } = req.file;

  // Send a JSON object with the file name, type and size in bytes metadata
  res.json({ name, type, size });
});

/**
 * Start the server and log the listening port
 */
const listener = app.listen(port, function () {
  console.log('Listening on port ' + port)
});

