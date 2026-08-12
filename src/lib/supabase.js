import { createClient } from '@supabase/supabase-js'

// Mengambil URL dan Anon Key dari file environment (.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Helper Auth Admin menggunakan Supabase
 */
export async function loginAdminSupabase(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Helper Logout Admin Supabase
 */
export async function logoutAdminSupabase() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

/**
 * Helper Ambil Data UMKM dari Supabase Database
 */
export async function getUmkmFromSupabase() {
  const { data, error } = await supabase
    .from('umkm')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.error('Error fetching UMKM from Supabase:', error)
    return null
  }

  return data
}

/**
 * Helper Ambil Data Galeri dari Supabase Database
 */
export async function getGalleryFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.warn('Supabase gallery fetch warning:', error.message)
      return null
    }

    return data || []
  } catch (err) {
    console.warn('Supabase fetch exception:', err)
    return null
  }
}

/**
 * Helper Tambah Foto Galeri ke Supabase Database
 */
export async function addGalleryToSupabase(item) {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .insert([item])
      .select()

    if (error) {
      console.warn('Supabase add gallery error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Supabase add gallery exception:', err)
    return null
  }
}

/**
 * Helper Update Foto Galeri di Supabase Database
 */
export async function updateGalleryInSupabase(id, item) {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .update(item)
      .eq('id', id)
      .select()

    if (error) {
      console.warn('Supabase update gallery error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Supabase update gallery exception:', err)
    return null
  }
}

/**
 * Helper Hapus Foto Galeri dari Supabase Database
 */
export async function deleteGalleryFromSupabase(id) {
  try {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id)

    if (error) {
      console.warn('Supabase delete gallery error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('Supabase delete gallery exception:', err)
    return false
  }
}

