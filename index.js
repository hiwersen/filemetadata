require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

/**
 * Import Multer.
 * 
 * Multer is a middleware that adds a body object and a file or files object to the request object.
 * The body object contains the values of the text fields of the form
 * while the file or files object contains the file(s) uploaded via the form.
 * 
 * @see {@link https://github.com/expressjs/multer#usage}
 */
const multer = require('multer');

/**
 * Import Multer GridFS Storage.
 * 
 * Multer GridFS Storage is a GridFS storage engine for Multer to store uploaded files directly to MongoDb.
 * GridFS is a specification in MongoDB for storing and retrieving large files  such as images, audio files, video files, etc. 
 * This means that GridFsStorage allows Multer to save uploaded files directly in MongoDB in a way that's efficient for large files.
 * 
 * @see {@link https://www.npmjs.com/package/multer-gridfs-storage?activeTab=readme}
 */
const { GridFsStorage } = require('multer-gridfs-storage');

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

// Log the database name to the console, upon 'open' event.
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

// Instanciate Multer GridFS Storage engine object and set its options.
const storage = new GridFsStorage({
  url: dbUri,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: 'uploads',
    };
  },
});

// Instanciate Multer object with the specified storage configuration.
const upload = multer({ storage });

/**
 * Security feature:
 * 
 * Create a list of allowed MIME types
 */
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'audio/mpeg',  // For MP3 audio files
  'video/mp4'    // For MP4 video files
];

app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  // req.file.originalname = Name of the file on the user's computer VS 
  // req.file.filename = The name of the file as stored on the server
  // @see {@link https://github.com/expressjs/multer#file-information}
  const { originalname: name, mimetype: type, size } = req.file;

  // Check if the file's MIME type is in the allow-list
  if (!allowedMimeTypes.includes(type)) {
    return res.status(400).send('Invalid file type');
  }

  // Send a JSON object with the file name, type and size in bytes metadata
  res.json({ name, type, size });
});

/**
 * Start the server and log the listening port
 */
const listener = app.listen(port, function () {
  console.log('Listening on port ' + port)
});

