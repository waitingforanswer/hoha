import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if it's a Supabase Auth token or app_user session token
    let hasPermission = false;
    let userId: string | null = null;

    // Try Supabase Auth first
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    
    if (user) {
      userId = user.id;
      // Check if user is admin
      const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { _user_id: user.id });
      if (isAdmin) {
        hasPermission = true;
      } else {
        // Check if user has MANAGE_MEMBERS permission
        const { data: hasPerm } = await supabaseAdmin.rpc("has_permission", { 
          _user_id: user.id, 
          _permission_code: "MANAGE_MEMBERS" 
        });
        hasPermission = !!hasPerm;
      }
    } else {
      // Try app_user session token
      const { data: session } = await supabaseAdmin
        .from("app_user_sessions")
        .select("app_user_id, expires_at")
        .eq("token", token)
        .single();

      if (session && new Date(session.expires_at) > new Date()) {
        userId = session.app_user_id;
        
        // Check if app_user has MANAGE_MEMBERS permission
        const { data: hasPerm } = await supabaseAdmin.rpc("app_user_has_permission", {
          _user_id: session.app_user_id,
          _permission_code: "MANAGE_MEMBERS"
        });
        hasPermission = !!hasPerm;
      }
    }

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Bạn không có quyền quản lý thành viên" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, memberId, memberData } = body;

    let result;

    switch (action) {
      case "create":
        const { data: newMember, error: createError } = await supabaseAdmin
          .from("family_members")
          .insert(memberData)
          .select()
          .single();
        
        if (createError) throw createError;
        result = newMember;
        break;

      case "update":
        if (!memberId) {
          return new Response(
            JSON.stringify({ error: "Missing memberId for update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const { data: updatedMember, error: updateError } = await supabaseAdmin
          .from("family_members")
          .update(memberData)
          .eq("id", memberId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        result = updatedMember;
        break;

      case "delete":
        if (!memberId) {
          return new Response(
            JSON.stringify({ error: "Missing memberId for delete" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const { error: deleteError } = await supabaseAdmin
          .from("family_members")
          .delete()
          .eq("id", memberId);
        
        if (deleteError) throw deleteError;
        result = { success: true };
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
