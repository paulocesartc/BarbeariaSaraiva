/// <reference types="https://deno.land/x/deno/cli/tsc/dts/lib.deno.d.ts" />
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { slug, action, payload } = await req.json();

    if (!slug || !action) {
      return Response.json({ error: 'slug e action são obrigatórios' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Resolve tenant pelo slug
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, name, whatsapp, logo_url, pix_key, city')
      .eq('slug', slug)
      .single();

    if (tenantErr || !tenant) {
      return Response.json({ error: 'Tenant não encontrado' }, { status: 404, headers: corsHeaders });
    }

    const tid = tenant.id;

    // ── GET_CONFIG ────────────────────────────────────────────
    if (action === 'get_config') {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .eq('tenant_id', tid);

      const { data: blocked } = await supabase
        .from('blocked_days')
        .select('date')
        .eq('tenant_id', tid);

      return Response.json({
        tenant: { name: tenant.name, whatsapp: tenant.whatsapp, logo_url: tenant.logo_url, pix_key: tenant.pix_key ?? null, city: tenant.city ?? null },
        settings: settings ?? [],
        blocked_days: (blocked ?? []).map((r: { date: string }) => r.date),
      }, { headers: corsHeaders });
    }

    // ── GET_SERVICES ──────────────────────────────────────────
    if (action === 'get_services') {
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tid)
        .order('name');

      return Response.json({ services: services ?? [] }, { headers: corsHeaders });
    }

    // ── GET_APPOINTMENTS ──────────────────────────────────────
    if (action === 'get_appointments') {
      const { date } = payload ?? {};
      if (!date) return Response.json({ error: 'date obrigatório' }, { status: 400, headers: corsHeaders });

      const { data: appointments } = await supabase
        .from('appointments')
        .select('time, duration_min')
        .eq('tenant_id', tid)
        .eq('date', date)
        .neq('status', 'cancelado');

      return Response.json({ appointments: appointments ?? [] }, { headers: corsHeaders });
    }

    // ── LOOKUP_CLIENT ─────────────────────────────────────────
    if (action === 'lookup_client') {
      const { phone } = payload ?? {};
      if (!phone) return Response.json({ error: 'phone obrigatório' }, { status: 400, headers: corsHeaders });

      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, avatar')
        .eq('tenant_id', tid)
        .eq('phone', phone)
        .limit(1);

      return Response.json({ client: clients?.[0] ?? null }, { headers: corsHeaders });
    }

    // ── CREATE_APPOINTMENT ────────────────────────────────────
    if (action === 'create_appointment') {
      const { client_phone, client_name, service_id, date, time } = payload ?? {};

      if (!client_phone || !client_name || !service_id || !date || !time) {
        return Response.json({ error: 'Dados incompletos' }, { status: 400, headers: corsHeaders });
      }

      // Busca o serviço
      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('id', service_id)
        .eq('tenant_id', tid)
        .single();

      if (!service) return Response.json({ error: 'Serviço não encontrado' }, { status: 404, headers: corsHeaders });

      // Verifica ou cria o cliente
      let clientId: string;
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('tenant_id', tid)
        .eq('phone', client_phone)
        .limit(1);

      if (existing && existing.length > 0) {
        clientId = existing[0].id;
      } else {
        const avatar = client_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
        const newId = crypto.randomUUID();
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({ id: newId, tenant_id: tid, name: client_name, phone: client_phone, avatar, description: '' })
          .select('id')
          .single();

        if (clientErr || !newClient) {
          console.error('Erro ao cadastrar cliente:', JSON.stringify(clientErr));
          return Response.json({ error: 'Erro ao cadastrar cliente', detail: clientErr }, { status: 500, headers: corsHeaders });
        }
        clientId = newClient.id;
      }

      // Cria o agendamento
      const { error: apptErr } = await supabase
        .from('appointments')
        .insert({
          id: crypto.randomUUID(),
          tenant_id: tid,
          client_id: clientId,
          client_name,
          service_id: service.id,
          service_name: service.name,
          date,
          time,
          duration_min: service.duration_min,
          price: service.price,
          status: 'agendado',
        });

      if (apptErr) {
        console.error('Erro ao criar agendamento:', JSON.stringify(apptErr));
        return Response.json({ error: 'Erro ao criar agendamento' }, { status: 500, headers: corsHeaders });
      }

      // Dispara push notification pro barbeiro correto
      const notifyUrl = `${SUPABASE_URL}/functions/v1/notify-booking`;
      fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          tenantId: tid,
          clientName: client_name,
          serviceName: service.name,
          date,
          time,
        }),
      }).catch(() => {});

      return Response.json({
        ok: true,
        whatsapp: tenant.whatsapp,
        service_name: service.name,
      }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Action desconhecida' }, { status: 400, headers: corsHeaders });

  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: corsHeaders });
  }
});
