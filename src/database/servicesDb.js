import { getDb, generateUUID } from './db';

export async function getAllServices() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM services ORDER BY name ASC');
}

export async function createService({ name, price, duration_min, icon = 'content-cut' }) {
  const db = await getDb();
  const id = generateUUID();
  const payload = { id, name, price, duration_min, icon };
  console.log('[servicesDb] createService →', JSON.stringify(payload));

  await db.runAsync(
    'INSERT INTO services (id, name, price, duration_min, icon) VALUES (?, ?, ?, ?, ?)',
    [id, name, price, duration_min, icon]
  );
  console.log('[servicesDb] createService → ok, id:', id);
  return id;
}

export async function updateService(id, fields) {
  const db = await getDb();
  const { name, price, duration_min, icon } = fields;
  console.log('[servicesDb] updateService → id:', id, '|', JSON.stringify({ name, price, duration_min, icon }));

  await db.runAsync(
    'UPDATE services SET name = ?, price = ?, duration_min = ?, icon = ? WHERE id = ?',
    [name, price, duration_min, icon, id]
  );
  console.log('[servicesDb] updateService → ok');
}

export async function deleteService(id) {
  const db = await getDb();
  console.log('[servicesDb] deleteService → id:', id);
  await db.runAsync('DELETE FROM services WHERE id = ?', [id]);
}

export async function createCombo({ services, finalPrice, customName }) {
  const db = await getDb();
  const id = generateUUID();
  const name = customName || services.map((s) => s.name).join(' + ');
  const duration_min = services.reduce((sum, s) => sum + s.duration_min, 0);
  const combo_ids = JSON.stringify(services.map((s) => s.id));
  console.log('[servicesDb] createCombo →', JSON.stringify({ id, name, price: finalPrice, duration_min, combo_ids }));

  await db.runAsync(
    'INSERT INTO services (id, name, price, duration_min, icon, is_combo, combo_ids) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [id, name, finalPrice, duration_min, 'star', combo_ids]
  );
  console.log('[servicesDb] createCombo → ok, id:', id);
  return id;
}
