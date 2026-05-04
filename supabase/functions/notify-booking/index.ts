import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientName, serviceName, date, time } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'expo_push_token')
      .maybeSingle();

    const token = data?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const [ano, mes, dia] = date.split('-');
    const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const dataFormatada = `${diasSemana[dataObj.getDay()]} ${dia}/${mes}`;

    const expoPush = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: '📅 Novo agendamento pelo site!',
        body: `${clientName} agendou ${serviceName} — ${dataFormatada} às ${time}`,
        sound: 'default',
        priority: 'high',
      }),
    });

    const result = await expoPush.json();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
