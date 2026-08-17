import { getUmkmFromSupabase } from '../lib/supabase.js'

// Data awal dikosongkan sesuai instruksi pengguna
export const initialUmkmData = []

/**
 * Mengambil data UMKM dari localStorage
 */
export const getStoredUmkmItems = () => {
  try {
    const data = localStorage.getItem('kkn55_umkm_items')
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Error reading umkm from localStorage:', e)
  }
  return initialUmkmData
}

/**
 * Mengambil data UMKM dari Supabase DB dan memperbarui cache lokal
 */
export const fetchUmkmItemsWithSupabase = async () => {
  try {
    const remoteData = await getUmkmFromSupabase()
    if (remoteData !== null && Array.isArray(remoteData)) {
      // Sinkronisasi Penuh DB -> Local Cache & Dispatch Event Pembaruan
      saveStoredUmkmItems(remoteData)
      return remoteData
    }
  } catch (err) {
    console.warn('Fetch UMKM from Supabase exception:', err)
  }
  return getStoredUmkmItems()
}

/**
 * Menyimpan data UMKM ke localStorage dan men-trigger event pembaruan real-time
 */
export const saveStoredUmkmItems = (items) => {
  try {
    localStorage.setItem('kkn55_umkm_items', JSON.stringify(items))
  } catch (e) {
    console.error('Error saving umkm to localStorage:', e)
  }
  try {
    window.dispatchEvent(new Event('umkmDataChanged'))
  } catch (e) {
    console.error('Error dispatching umkmDataChanged event:', e)
  }
}


export default initialUmkmData
