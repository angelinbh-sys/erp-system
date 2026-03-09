import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, nome, email, cpf, senha, grupo_permissao, ativo, reset_password } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle password reset by admin
    if (reset_password) {
      // Generate temp password
      const tempPassword = Math.random().toString(36).slice(-8) + "A1";
      
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password: tempPassword,
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Set must_change_password
      await supabaseAdmin.from("profiles").update({ must_change_password: true }).eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true, temp_password: tempPassword }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check duplicate email
    if (email) {
      const { data: emailExists } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .neq("user_id", user_id)
        .maybeSingle();
      if (emailExists) {
        return new Response(JSON.stringify({ error: "Já existe um usuário cadastrado com este e-mail." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check duplicate CPF
    if (cpf) {
      const { data: cpfExists } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("cpf", cpf)
        .neq("user_id", user_id)
        .maybeSingle();
      if (cpfExists) {
        return new Response(JSON.stringify({ error: "Já existe um usuário cadastrado com este CPF." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const authUpdate: Record<string, unknown> = {};
    if (senha) authUpdate.password = senha;
    if (email) authUpdate.email = email;

    if (Object.keys(authUpdate).length > 0) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdate);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update profile
    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (cpf !== undefined) updateData.cpf = cpf;
    if (grupo_permissao !== undefined) updateData.grupo_permissao = grupo_permissao;
    if (ativo !== undefined) updateData.ativo = ativo;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabaseAdmin.from("profiles").update(updateData).eq("user_id", user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
