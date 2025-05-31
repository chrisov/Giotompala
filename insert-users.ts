import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const DB_FILE = path.join(__dirname, 'users.db'); // Το αρχείο της βάσης δεδομένων

async function insertUsers() {
    let db: any;
    try {
        db = await open({
            filename: DB_FILE,
            driver: sqlite3.Database
        });

        console.log(`Connected to database: ${DB_FILE}`);

        // Δημιουργία πίνακα χρηστών αν δεν υπάρχει
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                password TEXT
            );
        `);
        console.log('Table "users" ensured.');

        // Δεδομένα χρηστών
        const usersToInsert = [
            { id: 'player1', role: 'player', password: 'pass1' },
            { id: 'player2', role: 'player', password: 'pass2' },
            { id: 'player3', role: 'player', password: 'pass3' },
            { id: 'bettorA', role: 'bettor', password: 'ΑA1' },
            { id: 'bettorB', role: 'bettor', password: 'BB2' },
            { id: 'bettorC', role: 'bettor', password: 'CC3' }
        ];

        // Εισαγωγή χρηστών (χρησιμοποιώντας INSERT OR REPLACE για να αντικαταστήσει αν υπάρχουν)
        // Ή INSERT OR IGNORE αν θέλεις να μην πειράξει υπάρχοντες
        for (const user of usersToInsert) {
            await db.run(
                `INSERT OR REPLACE INTO users (id, role, password) VALUES (?, ?, ?)`,
                user.id, user.role, user.password
            );
            console.log(`User ${user.id} inserted/replaced.`);
        }

        console.log('All users inserted successfully!');

    } catch (error) {
        console.error('Error inserting users:', error);
    } finally {
        if (db) {
            await db.close();
            console.log('Database connection closed.');
        }
    }
}

insertUsers();