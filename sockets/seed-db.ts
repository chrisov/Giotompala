import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { unlink } from 'fs/promises';

async function seedDatabase() {
    // Η διαδρομή είναι σωστή για το server.ts και τα άλλα scripts
    const DB_FILE = path.join(process.cwd(), 'purchases.db');

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
    // === ΕΔΩ ΕΙΝΑΙ Η ΔΙΟΡΘΩΣΗ: ΑΛΛΑΖΟΥΜΕ ΤΑ ΟΝΟΜΑ ΣΤΗΛΩΝ ===
    await db.exec(`
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            walletAddress TEXT NOT NULL,       
            product TEXT NOT NULL,
            amount REAL NOT NULL,              
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('Database initialized with "transactions" table.');

    // ΑΦΑΙΡΕΘΗΚΑΝ ΟΙ SAMPLE TRANSACTIONS
    // console.log('Sample transactions inserted successfully.'); 

    await db.close();
    console.log('Database seeding complete.');
}

seedDatabase().catch(err => {
    console.error('Error seeding database:', err);
});