import { getActivityLogsFromSupabase, addActivityLogToSupabase } from '../lib/supabase.js'

export const initialActivityLogs = [
  {
    id: 1,
    action_type: 'TAMBAH',
    module_name: 'Galeri',
    title: 'Menambahkan foto galeri dokumentasi wilayah Tanjung Sari',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    action_type: 'EDIT',
    module_name: 'About',
    title: 'Memperbarui deskripsi dan gambar utama Section About',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 3,
    action_type: 'TAMBAH',
    module_name: 'Sponsor',
    title: 'Menambahkan logo mitra kerja Kelurahan Tanjung Sari',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
]

export const getStoredActivityLogs = () => {
  try {
    const data = localStorage.getItem('kkn55_activity_logs')
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Error reading activity logs from localStorage:', e)
  }
  return initialActivityLogs
}

export const saveStoredActivityLogs = (logs) => {
  try {
    localStorage.setItem('kkn55_activity_logs', JSON.stringify(logs))
  } catch (e) {
    console.error('Error saving activity logs to localStorage:', e)
  }
  try {
    window.dispatchEvent(new Event('activityLogsChanged'))
  } catch (e) {
    console.error('Error dispatching activityLogsChanged event:', e)
  }
}

export const fetchActivityLogsWithSupabase = async () => {
  const remoteLogs = await getActivityLogsFromSupabase()
  if (remoteLogs !== null && remoteLogs.length > 0) {
    saveStoredActivityLogs(remoteLogs)
    return remoteLogs
  }
  return getStoredActivityLogs()
}

export const createActivityLog = async (actionType, moduleName, title) => {
  const newLog = {
    action_type: actionType, // 'TAMBAH' | 'EDIT' | 'HAPUS'
    module_name: moduleName, // 'Galeri' | 'Sponsor' | 'About' | 'UMKM'
    title: title,
    created_at: new Date().toISOString(),
  }

  // Sync to Supabase
  await addActivityLogToSupabase(newLog)

  // Sync to LocalStorage
  const currentLogs = getStoredActivityLogs()
  const updatedLogs = [{ id: Date.now(), ...newLog }, ...currentLogs].slice(0, 50)
  saveStoredActivityLogs(updatedLogs)
  return updatedLogs
}

export default initialActivityLogs
