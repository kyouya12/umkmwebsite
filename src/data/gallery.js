import {
  getGalleryFromSupabase,
} from '../lib/supabase.js'

export const initialGalleryItems = [
  {
    id: 1,
    title: 'Panorama Pesisir Belakang Padang',
    category: 'Panorama Alam',
    image: '/assets/images/hero-belakang-padang.jpg',
  },
  {
    id: 2,
    title: 'Pemandangan Bahari Belakang Padang',
    category: 'Pesisir Pantai',
    image: '/assets/images/hero-belakang-padang.jpg',
  },
  {
    id: 3,
    title: 'Keindahan Alam Tanjung Sari',
    category: 'Wilayah Pesisir',
    image: '/assets/images/hero-belakang-padang.jpg',
  },
  {
    id: 4,
    title: 'Suasana Alam Pesisir Belakang Padang',
    category: 'Keindahan Alam',
    image: '/assets/images/hero-belakang-padang.jpg',
  },
  {
    id: 5,
    title: 'Dokumentasi Wilayah Tanjung Sari',
    category: 'Dokumentasi KKN',
    image: '/assets/images/hero-belakang-padang.jpg',
  },
  {
    id: 6,
    title: 'Lanskap Bahari Tanjung Sari',
    category: 'Wisata Bahari',
    image: '/assets/images/hero-belakang-padang.jpg',
  },
]

export const getStoredGalleryItems = () => {
  try {
    const data = localStorage.getItem('kkn55_gallery_items')
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Error reading gallery from localStorage', e)
  }
  return initialGalleryItems
}

export const fetchGalleryItemsWithSupabase = async () => {
  const remoteData = await getGalleryFromSupabase()
  if (remoteData !== null) {
    saveStoredGalleryItems(remoteData)
    return remoteData
  }
  return getStoredGalleryItems()
}

export const saveStoredGalleryItems = (items) => {
  try {
    localStorage.setItem('kkn55_gallery_items', JSON.stringify(items))
  } catch (e) {
    console.error('Error saving gallery to localStorage:', e)
  }
  try {
    window.dispatchEvent(new Event('galleryDataChanged'))
  } catch (e) {
    console.error('Error dispatching galleryDataChanged event:', e)
  }
}

export default initialGalleryItems
