const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');

router.post('/upload', UploadController.getInstance().upload);

module.exports = router;