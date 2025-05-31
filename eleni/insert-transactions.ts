import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function insertSampleTransactions(num: number) {
    const dbPath = path.join(process.cwd(), 'purchases.db'); // ΣΩΣΤΟ: process.cwd()
    console.log(`[DB] Attempting to open database at: ${dbPath}`);

    let db;
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        console.log('[DB] Database opened successfully.');

        // ΔΙΟΡΘΩΘΗΚΕ: Στήλες για απόλυτη συνέπεια με seed-db.ts (ethereum_amount)
        // ΑΦΑΙΡΕΘΗΚΑΝ ΤΑ ΣΧΟΛΙΑ ΑΠΟ ΤΗΝ SQL ΔΗΛΩΣΗ
        await db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT NOT NULL,
                product TEXT NOT NULL,
                ethereum_amount REAL NOT NULL, 
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[DB] Transactions table ensured.');

        console.log(`[DB] Starting to insert ${num} sample transactions...`);

        for (let i = 1; i <= num; i++) {
            const wallet_address_value = `0xTestWallet${String(i).padStart(2, '0')}`;
            const product = `Product ${Math.floor(Math.random() * 3) + 1}`;
            const amount = parseFloat((Math.random() * 0.1 + 0.01).toFixed(2));

            try {
                // ΔΙΟΡΘΩΘΗΚΕ: Ονόματα στηλών στην INSERT δήλωση (ethereum_amount)
                // Επίσης, προστέθηκε CURRENT_TIMESTAMP για τη στήλη timestamp
                await db.run(
                    `INSERT INTO transactions (wallet_address, product, ethereum_amount, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                    wallet_address_value,
                    product,
                    amount
                );
                console.log(`[DB] Inserted transaction ${i}: ${wallet_address_value}, ${product}, ${amount}`);
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