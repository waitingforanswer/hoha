import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterRequest {
  username: string;
  password: string;
  full_name: string;
  phone: string;
}

interface LoginRequest {
  identifier: string;
  password: string;
}

// Convert Uint8Array to hex string
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex string to Uint8Array
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Simple password hashing using PBKDF2 (Deno-compatible)
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Generate or use existing salt
  const saltBytes = salt 
    ? fromHex(salt)
    : crypto.getRandomValues(new Uint8Array(16));
  
  const saltHex = salt || toHex(saltBytes);
  
  // Import key for PBKDF2
  const key = await crypto.subtle.importKey(
    "raw",
    passwordData,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  // Derive hash using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256
  );
  
  const hashHex = toHex(new Uint8Array(derivedBits));
  
  return { hash: `${saltHex}:${hashHex}`, salt: saltHex };
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, _] = storedHash.split(":");
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    
    console.log(`Processing ${action} request`);
    
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    if (action === "register") {
      return await handleRegister(supabase, body as RegisterRequest);
    } else if (action === "login") {
      return await handleLogin(supabase, body as LoginRequest);
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleRegister(supabase: any, data: RegisterRequest) {
  const { username, password, full_name, phone } = data;

  console.log(`Register attempt for username: ${username}`);

  // Validate input
  if (!username || !password || !full_name || !phone) {
    return new Response(
      JSON.stringify({ error: "Vui lòng điền đầy đủ thông tin" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (password.length < 8) {
    return new Response(
      JSON.stringify({ error: "Mật khẩu phải có ít nhất 8 ký tự" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if username already exists
  const { data: existingUsername } = await supabase
    .from("app_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUsername) {
    return new Response(
      JSON.stringify({ error: "Tên đăng nhập đã tồn tại", field: "username" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if phone already exists
  const { data: existingPhone } = await supabase
    .from("app_users")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingPhone) {
    return new Response(
      JSON.stringify({ error: "Số điện thoại đã được sử dụng", field: "phone" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Hash password using PBKDF2
  const { hash: password_hash } = await hashPassword(password);

  // Create user with PENDING status
  const { data: newUser, error: insertError } = await supabase
    .from("app_users")
    .insert({
      username,
      phone,
      password_hash,
      full_name,
      status: "PENDING",
    })
    .select("id, username, full_name, status")
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return new Response(
      JSON.stringify({ error: "Không thể tạo tài khoản. Vui lòng thử lại." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`User registered successfully: ${username}`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Tài khoản đã được tạo. Vui lòng liên hệ Hà Quang Thông để được duyệt.",
      user: newUser 
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleLogin(supabase: any, data: LoginRequest) {
  const { identifier, password } = data;

  console.log(`Login attempt for: ${identifier}`);

  // Validate input
  if (!identifier || !password) {
    return new Response(
      JSON.stringify({ error: "Vui lòng nhập đầy đủ thông tin" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Find user by username or phone
  const { data: user, error: findError } = await supabase
    .from("app_users")
    .select("*")
    .or(`username.eq.${identifier},phone.eq.${identifier}`)
    .maybeSingle();

  if (findError) {
    console.error("Find error:", findError);
    return new Response(
      JSON.stringify({ error: "Lỗi hệ thống. Vui lòng thử lại." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // User not found
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Tài khoản không tồn tại", field: "identifier" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify password
  const passwordValid = await verifyPassword(password, user.password_hash);
  
  if (!passwordValid) {
    return new Response(
      JSON.stringify({ error: "Mật khẩu không đúng", field: "password" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check status
  if (user.status !== "ACTIVE") {
    return new Response(
      JSON.stringify({ error: "Tài khoản chưa được kích hoạt", field: "status" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create session token
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Return user data (excluding password hash) and session
  const { password_hash, ...userWithoutPassword } = user;

  console.log(`User logged in successfully: ${identifier}`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      user: userWithoutPassword,
      session: {
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      }
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
