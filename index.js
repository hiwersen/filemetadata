require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

// Instanciate Multer object with the specified storage limits options
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // limit file size to 1MB
  },
});

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

/**
 * Dynamically import file-type.
 * 
 * The file-type package is for detecting binary-based file formats, not text-based formats like .txt, .csv, .svg, etc.
 * 
 * @see {@link https://www.npmjs.com/package/file-type}
 */
import('file-type').then(fileTypeModule => {

  app.post('/api/fileanalyse', upload.single('upfile'), async (req, res) => {
    // req.file.originalname = Name of the file on the user's computer VS 
    // req.file.filename = The name of the file as stored on the server
    // @see {@link https://github.com/expressjs/multer#file-information}
    const { originalname: name, mimetype: type, size, buffer } = req.file;
  
    // Check if the file's MIME type is in the allow-list
    if (!allowedMimeTypes.includes(type)) {
      return res.status(400).send('Invalid file type');
    } else {

  
      // Determine the file type from a Buffer (file's actual content)
      ({ fileTypeFromBuffer } = fileTypeModule);
      const fileTypeResult = await fileTypeFromBuffer(buffer);

      if (fileTypeResult) {
        console.log("fileTypeFromBuffer worked: ");
        console.log(fileTypeResult);
        console.log("file tipe claimed: " + type);

        const { mime: mimeTypeFromBuffer} = fileTypeResult;
        if (!mimeTypeFromBuffer || mimeTypeFromBuffer !== type) {
          return res.status(400).send('File content does not match MIME type');
        } else {
    
        // Send a JSON object with the file name, type and size in bytes metadata
        res.json({ name, type, size });
        }
      } else {
        return res.status(400).send('Unable to determine file type from content');
      }
    }
  });

  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      // Special case for handling Multer errors
      console.log('multer error');
      return res.status(400).json({ error: err.message });
    } else {
      // Default case for handling other types of errors
      return res.status(500).json({ error: 'An unknown error occurred while uploading the file.' });
    }
  });
  
  /**
   * Start the server and log the listening port
   */
  const listener = app.listen(port, () => {
    console.log('Listening on port ' + port)
  });

}).catch(err => {
  console.error('Error loading dependencies:' + err);
  process.exit(1);
});


