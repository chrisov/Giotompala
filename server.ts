import 'dotenv/config';
import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import sqlite3 from 'sqlite3'; // Import sqlite3
import { open } from 'sqlite'; // Import open για async/await

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT: number = parseInt(process.env.PORT || '3000', 10);

const activeTokens = new Map<string, { id: string, role: string }>();

// === Ρυθμίσεις Βάσης Δεδομένων ===
const DB_FILE = path.join(__dirname, 'users.db'); // Το αρχείο της βάσης δεδομένων
let db: any; // Μεταβλητή για την σύνδεση της βάσης δεδομένων

async function initializeDatabase() {
    db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    // Δημιουργία πίνακα χρηστών αν δεν υπάρχει
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            password TEXT -- Σε πραγματική εφαρμογή θα αποθηκεύαμε hashed passwords
        );
    `);
    console.log('Database initialized and "users" table ensured.');

}

// === Κλήση αρχικοποίησης της βάσης δεδομένων ===
// Πριν ξεκινήσει ο server, ας αρχικοποιήσουμε τη βάση δεδομένων
initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1); // Έξοδος αν αποτύχει η βάση δεδομένων
});


// === HTTP ROUTES ===
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/game.html', (req, res) => {
    const token = req.query.token as string;

    if (token && activeTokens.has(token)) {
        console.log(`User with token ${token} accessing game.html`);
        res.sendFile(path.join(__dirname, 'game.html'));
    } else {
        console.warn(`Unauthorized access attempt to game.html. Token: ${token}`);
        res.status(401).send('Unauthorized. Please log in first.');
        // res.redirect('/'); // Μπορείτε να κάνετε και ανακατεύθυνση
    }
});

// === WEBSOCKET LOGIC ===
wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected via WebSocket');

    // Προαιρετικά: Αν ο client στείλει το token του αμέσως μετά την σύνδεση WebSocket
    // Μπορείτε να το βάλετε σε ένα αρχικό μήνυμα 'authenticate_token'
    // Αν και ο server έχει ήδη επαληθεύσει την πρόσβαση στο game.html, αυτή η επιβεβαίωση
    // είναι χρήσιμη για να συσχετίσουμε την WebSocket σύνδεση με έναν χρήστη
    ws.on('message', async (message: string) => { // Έγινε async για χρήση await
        const messageString = message.toString();
        // console.log(`Received: ${messageString}`);

        let parsedMessage: any;
        try {
            parsedMessage = JSON.parse(messageString);
        } catch (e) {
            console.error('Failed to parse message as JSON:', messageString, e);
            ws.send(JSON.stringify({ status: 'error', message: 'Το μήνυμα δεν είναι έγκυρο JSON.' }));
            return;
        }

        if (parsedMessage.type === 'login') {
            const { role, id } = parsedMessage;

            console.log(`Login attempt: Role - ${role}, ID - ${id}`);

            // ΕΔΩ Η ΚΛΗΣΗ ΣΤΗ ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ
            const isValidUser = await checkUserInDatabase(id, role);

            if (isValidUser) {
                const newToken = crypto.randomBytes(16).toString('hex');
                activeTokens.set(newToken, { id, role });

                (ws as any).authToken = newToken;
                (ws as any).userId = id;
                (ws as any).userRole = role;

                ws.send(JSON.stringify({
                    status: 'success',
                    message: `You connected successfully as ${role} με ID: ${id}.`,
                    token: newToken,
                    redirect: '/game.html'
                }));
                console.log(`User ${id} (${role}) logged in with token: ${newToken}`);

            } else {
                ws.send(JSON.stringify({ status: 'error', message: `Ο χρήστης ${id} δεν βρέθηκε ή δεν έχει πρόσβαση ως ${role}.` }));
                console.log(`Failed login attempt for ${id} (${role}).`);
            }
        }else if (parsedMessage.type === 'authenticate_token') {
            const token = parsedMessage.token;
            if (token && activeTokens.has(token)) {
                // Το token υπάρχει ήδη στο activeTokens, όλα καλά
                const userInfo = activeTokens.get(token)!;
                (ws as any).authToken = token;
                (ws as any).userId = userInfo.id;
                (ws as any).userRole = userInfo.role;
                ws.send(JSON.stringify({
                    type: 'auth_success',
                    message: `Authentication succesfull for ${userInfo.id} ως ${userInfo.role}.`,
                    id: userInfo.id,
                    role: userInfo.role
                }));
                console.log(`WebSocket authenticated for user ${userInfo.id} with token ${token}.`);
            } else {
                // Εάν το token δεν βρεθεί στο activeTokens (π.χ., ο server επανεκκινήθηκε)
                // Πρέπει να ανακτήσουμε τα user info από το token (αν είναι JWT)
                // Ή, για την απλότητα τώρα, να επαναφέρουμε το activeTokens.
                // Επειδή το token είναι απλά ένα random string, δεν μπορούμε να το αποκωδικοποιήσουμε.
                // Αυτό σημαίνει ότι ο χρήστης πρέπει να επανασυνδεθεί ΑΝ ο server έχει κάνει επανεκκίνηση.

                // Εδώ είναι το σημείο που θα χρειαζόσουν JWTs για πιο στιβαρή λύση.
                // Προς το παρόν, θα κάνουμε απλά το redirect.

                ws.send(JSON.stringify({
                    type: 'auth_failed',
                    message: 'Authentication failed, please try again',
                    redirect: '/' // Προσθήκη redirect για το frontend
                }));
                console.warn(`WebSocket authentication failed for token: ${token}. Clearing token from URL.`);
                // ΣΗΜΑΝΤΙΚΟ: Το frontend πρέπει να χειριστεί αυτό το redirect.
                // Θα σου δείξω πώς να το κάνεις και στο game.html.
            }
        }
        else if (parsedMessage.type === 'game_action') {
            const userToken = (ws as any).authToken; // Ανακτήστε το token από την WebSocket
            if (userToken && activeTokens.has(userToken)) {
                const userInfo = activeTokens.get(userToken)!; // '!' επειδή το activeTokens.has() εγγυάται ότι υπάρχει

                console.log(`Game action from ${userInfo.id} (${userInfo.role}): ${parsedMessage.action}`);

                // Εδώ η λογική του παιχνιδιού: roll_dice, place_bet, κλπ.
                // Ελέγξτε τον ρόλο για να επιτρέψετε συγκεκριμένες ενέργειες
                if (userInfo.role === 'player' && parsedMessage.action === 'roll_dice') {
                    const diceRoll = Math.floor(Math.random() * 6) + 1;
                    wss.clients.forEach(client => { // Στείλτε το αποτέλεσμα σε όλους
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'game_update',
                                action: 'dice_rolled',
                                user: userInfo.id,
                                role: userInfo.role,
                                result: diceRoll,
                                message: `${userInfo.id} rolled a ${diceRoll}!`
                            }));
                        }
                    });
                } else if (userInfo.role === 'bettor' && parsedMessage.action === 'place_bet') {
                    // Λογική για το ποντάρισμα
                    ws.send(JSON.stringify({ status: 'info', message: `Betting logic for ${userInfo.id} is not yet implemented.` }));
                } else {
                    ws.send(JSON.stringify({ status: 'error', message: 'Μη έγκυρη ενέργεια για τον ρόλο σας.' }));
                }

            } else {
                ws.send(JSON.stringify({ status: 'error', message: 'Δεν είστε συνδεδεμένος για ενέργειες παιχνιδιού.' }));
                // Αν δεν υπάρχει token ή δεν είναι έγκυρο, ανακατεύθυνση ή κλείσιμο σύνδεσης
                ws.close();
            }
        }
        else {
            console.log(`Unhandled message type: ${parsedMessage.type || 'unknown'}`);
            ws.send(JSON.stringify({ status: 'error', message: 'Δεν αναγνωρίζω τον τύπο του μηνύματος.' }));
        }
    });

    ws.on('close', () => {
            const closedToken = (ws as any).authToken;
            if (closedToken && activeTokens.has(closedToken)) {
                // console.log(`Client disconnected. Token ${closedToken} NOT removed from activeTokens.`); // Μπορείς να το βάλεις για debug
                console.log(`Client disconnected. User with token ${closedToken} was logged in.`);
            } else {
                console.log('Client disconnected (no associated active token found for this specific WS connection).');
            }
        });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });
});


// === ΕΛΕΓΧΟΣ ΒΑΣΗΣ ΔΕΔΟΜΕΝΩΝ (SQLite) ===
async function checkUserInDatabase(id: string, role: string): Promise<boolean> {
    try {
        // Εδώ υποθέτουμε ότι ο χρήστης έχει βάλει και password.
        // Για την ώρα, δεν το ελέγχουμε, αλλά θα έπρεπε να το κάνεις
        // και να το περνάς και από το frontend.
        const user = await db.get(
            `SELECT id, role FROM users WHERE id = ? AND role = ?`,
            id, role
        );
        return !!user; // Επιστρέφει true αν βρεθεί χρήστης, false αλλιώς
    } catch (e) {
        console.error('Database query error:', e);
        return false;
    }
}

// ... (υπόλοιπος κώδικας server.listen και getIpAddress)
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
    console.log(`For more users in the LAN, try http://${getIpAddress()}:${PORT}`);
    console.log(`Login page: http://localhost:${PORT}/`);
    console.log(`Game page (needs token): http://localhost:${PORT}/game.html?token=YOUR_TOKEN`);
});

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
    return 'Wrong IP';
}
