import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function insertSampleTransactions(num: number) {
    const dbPath = path.join(process.cwd(), 'purchases.db');
    console.log(`[DB] Attempting to open database at: ${dbPath}`);

    let db;
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        console.log('[DB] Database opened successfully.');

        // === ΕΔΩ ΕΙΝΑΙ Η ΔΙΟΡΘΩΣΗ: ΑΛΛΑΖΟΥΜΕ ΤΑ ΟΝΟΜΑ ΣΤΗΛΩΝ ===
        await db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                walletAddress TEXT NOT NULL,       
                product TEXT NOT NULL,
                amount REAL NOT NULL,              
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[DB] Transactions table ensured.');

        console.log(`[DB] Starting to insert ${num} sample transactions...`);

        for (let i = 1; i <= num; i++) {
            const walletAddress_value = `0xTestWallet${String(i).padStart(2, '0')}`;
            const product = `Product ${Math.floor(Math.random() * 3) + 1}`;
            const amount = parseFloat((Math.random() * 0.1 + 0.01).toFixed(2));

            try {
                // === ΕΔΩ ΕΙΝΑΙ Η ΔΙΟΡΘΩΣΗ: Ονόματα στηλών στην INSERT δήλωση ===
                await db.run(
                    `INSERT INTO transactions (walletAddress, product, amount, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                    walletAddress_value,
                    product,
                    amount
                );
                console.log(`[DB] Inserted transaction ${i}: ${walletAddress_value}, ${product}, ${amount}`);
            } catch (insertError) {
                console.error(`[DB] Error inserting transaction ${i}:`, insertError);
                break;
            }
        }

        console.log(`[DB] Finished inserting transactions.`);
    } catch (openError) {
        console.error('[DB] Error opening database:', openError);
    } finally {
        if (db) {
            await db.close();
            console.log('[DB] Database closed.');
        }
    }
}

insertSampleTransactions(19);