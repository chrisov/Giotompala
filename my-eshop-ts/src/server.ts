import 'dotenv/config';
import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import os from 'os';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Προσοχή: Εδώ ορίζουμε την PORT. Στο Render θα οριστεί από το περιβάλλον.
// Καλό είναι να χρησιμοποιείτε process.env.PORT || 10000 (ή όποια θύρα θέλετε).
const PORT: number = parseInt(process.env.PORT || '10000', 10); 

// === Ρυθμίσεις Βάσης Δεδομένων ===
// Αλλάζουμε το αρχείο της βάσης δεδομένων σε purchases.db
const DB_FILE = path.join(__dirname, 'purchases.db');
let db: any;

async function initializeDatabase() {
    try {
        db = await open({
            filename: DB_FILE,
            driver: sqlite3.Database
        });

        // Δημιουργία πίνακα 'transactions' αν δεν υπάρχει
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                walletAddress TEXT NOT NULL,
                product TEXT NOT NULL,
                amount REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Νέο μήνυμα για επιβεβαίωση της σωστής βάσης/πίνακα
        console.log('Database initialized and "transactions" table ensured.');

    } catch (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }
}

// Κλήση αρχικοποίησης της βάσης δεδομένων
initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// === HTTP ROUTES ===
// Εξυπηρέτηση στατικών αρχείων (index.html, CSS, JS)
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Δεν χρειάζεται πλέον το /game.html, ούτε η λογική token/activeTokens
// Το eshop είναι πλέον στο index.html.

// === WEBSOCKET LOGIC ===
wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected via WebSocket');

    ws.on('message', (message: string) => {
        console.log('Message from client:', message);
        ws.send(`Server received: ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// === Server Listen ===
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
    console.log(`For more users in the LAN, try http://${getIpAddress()}:${PORT}`);
    // Νέο μήνυμα για την Eshop σελίδα
    console.log(`Eshop Backend Live: http://localhost:${PORT}/`); 
    // Οι παλιές γραμμές για Login/Game page έχουν διαγραφεί.
    // Η λογική activeTokens έχει αφαιρεθεί αφού δεν χρησιμοποιείται για logins
});

// === Βοηθητική συνάρτηση για IP Address ===
function getIpAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        if (iface) {
            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }
    return '127.0.0.1'; // Fallback σε localhost αν δεν βρεθεί IP LAN
}