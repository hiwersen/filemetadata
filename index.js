/**
 * This file sets up an Express.js server that handles file uploads and provides file metadata.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();

const port = process.env.PORT || 3000;

/**
 * Enable CORS (Cross-origin resource sharing) middleware
 * so that the API is remotely testable by FreeCodeCamp.
 * @see {@link https://www.npmjs.com/package/cors}
 */
app.use(cors());

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

/**
 * Instanciate Multer object and set its storage and limits options
 * 
 * Multer is a middleware that adds a body object and a file or files object to the request object.
 * The body object contains the values of the text fields of the form
 * while the file or files object contains the file(s) uploaded via the form.
 * 
 * @see {@link https://github.com/expressjs/multer#multer---}
 */
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // limit file size to 1MB
  },
});

/**
 * Use dynamic import (ECMAScript 2020 syntax) to import the 'file-type' module asynchronously in a CommonJS environment.
 * 
 * The file-type module is for detecting binary-based file extension and MIME type based on its actual content.
 * After importing the module, retrieve fileTypeFromBuffer function and pass it to the onFulfilled callback.
 * 
 * @see {@link https://www.npmjs.com/package/file-type?activeTab=readme}
 */
import('file-type').then(({fileTypeFromBuffer}) => {

  // Add an error check to make sure the fileTypeFromBuffer function is available in the 'file-type' module
  if (typeof fileTypeFromBuffer === 'undefined') {
    console.error('fileTypeFromBuffer function is not available');
    process.exit(1);
  }

/**
 * @api {post} /api/fileanalyse Upload and analyze file
 * 
 * @apiParam (Request body) {File} upfile File to upload
 *
 * @apiSuccess {String} name Original file name
 * @apiSuccess {String} type MIME type
 * @apiSuccess {Number} size Size in bytes
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "My Favorite Song.mp3",
 *       "type": "audio/mpeg",
 *       "size": 497092
 *     }
 * 
 * @apiError {String} Error message
 *
 * @apiErrorExample {String} InvalidFileType:
 *     HTTP/1.1 400 Bad Request
 *     Invalid file type
 * 
 * @apiError {String} Error message
 * 
 * @apiErrorExample {String} MismatchedMimeType:
 *     HTTP/1.1 400 Bad Request
 *     File content does not match MIME type
 * 
 * @apiError {String} Error message
 * 
 * @apiErrorExample {String} UnknownFileType:
 *     HTTP/1.1 400 Bad Request
 *     Unable to determine the file type from the content
 */
  app.post('/api/fileanalyse', upload.single('upfile'), async (req, res) => {
    // Extract name, type, size and buffer data from the uploaded file
    // @see {@link https://github.com/expressjs/multer#file-information}
    const { originalname: name, mimetype: type, size, buffer } = req.file;

    // Define a list of allowed MIME types to create a first layer of security following the deny by default principle
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
      'audio/mpeg',
      'video/mp4'
    ];
  
    // If the file's MIME type is not in the allow-list, return an error message and end the request-response cycle for security purposes
    if (!allowedMimeTypes.includes(type)) {
      return res.status(400).send('Invalid file type');
    } else {
  
      // Attempt to detect the file type from the file data buffer
      const fileTypeResult = await fileTypeFromBuffer(buffer);

      
      if (fileTypeResult) {
        const { mime: mimeTypeFromBuffer} = fileTypeResult;

        // Return error message if the detected MIME type does not match the file's claimed MIME type
        if (!mimeTypeFromBuffer || mimeTypeFromBuffer !== type) {
          return res.status(400).send('File content does not match MIME type');
        } else {
    
        // If all checks pass, respond with file metadata in JSON format
        res.json({ name, type, size });
        }
      } else {

        // Return error message, if fileTypeFromBuffer could not determine the file type
        return res.status(400).send('Unable to determine the file type from the content');
      }
    }
  });

  /**
   * Define a general error handling middleware after the routes to catch any errors coming from them
   */
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      // Handle Multer errors specifically
      return res.status(400).json({ error: err.message });
    } else {
      // Handle all other types of errors
      return res.status(500).json({ error: 'An unknown error occurred while uploading the file.' });
    }
  });
  
  /**
   * Start the server and log the listening port only after file-type import is executed
   */
  const listener = app.listen(port, () => {
    console.log('Listening on port ' + port)
  });
  
// Handle error on importing file-type
}).catch(err => {
  console.error(`Error loading file-type: ${err}`);
  process.exit(1);
});