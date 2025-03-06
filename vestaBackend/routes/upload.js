import express from 'express';
const router = express.Router();
import multer from 'multer';

import { GridFsStorage } from 'multer-gridfs-storage';
import crypto from 'crypto';
import path from 'path';
import mongoose from 'mongoose';
import Grid from 'gridfs-stream';

let gfs;
// Initialize GridFS stream
const initGridFS = () => {
    mongoose.connection.once('open', () => {
        gfs = Grid(mongoose.connection.db, mongoose.mongo);
        gfs.collection('uploads');
        console.log('GridFS initialized');
    });
};

initGridFS();

const storage = new GridFsStorage({
    url: process.env.MONGODB_URI || 'mongodb+srv://girlfriendExp:cc58uyAWEgVu7KT6@girlfriendexp.7qu5l.mongodb.net/Vesta?retryWrites=true&w=majority&appName=girlfriendExp',
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                    metadata: {
                        originalName: file.originalname,
                        uploadedBy: req.user ? req.user._id : null
                    }
                };
                resolve(fileInfo);
            });
        });
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|mov/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed!'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max file size
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileData = {
            id: req.file._id,
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadDate: req.file.uploadDate
        };

        res.status(200).json({
            success: true,
            file: fileData,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: error.message
        });
    }
});

router.post('/uploads', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const filesData = req.files.map(file => ({
            id: file._id,
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadDate: file.uploadDate
        }));

        res.status(200).json({
            success: true,
            files: filesData,
            message: `${filesData.length} files uploaded successfully`
        });
    } catch (error) {
        console.error('Multi-upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading files',
            error: error.message
        });
    }
});

// Add route to retrieve files
router.get('/files/:filename', async (req, res) => {
    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    } catch (error) {
        console.error('File retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving file',
            error: error.message
        });
    }
});

export default router;
