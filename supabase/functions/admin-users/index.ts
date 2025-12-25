import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Convert Uint8Array to hex string
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// PBKDF2 password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = toHex(salt);

  const key = await crypto.subtle.importKey("raw", passwordData, "PBKDF2", false, ["deriveBits"]);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256
  );

  const hashHex = toHex(new Uint8Array(derivedBits));
  return `${saltHex}:${hashHex}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error("Auth error:", authError);
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: authUser.id });
    if (!isAdmin) {
      return json({ success: false, error: "Forbidden - Admin only" }, 403);
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    if (req.method === "GET" && action === "admin-users") {
      // List all users
      const { data: users, error } = await supabase
        .from("app_users")
        .select("id, username, full_name, phone, status, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch users error:", error);
        return json({ success: false, error: "Failed to fetch users" }, 500);
      }

      return json({ success: true, users });
    }

    if (req.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, 405);
    }

    const body = await req.json();

    if (action === "update-status") {
      const { user_id, status } = body;
      
      if (!user_id || !status) {
        return json({ success: false, error: "Missing user_id or status" }, 400);
      }

      if (!["ACTIVE", "INACTIVE", "PENDING"].includes(status)) {
        return json({ success: false, error: "Invalid status" }, 400);
      }

      const { error } = await supabase
        .from("app_users")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", user_id);

      if (error) {
        console.error("Update status error:", error);
        return json({ success: false, error: "Failed to update status" }, 500);
      }

      console.log(`User ${user_id} status updated to ${status} by admin ${authUser.id}`);
      return json({ success: true, message: "Status updated successfully" });
    }

    if (action === "change-password") {
      const { user_id, new_password } = body;
      
      if (!user_id || !new_password) {
        return json({ success: false, error: "Missing user_id or new_password" }, 400);
      }

      if (new_password.length < 8) {
        return json({ success: false, error: "Password must be at least 8 characters" }, 400);
      }

      const password_hash = await hashPassword(new_password);

      const { error } = await supabase
        .from("app_users")
        .update({ password_hash, updated_at: new Date().toISOString() })
        .eq("id", user_id);

      if (error) {
        console.error("Change password error:", error);
        return json({ success: false, error: "Failed to change password" }, 500);
      }

      console.log(`User ${user_id} password changed by admin ${authUser.id}`);
      return json({ success: true, message: "Password changed successfully" });
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Admin users error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
