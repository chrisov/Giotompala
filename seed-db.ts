// seed-db.ts - Για καταγραφή αγορών (transactions)

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { unlink } from 'fs/promises';

async function seedDatabase() {
    // Αλλάζουμε το όνομα του αρχείου της βάσης δεδομένων σε purchases.db
    const DB_FILE = path.join(__dirname, 'purchases.db');

    // Διαγράψτε το αρχείο της βάσης δεδομένων αν υπάρχει, για να ξεκινήσετε από την αρχή με το νέο schema
    try {
        await unlink(DB_FILE);
        console.log(`Removed existing database file: ${DB_FILE}`);
    } catch (e: any) {
        if (e.code !== 'ENOENT') {
            console.error('Error removing database file:', e);
            process.exit(1);
        }
    }

    const db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    // Δημιουργία νέου πίνακα "transactions"
    await db.exec(`
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL,
            product TEXT NOT NULL,
            ethereum_amount REAL NOT NULL,
            timestamp TEXT NOT NULL
        );
    `);
    console.log('Database initialized with "transactions" table.');

    // Δεν θα εισάγουμε sample "users" πλέον, αλλά sample "transactions"
    // Αυτά είναι απλά δείγματα, δεν είναι απαραίτητα.
    const now = new Date().toISOString();
    await db.run("INSERT INTO transactions (wallet_address, product, ethereum_amount, timestamp) VALUES (?, ?, ?, ?)",
        "0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b", "Cool Widget", 0.05, now);
    await db.run("INSERT INTO transactions (wallet_address, product, ethereum_amount, timestamp) VALUES (?, ?, ?, ?)",
        "0xF1E2D3C4B5A6F7E8D9C0B1A2F3E4D5C6B7A8F9E0", "Super Gadget", 0.1, now);

    console.log('Sample transactions inserted successfully.');

    await db.close();
    console.log('Database seeding complete.');
}

seedDatabase().catch(err => {
    console.error('Error seeding database:', err);
});