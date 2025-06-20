import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { AppError } from '../utils/errors';

// Check if backup file path is provided
const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Please provide a backup file path');
  process.exit(1);
}

// Ensure backup directory exists
const backupDir = path.dirname(backupFile);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function backupDatabase() {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      throw AppError.internal('Failed to get tables', tablesError);
    }

    // Create backup file
    const backupStream = fs.createWriteStream(backupFile);

    // Write header
    backupStream.write('-- Database Backup\n');
    backupStream.write(`-- Generated: ${new Date().toISOString()}\n\n`);

    // Backup each table
    for (const table of tables) {
      const tableName = table.table_name;

      // Get table data
      const { data: rows, error: dataError } = await supabase
        .from(tableName)
        .select('*');

      if (dataError) {
        throw AppError.internal(`Failed to get data for table ${tableName}`, dataError);
      }

      // Write table header
      backupStream.write(`\n-- Table: ${tableName}\n`);
      backupStream.write(`-- Rows: ${rows.length}\n\n`);

      // Write table data
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row).map(value => {
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          return value;
        });

        backupStream.write(
          `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
        );
      }
    }

    // Close backup file
    backupStream.end();

    console.log(`Backup completed successfully: ${backupFile}`);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

// Run backup
backupDatabase(); 