import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaga } = await req.json();

    if (!vaga) {
      return new Response(
        JSON.stringify({ error: "Dados da vaga não fornecidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the notification (in production, integrate with email service)
    console.log("Nova vaga aguardando aprovação:", {
      cargo: vaga.cargo,
      centro_custo: vaga.centro_custo_nome,
      site_contrato: vaga.site_contrato,
      candidato: vaga.nome_candidato,
    });

    // For now, return success. Email sending requires email domain configuration.
    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificação processada. Configure um domínio de e-mail no Cloud para enviar e-mails.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na edge function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
