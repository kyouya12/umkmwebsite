import { getSponsorsFromSupabase } from '../lib/supabase.js'

export const initialSponsors = [
  { id: 1, name: 'Universitas Maritim Raja Ali Haji (UMRAH)', image: '/assets/images/logo-kkn55.png' },
  { id: 2, name: 'Pemerintah Kelurahan Tanjung Sari', image: '/assets/images/logo-kkn55.png' },
  { id: 3, name: 'Yayasan Amal Dapur 12 Batam', image: '/assets/images/logo-yayasan-amal.png' },
]

export const getStoredSponsors = () => {
  try {
    const data = localStorage.getItem('kkn55_sponsors_items')
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Error reading sponsors from localStorage', e)
  }
  return initialSponsors
}

export const fetchSponsorsWithSupabase = async () => {
  const remoteData = await getSponsorsFromSupabase()
  if (remoteData !== null && remoteData.length > 0) {
    saveStoredSponsors(remoteData)
    return remoteData
  }
  return getStoredSponsors()
}

export const saveStoredSponsors = (items) => {
  try {
    localStorage.setItem('kkn55_sponsors_items', JSON.stringify(items))
  } catch (e) {
    console.error('Error saving sponsors to localStorage:', e)
  }
  try {
    window.dispatchEvent(new Event('sponsorDataChanged'))
  } catch (e) {
    console.error('Error dispatching sponsorDataChanged event:', e)
  }
}

export default initialSponsors
