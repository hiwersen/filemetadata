require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage;

const app = express();

const port = process.env.PORT || 3000;
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fileMetadata';
module.exports = dbUri;

app.use(cors());

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, });
const connection = mongoose.connection;

connection.on('error', console.error.bind(console, 'connection error:'));

let gfs;
connection.once('open', () => {
  gfs = Grid(connection.db, mongoose.mongo);
  gfs.collection('uploads');
});

app.use('/public', express.static(__dirname + '/public'));

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

