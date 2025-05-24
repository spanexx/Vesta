import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../backups');
const RETENTION_DAYS = process.env.BACKUP_RETENTION_DAYS || 30;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const backup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Extract credentials from MongoDB URI
    const uri = new URL(config.mongoUri);
    const username = decodeURIComponent(uri.username);
    const password = decodeURIComponent(uri.password);
    const host = uri.host;
    const database = uri.pathname.slice(1);

    const mongodump = spawn('mongodump', [
        `--uri=mongodb+srv://${username}:${password}@${host}/${database}`,
        '--gzip',
        `--archive=${filepath}`
    ]);

    return new Promise((resolve, reject) => {
        mongodump.stdout.on('data', (data) => {
            console.log(`mongodump: ${data}`);
        });

        mongodump.stderr.on('data', (data) => {
            console.error(`mongodump error: ${data}`);
        });

        mongodump.on('close', (code) => {
            if (code === 0) {
                console.log(`Backup completed: ${filename}`);
                resolve(filepath);
            } else {
                reject(new Error(`mongodump exited with code ${code}`));
            }
        });
    });
};

const cleanOldBackups = () => {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = new Date();

    files.forEach(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);

        if (daysOld > RETENTION_DAYS) {
            fs.unlinkSync(filePath);
            console.log(`Deleted old backup: ${file}`);
        }
    });
};

// Run backup
backup()
    .then(() => {
        cleanOldBackups();
        console.log('Backup process completed successfully');
    })
    .catch(error => {
        console.error('Backup failed:', error);
        process.exit(1);
    });