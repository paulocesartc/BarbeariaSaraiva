import * as SQLite from 'expo-sqlite';

let db = null;

// Incrementar sempre que mudar estrutura de qualquer tabela
const SCHEMA_VERSION = 4;

export async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('barbearia.db');

  await db.execAsync('PRAGMA journal_mode = WAL;');

  const { user_version } = await db.getFirstAsync('PRAGMA user_version');

  if (user_version < SCHEMA_VERSION) {
    await db.execAsync(`
      DROP TABLE IF EXISTS services;
      DROP TABLE IF EXISTS clients;

      CREATE TABLE services (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        price        REAL NOT NULL,
        duration_min INTEGER NOT NULL DEFAULT 30,
        icon         TEXT NOT NULL DEFAULT 'content-cut',
        is_combo     INTEGER NOT NULL DEFAULT 0,
        combo_ids    TEXT DEFAULT NULL
      );

      CREATE TABLE clients (
        id                  TEXT PRIMARY KEY,
        name                TEXT NOT NULL,
        phone               TEXT,
        description         TEXT,
        avatar              TEXT,
        active              INTEGER NOT NULL DEFAULT 1,
        total_spent         REAL NOT NULL DEFAULT 0,
        total_appointments  INTEGER NOT NULL DEFAULT 0,
        created_at          TEXT DEFAULT (datetime('now','localtime'))
      );
    `);

    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }

  return db;
}

/** UUID v4 sem dependência externa */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
