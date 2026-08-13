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

/**
 * Helper Ambil Data Sponsor dari Supabase Database
 */
export async function getSponsorsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.warn('Supabase sponsors fetch warning:', error.message)
      return null
    }

    return data || []
  } catch (err) {
    console.warn('Supabase fetch exception:', err)
    return null
  }
}

/**
 * Helper Tambah Sponsor ke Supabase Database
 */
export async function addSponsorToSupabase(item) {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .insert([item])
      .select()

    if (error) {
      console.warn('Supabase add sponsor error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Supabase add sponsor exception:', err)
    return null
  }
}

/**
 * Helper Update Sponsor di Supabase Database
 */
export async function updateSponsorInSupabase(id, item) {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .update(item)
      .eq('id', id)
      .select()

    if (error) {
      console.warn('Supabase update sponsor error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Supabase update sponsor exception:', err)
    return null
  }
}

/**
 * Helper Hapus Sponsor dari Supabase Database
 */
export async function deleteSponsorFromSupabase(id) {
  try {
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id)

    if (error) {
      console.warn('Supabase delete sponsor error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('Supabase delete sponsor exception:', err)
    return false
  }
}

/**
 * Helper Ambil Data About Profile dari Supabase Database
 */
export async function getAboutProfileFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('about_profile')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.warn('Supabase about_profile fetch warning:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('Supabase fetch about_profile exception:', err)
    return null
  }
}

/**
 * Helper Simpan / Update Data About Profile ke Supabase Database
 */
export async function saveAboutProfileToSupabase(payload) {
  try {
    const { data, error } = await supabase
      .from('about_profile')
      .upsert([{ id: 1, ...payload, updated_at: new Date().toISOString() }])
      .select()

    if (error) {
      console.warn('Supabase save about_profile error:', error.message)
      return null
    }
    return data ? data[0] : null
  } catch (err) {
    console.warn('Supabase save about_profile exception:', err)
    return null
  }
}

/**
 * Helper Ambil Data Activity Logs dari Supabase Database
 */
export async function getActivityLogsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40)

    if (error) {
      console.warn('Supabase activity_logs fetch warning:', error.message)
      return null
    }

    return data || []
  } catch (err) {
    console.warn('Supabase fetch activity_logs exception:', err)
    return null
  }
}

/**
 * Helper Tambah Activity Log Baru ke Supabase Database
 */
export async function addActivityLogToSupabase(logItem) {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([logItem])
      .select()

    if (error) {
      console.warn('Supabase add activity_log error:', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Supabase add activity_log exception:', err)
    return null
  }
}




