import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';

const DB_FILE = path.join(__dirname, 'users.db');
const SQL_SEED_FILE = path.join(__dirname, 'seed.sql');

async function seedDatabase() {
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

        // <-- ΠΡΟΣΘΕΣΕ ΑΥΤΗ ΤΗ ΓΡΑΜΜΗ ΕΔΩ
        await db.exec('DELETE FROM users;');
        console.log('Existing users deleted from "users" table.');
        // --> ΤΕΛΟΣ ΠΡΟΣΘΗΚΗΣ

        // Διαβάζουμε το SQL αρχείο
        const sql = await fs.readFile(SQL_SEED_FILE, { encoding: 'utf8' });

        // Εκτελούμε όλες τις εντολές από το SQL αρχείο
        await db.exec(sql);
        console.log('Database seeded successfully from seed.sql!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        if (db) {
            await db.close();
            console.log('Database connection closed.');
        }
    }
}

seedDatabase();