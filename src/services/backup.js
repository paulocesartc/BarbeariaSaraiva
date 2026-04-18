import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDb } from '../database/db';

const BACKUP_VERSION = 1;

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

/** Lê todas as tabelas e serializa num JSON */
export async function exportBackup() {
  const db = await getDb();
  const [clients, services, appointments] = await Promise.all([
    db.getAllAsync('SELECT * FROM clients'),
    db.getAllAsync('SELECT * FROM services'),
    db.getAllAsync('SELECT * FROM appointments'),
  ]);

  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    clients,
    services,
    appointments,
  };

  const json = JSON.stringify(payload, null, 2);
  const fileName = `barbearia-backup_${timestamp()}.json`;
  const uri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  console.log('[backup] exportado →', uri, `(${json.length} bytes)`);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Salvar backup',
      UTI: 'public.json',
    });
  }

  return { uri, fileName, totals: { clients: clients.length, services: services.length, appointments: appointments.length } };
}

/** Restaura a partir de um JSON válido. Sobrescreve tudo, em transação. */
export async function importBackup(uri) {
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let payload;
  try {
    payload = JSON.parse(content);
  } catch {
    throw new Error('Arquivo inválido (JSON malformado).');
  }

  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.clients)) {
    throw new Error('Arquivo não parece ser um backup válido.');
  }

  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM appointments');
    await db.runAsync('DELETE FROM services');
    await db.runAsync('DELETE FROM clients');

    for (const c of payload.clients ?? []) {
      await db.runAsync(
        `INSERT INTO clients (id, name, phone, description, avatar, active, total_spent, total_appointments, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id, c.name, c.phone ?? '', c.description ?? '', c.avatar ?? '',
          c.active ?? 1, c.total_spent ?? 0, c.total_appointments ?? 0,
          c.created_at ?? new Date().toISOString(),
        ]
      );
    }

    for (const s of payload.services ?? []) {
      await db.runAsync(
        `INSERT INTO services (id, name, price, duration_min, icon, is_combo, combo_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id, s.name, s.price, s.duration_min ?? 30,
          s.icon ?? 'content-cut', s.is_combo ?? 0, s.combo_ids ?? null,
        ]
      );
    }

    for (const a of payload.appointments ?? []) {
      await db.runAsync(
        `INSERT INTO appointments (id, client_id, client_name, service_id, service_name, date, time, duration_min, price, status, payment_method, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id, a.client_id, a.client_name, a.service_id, a.service_name,
          a.date, a.time, a.duration_min ?? 30, a.price ?? 0,
          a.status ?? 'livre', a.payment_method ?? null,
          a.created_at ?? new Date().toISOString(),
        ]
      );
    }
  });

  console.log('[backup] restaurado →', {
    clients: payload.clients?.length ?? 0,
    services: payload.services?.length ?? 0,
    appointments: payload.appointments?.length ?? 0,
  });

  return {
    clients: payload.clients?.length ?? 0,
    services: payload.services?.length ?? 0,
    appointments: payload.appointments?.length ?? 0,
  };
}

/** Retorna espaço livre em bytes no storage do app (pra detectar disco cheio) */
export async function getFreeDiskBytes() {
  try {
    return await FileSystem.getFreeDiskStorageAsync();
  } catch {
    return null;
  }
}
