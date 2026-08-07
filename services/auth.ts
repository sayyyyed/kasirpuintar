import * as Crypto from "expo-crypto";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/db";
import { supabase } from "@/services/supabase";
import { enqueueMutation } from "@/services/repositories/helpers";

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function signInWithPin(pin: string) {
  const hashedPin = await hashPin(pin);

  try {
    const records = await database
      .get("users")
      .query(
        Q.where("pin_hash", Q.eq(hashedPin)),
        Q.where("active", Q.eq(true)),
        Q.where("deleted_at", Q.eq(null))
      )
      .fetch();

    const localUser = (records as any[])[0];
    if (localUser) {
      return handleUserFound(localUser, pin);
    }
  } catch {
    // WatermelonDB might not be ready
  }

  return trySupabaseAuth(pin);
}

async function trySupabaseAuth(pin: string) {
  const ownerEmail = process.env.EXPO_PUBLIC_OWNER_EMAIL;
  if (!ownerEmail) {
    return { data: null, error: new Error("Owner email tidak dikonfigurasi") };
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password: pin,
  });

  if (authError || !authData?.user) {
    return { data: null, error: new Error("PIN tidak dikenali") };
  }

  const uid = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  if (profile) {
    try {
      await seedUserToLocalDB(profile);
    } catch {}
    return {
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as "owner" | "cashier",
        },
      },
      error: null,
    };
  }

  if (profileError) {
    return {
      data: null,
      error: new Error(`Gagal baca profil: ${profileError.message}`),
    };
  }

  const fallbackId = Crypto.randomUUID();
  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from("users").insert({
    id: uid,
    name: authData.user.email?.split("@")[0] || "Owner",
    email: ownerEmail,
    role: "owner",
    pin_hash: null,
    active: true,
    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    return {
      data: null,
      error: new Error(`Gagal buat profil owner: ${insertError.message}`),
    };
  }

  const result = {
    data: {
      user: {
        id: uid,
        email: ownerEmail,
        name: "Owner",
        role: "owner" as const,
      },
    },
    error: null,
  };

  try {
    await seedUserToLocalDB({
      id: uid,
      name: "Owner",
      email: ownerEmail,
      role: "owner",
      pin_hash: null,
      active: true,
    });
  } catch {}

  return result;
}

async function handleUserFound(user: any, pin: string) {
  if (user.role === "owner") {
    const email = user.email || process.env.EXPO_PUBLIC_OWNER_EMAIL;
    if (!email) {
      return { data: null, error: new Error("Akun owner tidak memiliki email") };
    }
    const { error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });
    if (supabaseError) {
      return { data: null, error: new Error("Gagal menghubungkan ke server") };
    }
  }

  return {
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "owner" | "cashier",
      },
    },
    error: null,
  };
}

async function seedUserToLocalDB(profile: any) {
  const existing = await database.get("users").find(profile.id).catch(() => null);
  if (existing) return;

  const now = Date.now();
  await database.write(async () => {
    await database.get("users").create((u: any) => {
      Object.assign(u._raw, {
        id: profile.id,
        name: profile.name || "Owner",
        email: profile.email || "",
        role: profile.role || "owner",
        pin_hash: profile.pin_hash || null,
        active: profile.active ?? true,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    });
  });
}

export async function createEmployee(
  name: string,
  email: string,
  pin: string
) {
  const hashedPin = await hashPin(pin);
  const id = Crypto.randomUUID();
  const now = Date.now();

  const payload = {
    id,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: "cashier",
    pin_hash: hashedPin,
    active: true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await database.write(async () => {
    await database.get("users").create((u: any) => {
      u._raw.id = id;
      Object.assign(u._raw, payload);
    });
  });

  await enqueueMutation("users", id, "upsert", payload);
  return { data: { id, name: payload.name, email: payload.email, pin }, error: null };
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const hashedPin = await hashPin(pin);
  const user = await database.get("users").find(userId);
  return (user as any).pin_hash === hashedPin;
}

export async function getEmployees() {
  const records = await database
    .get("users")
    .query(
      Q.where("role", Q.eq("cashier")),
      Q.where("active", Q.eq(true)),
      Q.where("deleted_at", Q.eq(null))
    )
    .fetch();
  return records as any[];
}
