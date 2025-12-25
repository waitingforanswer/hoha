import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  identifier: string; // username or phone
  password: string;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeIdentifier(value: string) {
  return value.trim();
}

function normalizePhone(value: string) {
  // keep digits only
  return value.replace(/\D/g, "");
}

// Convert Uint8Array to hex string
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert hex string to Uint8Array
function fromHex(hex: string): Uint8Array {
  const clean = hex.trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

// PBKDF2 password hashing (Deno edge compatible)
async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const rawSalt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  // Force an ArrayBuffer-backed Uint8Array for WebCrypto type compatibility
  const saltBytes = new Uint8Array(rawSalt);
  const actualSaltHex = saltHex ?? toHex(saltBytes);

  const key = await crypto.subtle.importKey("raw", passwordData, "PBKDF2", false, ["deriveBits"]);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256
  );

  const hashHex = toHex(new Uint8Array(derivedBits));

  // store as salt:hash
  return { hash: `${actualSaltHex}:${hashHex}`, salt: actualSaltHex };
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex] = stored.split(":");
  if (!saltHex) return false;
  const { hash } = await hashPassword(password, saltHex);
  return hash === stored;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

    const body = await req.json();

    if (action === "register") return await handleRegister(supabase, body as RegisterRequest);
    if (action === "login") return await handleLogin(supabase, body as LoginRequest);

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Auth error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});

async function handleRegister(supabase: any, data: RegisterRequest) {
  const username = normalizeIdentifier(data.username || "");
  const phone = normalizePhone(data.phone || "");
  const full_name = (data.full_name || "").trim();
  const password = data.password || "";

  if (!username || !password || !full_name || !phone) {
    return json({ success: false, error: "Vui lòng điền đầy đủ thông tin" });
  }

  if (password.length < 8) {
    return json({ success: false, error: "Mật khẩu phải có ít nhất 8 ký tự", field: "password" });
  }

  // Check uniqueness
  const { data: existingUsername } = await supabase
    .from("app_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existingUsername) return json({ success: false, error: "Tên đăng nhập đã tồn tại", field: "username" });

  const { data: existingPhone } = await supabase
    .from("app_users")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existingPhone) return json({ success: false, error: "Số điện thoại đã được sử dụng", field: "phone" });

  const { hash: password_hash } = await hashPassword(password);

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
    return json({ success: false, error: "Không thể tạo tài khoản. Vui lòng thử lại." }, 500);
  }

  return json({
    success: true,
    message: "Tài khoản đã được tạo. Vui lòng liên hệ Hà Quang Thông để được duyệt.",
    user: newUser,
  });
}

async function handleLogin(supabase: any, data: LoginRequest) {
  const identifier = normalizeIdentifier(data.identifier || "");
  const password = data.password || "";

  if (!identifier || !password) {
    return json({ success: false, error: "Vui lòng nhập đầy đủ thông tin" });
  }

  // Try username first (exact), then phone (normalized)
  const { data: byUsername, error: findUsernameError } = await supabase
    .from("app_users")
    .select("*")
    .eq("username", identifier)
    .maybeSingle();

  if (findUsernameError) {
    console.error("Find username error:", findUsernameError);
    return json({ success: false, error: "Lỗi hệ thống. Vui lòng thử lại." }, 500);
  }

  let user = byUsername;

  if (!user) {
    const phone = normalizePhone(identifier);
    const { data: byPhone, error: findPhoneError } = await supabase
      .from("app_users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (findPhoneError) {
      console.error("Find phone error:", findPhoneError);
      return json({ success: false, error: "Lỗi hệ thống. Vui lòng thử lại." }, 500);
    }

    user = byPhone;
  }

  if (!user) {
    return json({ success: false, error: "Tài khoản không tồn tại", field: "identifier" });
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    return json({ success: false, error: "Mật khẩu không đúng", field: "password" });
  }

  if (user.status !== "ACTIVE") {
    return json({ success: false, error: "Tài khoản chưa được kích hoạt", field: "status" });
  }

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const { password_hash, ...userWithoutPassword } = user;

  return json({
    success: true,
    user: userWithoutPassword,
    session: {
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
    },
  });
}
