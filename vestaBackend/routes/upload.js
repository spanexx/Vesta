import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import { promisify } from 'util';
import { createReadStream, unlink } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const unlinkAsync = promisify(unlink);

const router = express.Router();
const randomBytes = promisify(crypto.randomBytes);

let bucket;
mongoose.connection.once('open', () => {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
    console.log('GridFS bucket initialized');
});

// Setup temporary disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: async function (req, file, cb) {
        try {
            const buf = await randomBytes(16);
            const filename = `${Date.now()}-${buf.toString('hex')}${path.extname(file.originalname)}`;
            cb(null, filename);
        } catch (err) {
            cb(err);
        }
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
        fileSize: 100 * 1024 * 1024, // 100MB max file size
        files: 1
    }
}).single('file');

router.post('/upload', (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(500).json({
                success: false,
                message: `Server error: ${err.message}`
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Return success with file info
            res.status(200).json({
                success: true,
                file: {
                    filename: req.file.filename,
                    url: `/files/${req.file.filename}`,
                    mimetype: req.file.mimetype,
                    originalname: req.file.originalname
                },
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
});

router.get('/files/:filename', async (req, res) => {
    try {
        const files = await bucket.find({ filename: req.params.filename }).toArray();
        const file = files[0];

        if (!file) {
            return res.status(404).json({ 
                success: false, 
                message: 'File not found' 
            });
        }

        // Handle range requests for video streaming
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
            const chunksize = (end - start) + 1;
            const downloadStream = bucket.openDownloadStreamByName(file.filename, {
                start,
                end: end + 1
            });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${file.length}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': file.metadata.mimetype
            });

            downloadStream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': file.length,
                'Content-Type': file.metadata.mimetype,
                'Content-Disposition': `inline; filename="${file.metadata.originalname}"`,
                'Accept-Ranges': 'bytes',
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'Access-Control-Allow-Origin': '*'
            });

            const downloadStream = bucket.openDownloadStreamByName(file.filename);
            downloadStream.pipe(res);
        }
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
