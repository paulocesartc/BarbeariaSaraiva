// Guarda o tenant_id em memória após o login
let currentTenantId = null;

export function setTenantId(id) {
  currentTenantId = id;
}

export function getTenantId() {
  return currentTenantId;
}
