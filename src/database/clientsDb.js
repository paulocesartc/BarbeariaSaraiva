import { getDb, generateUUID } from './db';

export async function getAllClients({ includeInactive = false } = {}) {
  const db = await getDb();
  const where = includeInactive ? '' : 'WHERE active = 1';
  return db.getAllAsync(`SELECT * FROM clients ${where} ORDER BY name ASC`);
}

export async function getClientById(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM clients WHERE id = ?', [id]);
}

export async function createClient({ name, phone, description }) {
  const db = await getDb();
  const id = generateUUID();
  const avatar = name
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const payload = { id, name, phone, description, avatar };
  console.log('[clientsDb] createClient →', JSON.stringify(payload));

  await db.runAsync(
    `INSERT INTO clients (id, name, phone, description, avatar)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name.trim(), phone ?? '', description ?? '', avatar]
  );
  console.log('[clientsDb] createClient → ok, id:', id);
  return id;
}

export async function updateClient(id, { name, phone, description }) {
  const db = await getDb();
  const avatar = name
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  console.log('[clientsDb] updateClient → id:', id, JSON.stringify({ name, phone, description }));

  await db.runAsync(
    `UPDATE clients SET name = ?, phone = ?, description = ?, avatar = ? WHERE id = ?`,
    [name.trim(), phone ?? '', description ?? '', avatar, id]
  );
  console.log('[clientsDb] updateClient → ok');
}

export async function setClientActive(id, active) {
  const db = await getDb();
  console.log('[clientsDb] setClientActive → id:', id, 'active:', active);
  await db.runAsync('UPDATE clients SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
}

/** Importa uma lista de contatos em massa, ignorando duplicatas de telefone */
export async function importClients(contacts) {
  const db = await getDb();

  // Pega todos os telefones já cadastrados para evitar duplicata
  const existing = await db.getAllAsync('SELECT phone FROM clients');
  const existingPhones = new Set(existing.map((r) => r.phone.replace(/\D/g, '')));

  let imported = 0;
  await db.withTransactionAsync(async () => {
    for (const c of contacts) {
      const rawPhone = (c.phone ?? '').replace(/\D/g, '');
      if (existingPhones.has(rawPhone)) continue;

      const id = generateUUID();
      const avatar = (c.name ?? '?')
        .trim()
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      await db.runAsync(
        `INSERT INTO clients (id, name, phone, description, avatar) VALUES (?, ?, ?, ?, ?)`,
        [id, c.name.trim(), c.phone ?? '', '', avatar]
      );
      existingPhones.add(rawPhone);
      imported++;
    }
  });

  console.log('[clientsDb] importClients → importados:', imported, '| ignorados:', contacts.length - imported);
  return imported;
}

/** Incrementa contadores após um atendimento ser finalizado */
export async function addAppointmentToClient(clientId, value) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE clients
     SET total_appointments = total_appointments + 1,
         total_spent = total_spent + ?
     WHERE id = ?`,
    [value, clientId]
  );
}
