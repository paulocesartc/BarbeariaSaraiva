import * as SQLite from 'expo-sqlite';

let db = null;
let initPromise = null;

const SCHEMA_VERSION = 7;

async function initDb() {
  console.log('[db] Abrindo banco barbearia.db');
  const conn = await SQLite.openDatabaseAsync('barbearia.db');

  const versionRow = await conn.getFirstAsync('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;
  console.log('[db] Versão atual:', currentVersion, '| Esperada:', SCHEMA_VERSION);

  if (currentVersion < SCHEMA_VERSION) {
    console.log('[db] Iniciando migração...');

    await conn.execAsync('DROP TABLE IF EXISTS appointments');
    await conn.execAsync('DROP TABLE IF EXISTS services');
    await conn.execAsync('DROP TABLE IF EXISTS clients');

    await conn.execAsync(
      'CREATE TABLE services (' +
      ' id TEXT PRIMARY KEY,' +
      ' name TEXT NOT NULL,' +
      ' price REAL NOT NULL,' +
      ' duration_min INTEGER NOT NULL DEFAULT 30,' +
      ' icon TEXT NOT NULL DEFAULT \'content-cut\',' +
      ' is_combo INTEGER NOT NULL DEFAULT 0,' +
      ' combo_ids TEXT DEFAULT NULL' +
      ')'
    );
    console.log('[db] Tabela services criada');

    await conn.execAsync(
      'CREATE TABLE clients (' +
      ' id TEXT PRIMARY KEY,' +
      ' name TEXT NOT NULL,' +
      ' phone TEXT,' +
      ' description TEXT,' +
      ' avatar TEXT,' +
      ' active INTEGER NOT NULL DEFAULT 1,' +
      ' total_spent REAL NOT NULL DEFAULT 0,' +
      ' total_appointments INTEGER NOT NULL DEFAULT 0,' +
      ' created_at TEXT DEFAULT (datetime(\'now\',\'localtime\'))' +
      ')'
    );
    console.log('[db] Tabela clients criada');

    await conn.execAsync(
      'CREATE TABLE appointments (' +
      ' id TEXT PRIMARY KEY,' +
      ' client_id TEXT NOT NULL,' +
      ' client_name TEXT NOT NULL,' +
      ' service_id TEXT NOT NULL,' +
      ' service_name TEXT NOT NULL,' +
      ' date TEXT NOT NULL,' +
      ' time TEXT NOT NULL,' +
      ' duration_min INTEGER NOT NULL DEFAULT 30,' +
      ' price REAL NOT NULL DEFAULT 0,' +
      ' status TEXT NOT NULL DEFAULT \'livre\',' +
      ' payment_method TEXT DEFAULT NULL,' +
      ' created_at TEXT DEFAULT (datetime(\'now\',\'localtime\'))' +
      ')'
    );
    console.log('[db] Tabela appointments criada');

    await conn.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    console.log('[db] Migração concluída!');
  }

  return conn;
}

export async function getDb() {
  if (db) return db;

  // Evita inicialização concorrente
  if (!initPromise) {
    initPromise = initDb().then((conn) => {
      db = conn;
      return conn;
    }).catch((e) => {
      console.error('[db] ERRO FATAL ao inicializar:', e);
      initPromise = null;
      throw e;
    });
  }

  return initPromise;
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
