import 'dotenv/config';
import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import os from 'os';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import cors from 'cors'; // Πρόσθεσε αυτή τη γραμμή για CORS

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Πρόσθεσε CORS για να επιτρέψεις στο React frontend να επικοινωνεί κατά το development
// Όταν το frontend και το backend είναι σε διαφορετικά ports, το CORS είναι απαραίτητο.
// Για production, μπορείς να το κάνεις πιο αυστηρό ή να το αφαιρέσεις αν εξυπηρετούνται από τον ίδιο server.
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:5173', // Επιτρέψουμε το Vite dev server
    methods: ['GET', 'POST'],
    credentials: true,
}));

const PORT: number = parseInt(process.env.PORT || '10000', 10);

// === Ρυθμίσεις Βάσης Δεδομένων ===
// Αυτή η διαδρομή είναι σωστή για τη δομή σου
const DB_FILE = path.join(__dirname, '..', 'purchases.db');
let db: any;

async function initializeDatabase() {
    try {
        db = await open({
            filename: DB_FILE,
            driver: sqlite3.Database
        });
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                walletAddress TEXT NOT NULL,
                product TEXT NOT NULL,
                amount REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database initialized and "transactions" table ensured.');
    } catch (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }
}

initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// === WEBSOCKET LOGIC ===
// (Ο κώδικας του WebSocket παραμένει ίδιος - είναι μια χαρά)
wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected via WebSocket');

    ws.on('message', async (message: string) => {
        const messageString = message.toString();
        let parsedMessage: any;

        try {
            parsedMessage = JSON.parse(messageString);
        } catch (e) {
            console.error('Failed to parse message as JSON:', messageString, e);
            ws.send(JSON.stringify({ status: 'error', message: 'Το μήνυμα δεν είναι έγκυρο JSON.' }));
            return;
        }

        if (parsedMessage.type === 'record_purchase') {
            const { walletAddress, product, amount } = parsedMessage;

            // Σημείωση: Η συνθήκη !amount θα ήταν true αν το amount ήταν 0.
            // Αν το 0 είναι έγκυρη τιμή, θα πρέπει να ελέγξεις αν είναι undefined ή null.
            if (!walletAddress || !product || amount === undefined || amount === null) {
                ws.send(JSON.stringify({ status: 'error', message: 'Λείπουν δεδομένα για την αγορά (walletAddress, product, ή amount).' }));
                return;
            }

            try {
                await db.run(
                    `INSERT INTO transactions (walletAddress, product, amount) VALUES (?, ?, ?)`,
                    walletAddress, product, amount
                );
                console.log(`Purchase recorded: Wallet: ${walletAddress}, Product: ${product}, Amount: ${amount}`);
                ws.send(JSON.stringify({ status: 'success', message: 'Η αγορά καταγράφηκε επιτυχώς!' }));
            } catch (e) {
                console.error('Error recording purchase:', e);
                ws.send(JSON.stringify({ status: 'error', message: 'Αποτυχία καταγραφής αγοράς.' }));
            }
        } else {
            console.log(`Unhandled message type: ${parsedMessage.type || 'unknown'}`);
            ws.send(JSON.stringify({ status: 'error', message: 'Δεν αναγνωρίζω τον τύπο του μηνύματος.' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected from WebSocket.');
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });
});

// === Server Listen ===
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
    console.log(`For more users in the LAN, try http://${getIpAddress()}:${PORT}`);
    console.log(`Eshop Backend Live: http://localhost:${PORT}/`);
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
    return '127.0.0.1';
}