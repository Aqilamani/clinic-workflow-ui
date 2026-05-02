// src/api/profiles.js
// Thin wrapper around Supabase profile queries.
// Pages call these functions instead of using `supabase` directly.

import { supabase } from "../lib/supabase"

// Fetch the current authenticated user's profile.
// Returns null if not authenticated.
export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) throw error
  return data
}

// Update the current user's profile.
// `updates` is a partial object — only the fields you want to change.
// Returns the updated profile row.
export async function updateProfile(updates) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update the current user's password.
// Supabase handles current-password verification server-side;
// we just need the new password.
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}