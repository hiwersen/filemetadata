require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

/**
 * Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files
 * Multer will not process any form which is not multipart (multipart/form-data)
 * <form enctype="multipart/form-data" method="POST" action="/api/fileanalyse">
 * 
 * @see {@link https://github.com/expressjs/multer#multer---}+
 * 
 * Configure the diskStorage engine as the storage option to be passsed to Multer
 * There are two options available, destination and filename
 * They are both functions that determine where the file should be stored 
 * Each function gets passed both the request (req) and some information about the file (file) to aid with the decision
 * 
 * see {@link https://github.com/expressjs/multer#diskstorage}+
 */
const storage = multer.diskStorage({

  //destination is used to determine within which folder the uploaded files should be stored
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },

  //filename is used to determine what the file should be named inside the folder
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
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