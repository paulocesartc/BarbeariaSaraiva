const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Recebido:', JSON.stringify(body));

    const { clientName, serviceName, date, time } = body;

    // Busca token via REST API (sem SDK para evitar erros de import)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Supabase URL:', supabaseUrl);

    const { tenantId } = body;
    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'tenantId obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/settings?select=value&key=eq.expo_push_token&tenant_id=eq.${tenantId}`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const settings = await settingsRes.json();
    console.log('Settings response:', JSON.stringify(settings));

    const token = settings?.[0]?.value;
    if (!token) {
      console.log('Token não encontrado');
      return new Response(JSON.stringify({ error: 'Token not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('Token encontrado:', token);

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const [ano, mes, dia] = date.split('-');
    const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const dataFormatada = `${diasSemana[dataObj.getDay()]} ${dia}/${mes}`;

    const pushPayload = {
      to: token,
      title: '📅 Novo agendamento pelo site!',
      body: `${clientName} agendou ${serviceName} — ${dataFormatada} às ${time}`,
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    };
    console.log('Enviando push:', JSON.stringify(pushPayload));

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(pushPayload),
    });

    const expoResult = await expoRes.json();
    console.log('Expo response:', JSON.stringify(expoResult));

    // Aguarda 5s e verifica o receipt para confirmar entrega pelo FCM
    const receiptId = expoResult?.data?.id;
    if (receiptId) {
      await new Promise(r => setTimeout(r, 5000));
      const receiptRes = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [receiptId] }),
      });
      const receipt = await receiptRes.json();
      console.log('Receipt:', JSON.stringify(receipt));
    }

    return new Response(JSON.stringify(expoResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Erro:', e.message, e.stack);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
