import { getAboutProfileFromSupabase } from '../lib/supabase.js'

export const initialAboutProfile = {
  id: 1,
  title: 'Tentang Tanjung Sari',
  description:
    'Kelurahan Tanjung Sari merupakan salah satu kelurahan yang terletak di Kecamatan Belakang Padang, Kota Batam, Kepulauan Riau. Wilayah ini memiliki keindahan alam laut yang mempesona serta masyarakat yang ramah dan menjunjung tinggi nilai-nilai budaya dan gotong royong.',
  image: '/assets/images/hero-belakang-padang.jpg',
}

export const getStoredAboutProfile = () => {
  try {
    const data = localStorage.getItem('kkn55_about_profile')
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Error reading about profile from localStorage', e)
  }
  return initialAboutProfile
}

export const fetchAboutProfileWithSupabase = async () => {
  const remoteData = await getAboutProfileFromSupabase()
  if (remoteData) {
    saveStoredAboutProfile(remoteData)
    return remoteData
  }
  return getStoredAboutProfile()
}

export const saveStoredAboutProfile = (data) => {
  try {
    localStorage.setItem('kkn55_about_profile', JSON.stringify(data))
  } catch (e) {
    console.error('Error saving about profile to localStorage:', e)
  }
  try {
    window.dispatchEvent(new Event('aboutProfileDataChanged'))
  } catch (e) {
    console.error('Error dispatching aboutProfileDataChanged event:', e)
  }
}

const profileData = {
  image: '/assets/images/tanjung-sari.jpg',
  overview:
    'Kelurahan Tanjung Sari merupakan salah satu wilayah di Kecamatan Belakang Padang, Kota Batam. Berada di kawasan kepulauan, Tanjung Sari memiliki karakter masyarakat pesisir serta berbagai potensi lokal yang menarik untuk dikenal dan dikembangkan.',
  cards: [
    {
      id: 'location',
      icon: 'MapPin',
      title: 'Lokasi',
      description: 'Belakang Padang, Kota Batam',
    },
    {
      id: 'coast',
      icon: 'Waves',
      title: 'Wilayah Pesisir',
      description: 'Memiliki karakter kehidupan masyarakat kepulauan',
    },
    {
      id: 'local',
      icon: 'Store',
      title: 'Potensi Lokal',
      description: 'UMKM dan usaha masyarakat setempat',
    },
  ],
}

export default profileData

