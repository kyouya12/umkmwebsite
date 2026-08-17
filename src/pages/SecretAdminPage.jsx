import { useState, useEffect } from 'react'
import {
  LogOut,
  LayoutDashboard,
  Store,
  Image as ImageIcon,
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  X,
  AlertCircle,
  Lock,
  Mail,
  Clock,
  ShieldAlert,
  Upload,
  RotateCcw,
  CheckCircle2,
  Handshake,
  Info,
  Activity,
  History,
  Sparkles,
  FileText,
  Star,
  Check
} from 'lucide-react'
import {
  supabase,
  getGalleryFromSupabase,
  addGalleryToSupabase,
  updateGalleryInSupabase,
  deleteGalleryFromSupabase,
  getSponsorsFromSupabase,
  addSponsorToSupabase,
  updateSponsorInSupabase,
  deleteSponsorFromSupabase,
  getAboutProfileFromSupabase,
  saveAboutProfileToSupabase,
  getUmkmFromSupabase,
  addUmkmToSupabase,
  updateUmkmInSupabase,
  deleteUmkmFromSupabase,
  setHighlightUmkmInSupabase
} from '../lib/supabase.js'
import initialUmkmData, { getStoredUmkmItems, saveStoredUmkmItems, fetchUmkmItemsWithSupabase } from '../data/umkm.js'
import { getStoredGalleryItems, saveStoredGalleryItems, fetchGalleryItemsWithSupabase, initialGalleryItems } from '../data/gallery.js'
import { getStoredSponsors, saveStoredSponsors, fetchSponsorsWithSupabase } from '../data/sponsors.js'
import { getStoredAboutProfile, saveStoredAboutProfile, fetchAboutProfileWithSupabase } from '../data/profile.js'
import { getStoredActivityLogs, fetchActivityLogsWithSupabase, createActivityLog } from '../data/activityLogs.js'


// Helper Kompresi Otomatis Foto (Merubah ukuran & kualitas agar upload super cepat)
const compressImage = (file, maxWidth = 900, quality = 0.75) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(event.target.result)
    }
    reader.onerror = () => resolve(null)
  })
}

// Helper Sanitasi & Deteksi Injeksi Keamanan (SQLi, XSS, CSS/Script Injection)
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return ''
  return str
    .replace(/<[^>]*>?/gm, '') // Hapus tag HTML / CSS / Script (<script>, <style>, <iframe>, dll)
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Hapus event handlers seperti onload=, onclick=, onerror=
    .trim()
}

const containsDangerousPayload = (str) => {
  if (!str) return false
  // Pola payload injeksi berbahaya: SQLi, XSS, CSS Injection, Script tags, dll.
  const dangerousPatterns = [
    /<script/i,
    /<\/script>/i,
    /javascript:/i,
    /<style/i,
    /<\/style>/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /['"]\s*OR\s*['"]?1['"]?\s*=\s*['"]?1/i,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /UPDATE\s+.*SET/i,
    /EXEC\s*\(/i,
    /--/,
    /\/\*/,
    /\*\//,
    /<iframe/i,
    /<img/i,
    /<svg/i,
    /onerror=/i,
    /onload=/i
  ]
  return dangerousPatterns.some((pattern) => pattern.test(str))
}

function SecretAdminPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Keamanan Rate Limiting State (5x salah -> kunci 30 detik)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutTimer, setLockoutTimer] = useState(0)

  // Admin Navigation Tab State
  const [activeTab, setActiveTab] = useState('umkm') // 'dashboard' | 'umkm' | 'gallery' | 'sponsors' | 'about'

  // CRUD UMKM State & Continuous Loading State
  const [umkmItems, setUmkmItems] = useState(getStoredUmkmItems())
  const [loadingUmkm, setLoadingUmkm] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUmkmModal, setShowUmkmModal] = useState(false)
  const [editingUmkmItem, setEditingUmkmItem] = useState(null)
  const [selectedUmkm, setSelectedUmkm] = useState(null)
  const [confirmHighlightModal, setConfirmHighlightModal] = useState(null) // { item, actionType: 'set' | 'remove' }
  const [umkmForm, setUmkmForm] = useState({
    name: '',
    location: 'Tanjung Sari',
    address: '',
    phone: '',
    description: '',
    image: ''
  })


  // CRUD Galeri Foto & 2 Judul State
  const [galleryItems, setGalleryItems] = useState(getStoredGalleryItems())
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [editingGalleryItem, setEditingGalleryItem] = useState(null) // null = Tambah, object = Edit
  const [galleryForm, setGalleryForm] = useState({
    title: '', // Judul 1 (Judul Utama)
    category: '', // Judul 2 (Subjudul / Kategori)
    image: ''
  })
  const [previewGalleryItem, setPreviewGalleryItem] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // CRUD Logo Sponsor State
  const [sponsorsItems, setSponsorsItems] = useState(getStoredSponsors())
  const [showSponsorModal, setShowSponsorModal] = useState(false)
  const [editingSponsorItem, setEditingSponsorItem] = useState(null)
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    image: ''
  })
  const [previewSponsorItem, setPreviewSponsorItem] = useState(null)

  // CRUD Section About State
  const [aboutForm, setAboutForm] = useState(getStoredAboutProfile())
  const [savingAbout, setSavingAbout] = useState(false)

  // Activity Audit Logs State
  const [activityLogs, setActivityLogs] = useState(getStoredActivityLogs())

  // Initial Fetch dari Supabase Database saat Komponen Dimuat
  useEffect(() => {
    async function loadSupabaseData() {
      setLoadingUmkm(true)
      try {
        const umkmDataRes = await fetchUmkmItemsWithSupabase()
        if (umkmDataRes !== null) {
          setUmkmItems(umkmDataRes)
        }
      } catch (err) {
        console.warn('Error fetching UMKM from Supabase:', err)
      } finally {
        setLoadingUmkm(false)
      }

      const galleryData = await fetchGalleryItemsWithSupabase()
      if (galleryData && galleryData.length > 0) {
        setGalleryItems(galleryData)
      }
      const sponsorData = await fetchSponsorsWithSupabase()
      if (sponsorData && sponsorData.length > 0) {
        setSponsorsItems(sponsorData)
      }
      const aboutData = await fetchAboutProfileWithSupabase()
      if (aboutData) {
        setAboutForm(aboutData)
      }
      const logsData = await fetchActivityLogsWithSupabase()
      if (logsData && logsData.length > 0) {
        setActivityLogs(logsData)
      }
    }
    loadSupabaseData()

    const handleUmkmChange = () => {
      setUmkmItems(getStoredUmkmItems())
    }

    const handleLogsChange = () => {
      setActivityLogs(getStoredActivityLogs())
    }

    window.addEventListener('umkmDataChanged', handleUmkmChange)
    window.addEventListener('activityLogsChanged', handleLogsChange)
    return () => {
      window.removeEventListener('umkmDataChanged', handleUmkmChange)
      window.removeEventListener('activityLogsChanged', handleLogsChange)
    }
  }, [])





  // Toast Notification Auto Dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Handlers CRUD UMKM
  const updateUmkmState = (newItems) => {
    setUmkmItems(newItems)
    saveStoredUmkmItems(newItems)
  }

  const handleOpenAddUmkmModal = () => {
    setEditingUmkmItem(null)
    setUmkmForm({
      name: '',
      location: 'Tanjung Sari',
      address: '',
      phone: '',
      description: '',
      image: '',
      productImages: []
    })
    setShowUmkmModal(true)
  }

  const handleOpenEditUmkmModal = (item) => {
    setEditingUmkmItem(item)
    setUmkmForm({
      name: item.name || '',
      location: item.location || 'Tanjung Sari',
      address: item.address || '',
      phone: item.phone || '',
      description: item.description || '',
      image: item.image || '',
      productImages: Array.isArray(item.images) ? item.images.slice(0, 3) : []
    })
    setShowUmkmModal(true)
  }

  const handleSaveUmkmItem = async (e) => {
    e.preventDefault()
    if (!umkmForm.name.trim() || !umkmForm.description.trim()) {
      alert('Nama UMKM dan Deskripsi tidak boleh kosong!')
      return
    }

    const cleanName = sanitizeInput(umkmForm.name)
    const cleanLocation = sanitizeInput(umkmForm.location) || 'Tanjung Sari'
    const cleanAddress = sanitizeInput(umkmForm.address)
    const cleanPhone = sanitizeInput(umkmForm.phone)
    const cleanDesc = sanitizeInput(umkmForm.description)
    const finalImage = umkmForm.image || '/assets/images/hero-belakang-padang.jpg'
    const finalProductImages = (umkmForm.productImages || []).slice(0, 3)

    try {
      if (editingUmkmItem) {
        const updatedItems = umkmItems.map((item) => {
          if (item.id === editingUmkmItem.id) {
            return {
              ...item,
              name: cleanName,
              location: cleanLocation,
              address: cleanAddress,
              phone: cleanPhone,
              description: cleanDesc,
              image: finalImage,
              images: finalProductImages
            }
          }
          return item
        })

        const payload = {
          name: cleanName,
          location: cleanLocation,
          address: cleanAddress,
          phone: cleanPhone,
          description: cleanDesc,
          image: finalImage,
          images: finalProductImages
        }

        // Optimistic UI update (Langsung Simpan & Tutup Modal Seketika)
        updateUmkmState(updatedItems)
        setShowUmkmModal(false)
        setToastMessage(`Data UMKM "${cleanName}" berhasil diperbarui!`)

        // Asynchronous Background Sync ke Supabase DB & Audit Trail
        updateUmkmInSupabase(editingUmkmItem.id, payload).catch(console.warn)
        createActivityLog('EDIT', 'UMKM', `Memperbarui data UMKM "${cleanName}"`).catch(console.warn)
      } else {
        const newItem = {
          id: Date.now(),
          name: cleanName,
          location: cleanLocation,
          address: cleanAddress,
          phone: cleanPhone,
          description: cleanDesc,
          image: finalImage,
          images: finalProductImages,
          featured: false
        }

        const updatedItems = [newItem, ...umkmItems]

        // Optimistic UI update (Langsung Simpan & Tutup Modal Seketika)
        updateUmkmState(updatedItems)
        setShowUmkmModal(false)
        setToastMessage(`UMKM Baru "${cleanName}" berhasil ditambahkan!`)

        // Asynchronous Background Sync ke Supabase DB & Audit Trail
        addUmkmToSupabase(newItem).catch(console.warn)
        createActivityLog('TAMBAH', 'UMKM', `Menambahkan UMKM baru "${cleanName}"`).catch(console.warn)
      }
    } catch (err) {
      console.error('Error saving UMKM:', err)
      alert('Gagal menyimpan data UMKM. Silakan coba lagi.')
    }
  }

  const handleDeleteUmkmItem = async (id) => {
    const targetItem = umkmItems.find((i) => i.id === id)
    if (window.confirm(`Apakah Anda yakin ingin menghapus data UMKM "${targetItem?.name || 'ini'}"?`)) {
      const updated = umkmItems.filter((i) => i.id !== id)

      if (targetItem?.featured && updated.length > 0) {
        updated[0].featured = true
        setHighlightUmkmInSupabase(updated[0].id).catch(console.warn)
      }

      updateUmkmState(updated)
      setToastMessage(`UMKM "${targetItem?.name || 'tersebut'}" berhasil dihapus!`)

      deleteUmkmFromSupabase(id).catch(console.warn)
      createActivityLog('HAPUS', 'UMKM', `Menghapus UMKM "${targetItem?.name || 'ID #' + id}"`).catch(console.warn)
    }
  }

  // Permintaan pergantian highlight dengan modal konfirmasi
  const handleRequestHighlightChange = (item, actionType) => {
    setConfirmHighlightModal({ item, actionType })
  }

  // Eksekusi perubahan highlight setelah dikonfirmasi admin
  const handleConfirmHighlightAction = async () => {
    if (!confirmHighlightModal) return
    const { item, actionType } = confirmHighlightModal

    try {
      if (actionType === 'set') {
        const updated = umkmItems.map((u) => ({
          ...u,
          featured: u.id === item.id
        }))

        updateUmkmState(updated)
        setToastMessage(`"${item.name}" berhasil dijadikan Highlight Utama Beranda!`)

        setHighlightUmkmInSupabase(item.id).catch(console.warn)
        createActivityLog('HIGHLIGHT', 'UMKM', `Menjadikan UMKM "${item.name}" sebagai Highlight Utama Beranda`).catch(console.warn)
      } else if (actionType === 'remove') {
        const updated = umkmItems.map((u) => ({
          ...u,
          featured: u.id === item.id ? false : u.featured
        }))

        updateUmkmState(updated)
        setToastMessage(`Status Highlight Utama untuk "${item.name}" berhasil dibatalkan.`)

        updateUmkmInSupabase(item.id, { featured: false }).catch(console.warn)
        createActivityLog('HIGHLIGHT', 'UMKM', `Membatalkan status Highlight Utama untuk "${item.name}"`).catch(console.warn)
      }
    } catch (err) {
      console.error('Error updating highlight:', err)
      alert('Gagal memperbarui status highlight.')
    } finally {
      setConfirmHighlightModal(null)
    }
  }

  const handleUmkmImageFileUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar! Maksimal 10MB.')
        return
      }
      // Kompresi otomatis gambar agar ukuran dari 5MB berkurang menjadi ~60KB
      const compressedBase64 = await compressImage(file, 900, 0.75)
      if (compressedBase64) {
        setUmkmForm((prev) => ({ ...prev, image: compressedBase64 }))
      }
    }
  }

  // Handler Unggah 3 Foto Produk Terdebest
  const handleAddProductImageFile = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (umkmForm.productImages.length >= 3) {
        alert('Maksimal 3 foto produk terdebest!')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar! Maksimal 10MB.')
        return
      }
      const compressedBase64 = await compressImage(file, 900, 0.75)
      if (compressedBase64) {
        setUmkmForm((prev) => ({
          ...prev,
          productImages: [...prev.productImages, compressedBase64]
        }))
      }
      e.target.value = ''
    }
  }

  const handleRemoveProductImage = (index) => {
    setUmkmForm((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }))
  }




  // Sync Gallery State dengan localStorage & Realtime Events
  const updateGalleryState = (newItems) => {
    setGalleryItems(newItems)
    saveStoredGalleryItems(newItems)
  }

  // Handlers CRUD Galeri
  const handleOpenAddGalleryModal = () => {
    setEditingGalleryItem(null)
    setGalleryForm({ title: '', category: '', image: '' })
    setShowGalleryModal(true)
  }

  const handleOpenEditGalleryModal = (item) => {
    setEditingGalleryItem(item)
    setGalleryForm({
      title: item.title || '',
      category: item.category || '',
      image: item.image || ''
    })
    setShowGalleryModal(true)
  }

  const handleSaveGalleryItem = async (e) => {
    e.preventDefault()
    if (!galleryForm.title.trim() || !galleryForm.category.trim()) {
      alert('Judul 1 (Judul Utama) dan Judul 2 (Subjudul / Kategori) harus diisi!')
      return
    }

    if (!galleryForm.image) {
      alert('Wajib mengunggah file foto galeri terlebih dahulu!')
      return
    }

    const finalImage = galleryForm.image

    try {
      if (editingGalleryItem) {
        // Mode Edit (Sync Supabase DB + Local)
        const updatedPayload = {
          title: sanitizeInput(galleryForm.title),
          category: sanitizeInput(galleryForm.category),
          image: finalImage
        }

        await updateGalleryInSupabase(editingGalleryItem.id, updatedPayload)

        const updated = galleryItems.map((item) =>
          item.id === editingGalleryItem.id
            ? { ...item, ...updatedPayload }
            : item
        )
        updateGalleryState(updated)
        await createActivityLog('EDIT', 'Galeri', `Memperbarui foto galeri "${updatedPayload.title}"`)
        setToastMessage('Foto & 2 Judul Galeri berhasil diperbarui!')
      } else {
        // Mode Tambah (Sync Supabase DB + Local)
        const newItem = {
          id: Date.now(),
          title: sanitizeInput(galleryForm.title),
          category: sanitizeInput(galleryForm.category),
          image: finalImage
        }

        await addGalleryToSupabase(newItem)

        const updated = [newItem, ...galleryItems]
        updateGalleryState(updated)
        await createActivityLog('TAMBAH', 'Galeri', `Menambahkan foto galeri "${newItem.title}"`)
        setToastMessage('Foto & 2 Judul Galeri baru berhasil ditambahkan!')
      }

      setShowGalleryModal(false)
    } catch (err) {
      console.error('Error saving gallery item:', err)
      alert('Gagal menyimpan foto galeri. Silakan coba lagi.')
    }
  }

  const handleDeleteGalleryItem = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus foto galeri ini?')) {
      const deletedItem = galleryItems.find((i) => i.id === id)
      await deleteGalleryFromSupabase(id)
      const updated = galleryItems.filter((item) => item.id !== id)
      updateGalleryState(updated)
      await createActivityLog('HAPUS', 'Galeri', `Menghapus foto galeri "${deletedItem?.title || 'ID #' + id}"`)
      setToastMessage('Foto galeri berhasil dihapus (Diperbarui di Cloud Supabase & Lokal)!')
    }
  }

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar! Maksimal 5MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setGalleryForm((prev) => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Handlers CRUD Logo Sponsor
  const updateSponsorsState = (newItems) => {
    setSponsorsItems(newItems)
    saveStoredSponsors(newItems)
  }

  const handleOpenAddSponsorModal = () => {
    setEditingSponsorItem(null)
    setSponsorForm({ name: '', image: '' })
    setShowSponsorModal(true)
  }

  const handleOpenEditSponsorModal = (item) => {
    setEditingSponsorItem(item)
    setSponsorForm({
      name: item.name || item.alt || '',
      image: item.image || item.src || ''
    })
    setShowSponsorModal(true)
  }

  const handleSaveSponsorItem = async (e) => {
    e.preventDefault()
    if (!sponsorForm.image) {
      alert('Wajib mengunggah file logo sponsor terlebih dahulu!')
      return
    }

    const cleanName = sanitizeInput(sponsorForm.name)
    const finalImage = sponsorForm.image

    try {
      if (editingSponsorItem) {
        // Mode Edit (Sync Supabase DB + Local)
        const updatedPayload = {
          name: cleanName,
          image: finalImage
        }

        await updateSponsorInSupabase(editingSponsorItem.id, updatedPayload)

        const updated = sponsorsItems.map((item) =>
          item.id === editingSponsorItem.id
            ? { ...item, ...updatedPayload }
            : item
        )
        updateSponsorsState(updated)
        await createActivityLog('EDIT', 'Sponsor', `Memperbarui logo sponsor "${cleanName || 'Sponsor'}"`)
        setToastMessage('Logo Sponsor berhasil diperbarui!')
      } else {
        // Mode Tambah (Sync Supabase DB + Local)
        const newItem = {
          id: Date.now(),
          name: cleanName,
          image: finalImage
        }

        await addSponsorToSupabase(newItem)

        const updated = [newItem, ...sponsorsItems]
        updateSponsorsState(updated)
        await createActivityLog('TAMBAH', 'Sponsor', `Menambahkan logo sponsor baru "${cleanName || 'Sponsor Baru'}"`)
        setToastMessage('Logo Sponsor baru berhasil ditambahkan!')
      }

      setShowSponsorModal(false)
    } catch (err) {
      console.error('Error saving sponsor item:', err)
      alert('Gagal menyimpan logo sponsor. Silakan coba lagi.')
    }
  }

  const handleDeleteSponsorItem = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus logo sponsor ini?')) {
      const deletedItem = sponsorsItems.find((s) => s.id === id)
      await deleteSponsorFromSupabase(id)
      const updated = sponsorsItems.filter((item) => item.id !== id)
      updateSponsorsState(updated)
      await createActivityLog('HAPUS', 'Sponsor', `Menghapus logo sponsor "${deletedItem?.name || deletedItem?.alt || 'ID #' + id}"`)
      setToastMessage('Logo sponsor berhasil dihapus!')
    }
  }

  const handleSponsorImageFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file logo terlalu besar! Maksimal 5MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setSponsorForm((prev) => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Handlers CRUD Section About
  const handleSaveAboutProfile = async (e) => {
    e.preventDefault()
    if (!aboutForm.title.trim() || !aboutForm.description.trim()) {
      alert('Judul Besar dan Deskripsi tidak boleh kosong!')
      return
    }

    if (!aboutForm.image) {
      alert('Wajib mengunggah file foto/gambar terlebih dahulu!')
      return
    }

    setSavingAbout(true)
    const payload = {
      title: sanitizeInput(aboutForm.title),
      description: sanitizeInput(aboutForm.description),
      image: aboutForm.image
    }

    try {
      await saveAboutProfileToSupabase(payload)
      saveStoredAboutProfile(payload)
      await createActivityLog('EDIT', 'About', `Memperbarui Section About "${payload.title}"`)
      setToastMessage('Data Section About berhasil disimpan & diperbarui!')
    } catch (err) {
      console.error('Error saving about profile:', err)
      alert('Gagal menyimpan data Section About. Silakan coba lagi.')
    } finally {
      setSavingAbout(false)
    }
  }

  const handleAboutImageFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar! Maksimal 5MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAboutForm((prev) => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }



  // Check existing session token on mount
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAuthenticated(true)
      } else {
        const sessionToken = sessionStorage.getItem('admin_session_token')
        if (sessionToken === 'authenticated_kkn55_token') {
          setIsAuthenticated(true)
        }
      }
    }
    checkSession()
  }, [])

  // Timer Countdown Effect untuk Keamanan 30 Detik
  useEffect(() => {
    let timer
    if (lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0)
            setErrorMessage('')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [lockoutTimer])

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (lockoutTimer > 0) {
      return
    }

    // 1. Perlindungan Anti-Injeksi: Deteksi Payload Berbahaya (SQLi, XSS, CSS, Script)
    if (containsDangerousPayload(email) || containsDangerousPayload(password)) {
      const nextAttempts = failedAttempts + 1
      setFailedAttempts(nextAttempts)

      if (nextAttempts >= 5) {
        setLockoutTimer(30)
        setErrorMessage('Sistem Terkunci! Terdeteksi percobaan aktivasi skrip/injeksi terlarang sebanyak 5 kali.')
      } else {
        setErrorMessage(`Keamanan Ditingkatkan: Input terdeteksi mengandung skrip/payload berbahaya yang dilarang! (${nextAttempts}/5)`)
      }
      return
    }

    // 2. Sanitasi Input (Membersihkan tag HTML/CSS & whitespace)
    const cleanEmail = sanitizeInput(email)
    const cleanPassword = password.trim()

    // 3. Validasi Format Email
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      setErrorMessage("Format email tidak valid! Email harus mengandung karakter '@'.")
      return
    }

    setLoading(true)

    try {
      // Coba Autentikasi dengan Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (data?.session) {
        setIsAuthenticated(true)
        setFailedAttempts(0)
        setLockoutTimer(0)
        setLoading(false)
        return
      }

      // Fallback Kredensial Lokal Admin (Email dengan '@' & password valid)
      const validPasswords = ['admin', 'kkn55tanjungsari']
      if (validPasswords.includes(cleanPassword)) {
        sessionStorage.setItem('admin_session_token', 'authenticated_kkn55_token')
        setIsAuthenticated(true)
        setFailedAttempts(0)
        setLockoutTimer(0)
      } else {
        throw new Error('Email atau Password salah!')
      }
    } catch (err) {
      const nextAttempts = failedAttempts + 1
      setFailedAttempts(nextAttempts)

      if (nextAttempts >= 5) {
        setLockoutTimer(30)
        setErrorMessage('Sistem Terkunci! Anda telah salah memasukkan password sebanyak 5 kali. Silakan tunggu 30 detik.')
      } else {
        const remaining = 5 - nextAttempts
        setErrorMessage(`Email atau Password salah! (Percobaan ${nextAttempts}/5 — sisa ${remaining}x kesempatan)`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem('admin_session_token')
    setIsAuthenticated(false)
    setEmail('')
    setPassword('')
    setFailedAttempts(0)
    setLockoutTimer(0)
  }

  // Filter UMKM for CRUD table
  const filteredUmkm = umkmItems.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })



  return (
    <div className="admin-app-layout">
      {!isAuthenticated ? (
        /* SIMPLE LOGIN FORM VIEW */
        <div className="admin-page-wrapper">
          <div className="admin-container">
            {/* Tombol kembali ke beranda dihapus sesuai permintaan */}
            <div className="admin-card admin-login-card admin-animate-in">
              <div className="admin-login-header">
                <div className="admin-lock-icon-wrapper">
                  <Lock size={28} color="#c5a04a" />
                </div>
                <h1 className="admin-title">Login Admin</h1>
                <p className="admin-subtitle">
                  Portal Sistem Manajemen UMKM Tanjung Sari, Belakang Padang
                </p>
              </div>

              {/* Status Terkunci 30 Detik (5x Salah) */}
              {lockoutTimer > 0 ? (
                <div className="admin-alert admin-alert--error" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5' }}>
                  <ShieldAlert size={26} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px', color: '#ffffff' }}>Sistem Terkunci (5x Salah)</strong>
                    <span style={{ fontSize: '0.88rem' }}>
                      Silakan tunggu <strong style={{ color: '#fca5a5', textDecoration: 'underline' }}>{lockoutTimer} detik</strong> sebelum mencoba lagi.
                    </span>
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="admin-alert admin-alert--error">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <form onSubmit={handleLogin} className="admin-form">
                <div className="admin-form-group">
                  <label className="admin-label">Email Admin</label>
                  <div className="admin-input-wrapper">
                    <Mail size={18} className="admin-input-icon" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                      placeholder="Masukkan email"
                      required
                      maxLength={100}
                      autoComplete="off"
                      disabled={loading || lockoutTimer > 0}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Password</label>
                  <div className="admin-input-wrapper">
                    <Lock size={18} className="admin-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      required
                      disabled={loading || lockoutTimer > 0}
                      className="admin-input"
                      style={{ paddingRight: '2.8rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="admin-toggle-pwd-btn"
                      title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      disabled={lockoutTimer > 0}
                      style={{
                        position: 'absolute',
                        right: '0.85rem',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: lockoutTimer > 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || lockoutTimer > 0}
                  className="button button--primary admin-submit-btn"
                  style={{
                    opacity: lockoutTimer > 0 ? 0.6 : 1,
                    cursor: lockoutTimer > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading
                    ? 'Memproses...'
                    : lockoutTimer > 0
                      ? `Terkunci (${lockoutTimer}s)`
                      : 'Masuk'}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD WITH LEFT SIDEBAR, TOP HEADER, AND CENTER/RIGHT CRUD INTERFACE */
        <div className="admin-dashboard-layout admin-animate-in">
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="admin-sidebar">
            <div className="admin-sidebar-brand">
              <img src="/assets/images/logo-kkn55.png" alt="Logo KKN 55" className="admin-sidebar-logo" />
              <div>
                <h2 className="admin-sidebar-title">KKN 55 Admin</h2>
                <span className="admin-sidebar-sub">Kelurahan Tanjung Sari</span>
              </div>
            </div>

            <nav className="admin-sidebar-menu">
              <button
                className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard Overview</span>
              </button>

              <button
                className={`admin-menu-item ${activeTab === 'umkm' ? 'active' : ''}`}
                onClick={() => setActiveTab('umkm')}
              >
                <Store size={20} />
                <span>Kelola UMKM (CRUD)</span>
              </button>

              <button
                className={`admin-menu-item ${activeTab === 'gallery' ? 'active' : ''}`}
                onClick={() => setActiveTab('gallery')}
              >
                <ImageIcon size={20} />
                <span>Galeri Dokumentasi</span>
              </button>

              <button
                className={`admin-menu-item ${activeTab === 'sponsors' ? 'active' : ''}`}
                onClick={() => setActiveTab('sponsors')}
              >
                <Handshake size={20} />
                <span>Kelola Sponsor</span>
              </button>

              <button
                className={`admin-menu-item ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                <Info size={20} />
                <span>Kelola About</span>
              </button>
            </nav>

            <div className="admin-sidebar-footer">
              <div className="admin-status-indicator">
                <span className="status-dot"></span>
                <span>Supabase Connected</span>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN AREA (TOP HEADER & CONTENT) */}
          <div className="admin-main-area">
            {/* TOP HEADER WITH ACCOUNT NAME & LOGOUT */}
            <header className="admin-top-header">
              <div className="admin-header-title">
                <h1>
                  {activeTab === 'umkm'
                    ? 'Kelola Data UMKM'
                    : activeTab === 'dashboard'
                    ? 'Dashboard Utama'
                    : activeTab === 'gallery'
                    ? 'Dokumentasi Galeri'
                    : activeTab === 'sponsors'
                    ? 'Kelola Logo Sponsor'
                    : 'Kelola Section About'}
                </h1>
                <span className="admin-header-subtitle">Portal Admin Tanjung Sari, Belakang Padang</span>
              </div>


              <div className="admin-header-user">
                <div className="admin-user-profile">
                  <div className="admin-avatar">
                    <UserCheck size={20} color="#0b2d55" />
                  </div>
                  <div className="admin-user-info">
                    <span className="admin-user-name">Admin KKN 55</span>
                    <span className="admin-user-role">Super Administrator</span>
                  </div>
                </div>

                <button onClick={handleLogout} className="button button--secondary button--with-icon admin-logout-btn">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </header>

            {/* CENTER & RIGHT CONTENT BODY */}
            <main className="admin-content-body">
              {/* TAB 1: KELOLA UMKM (CRUD INTERFACE REAL) */}
              {activeTab === 'umkm' && (
                <div className="admin-crud-container">
                  {/* CRUD TOOLBAR */}
                  <div className="admin-crud-toolbar">
                    <div className="admin-search-box" style={{ flex: 1 }}>
                      <Search size={18} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Cari nama UMKM atau deskripsi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-crud-search"
                      />
                    </div>

                    <div className="admin-crud-actions">
                      <button
                        className="button button--primary button--with-icon"
                        onClick={handleOpenAddUmkmModal}
                      >
                        <Plus size={18} /> Tambah UMKM Baru
                      </button>
                    </div>
                  </div>

                  {/* CRUD DATA TABLE & LOADING / EMPTY STATES */}
                  {loadingUmkm ? (
                    <div className="loading-spinner-container">
                      <div className="loading-spinner"></div>
                      <span className="loading-text">Memuat data UMKM dari Supabase Database...</span>
                    </div>
                  ) : filteredUmkm.length > 0 ? (
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Foto</th>
                            <th>Nama & Kontak UMKM</th>
                            <th>Alamat / Lokasi</th>
                            <th>Status Highlight</th>
                            <th style={{ textAlign: 'center' }}>Aksi (CRUD & Highlight)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUmkm.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <img
                                  src={item.image || '/assets/images/tanjung-sari.jpg'}
                                  alt={item.name}
                                  className="admin-table-img"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = '/assets/images/tanjung-sari.jpg'
                                  }}
                                />
                              </td>
                              <td>
                                <strong className="admin-item-title">{item.name}</strong>
                                {item.phone && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Telp: {item.phone}</div>}
                                <p className="admin-item-desc">{item.description ? item.description.substring(0, 55) + '...' : ''}</p>
                              </td>
                              <td>{item.address || item.location || 'Tanjung Sari'}</td>
                              <td>
                                {item.featured ? (
                                  <span className="admin-status-badge featured" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Check size={14} /> Highlight Utama ✓
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Biasa</span>
                                )}
                              </td>
                              <td>
                                <div className="admin-action-buttons">
                                  <button
                                    className="admin-action-btn admin-action-btn--view"
                                    title="Lihat Detail UMKM"
                                    onClick={() => setSelectedUmkm(item)}
                                  >
                                    <Eye size={16} />
                                  </button>

                                  {item.featured ? (
                                    <button
                                      className="admin-action-btn admin-action-btn--star active"
                                      style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #16a34a', width: 'auto', padding: '0 0.65rem', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '600' }}
                                      title="Klik untuk membatalkan Highlight Beranda"
                                      onClick={() => handleRequestHighlightChange(item, 'remove')}
                                    >
                                      <Check size={15} /> Highlighted ✓
                                    </button>
                                  ) : (
                                    <button
                                      className="admin-action-btn admin-action-btn--star"
                                      style={{ width: 'auto', padding: '0 0.65rem', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '600' }}
                                      title="Pilih Sebagai Highlight Beranda Utama"
                                      onClick={() => handleRequestHighlightChange(item, 'set')}
                                    >
                                      <Star size={15} /> Set Highlight
                                    </button>
                                  )}

                                  <button
                                    className="admin-action-btn admin-action-btn--edit"
                                    title="Edit Data UMKM"
                                    onClick={() => handleOpenEditUmkmModal(item)}
                                  >
                                    <Edit2 size={16} />
                                  </button>

                                  <button
                                    className="admin-action-btn admin-action-btn--delete"
                                    title="Hapus Data UMKM"
                                    onClick={() => handleDeleteUmkmItem(item.id)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state-box">
                      <div className="empty-state-box__icon">
                        <Store size={30} />
                      </div>
                      <h3 className="empty-state-box__title">Belum Ada Data UMKM</h3>
                      <p className="empty-state-box__desc">
                        Daftar UMKM saat ini masih kosong. Silakan gunakan tombol &quot;Tambah UMKM Baru&quot; di bagian atas toolbar untuk mendaftarkan usaha lokal.
                      </p>
                    </div>
                  )}
                </div>
              )}


              {/* TAB 2: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="admin-overview-container" style={{ display: 'grid', gap: '2rem' }}>
                  {/* STATISTIK OVERVIEW GRID */}
                  <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                      <div className="admin-stat-icon">
                        <Store size={24} color="#c5a04a" />
                      </div>
                      <div>
                        <div className="admin-stat-value">{umkmItems.length} Usaha</div>
                        <div className="admin-stat-label">Total UMKM Terdaftar</div>
                      </div>
                    </div>


                    <div className="admin-stat-card">
                      <div className="admin-stat-icon">
                        <ImageIcon size={24} color="#3B82F6" />
                      </div>
                      <div>
                        <div className="admin-stat-value">{galleryItems.length} Foto</div>
                        <div className="admin-stat-label">Dokumentasi Galeri</div>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon">
                        <Handshake size={24} color="#10B981" />
                      </div>
                      <div>
                        <div className="admin-stat-value">{sponsorsItems.length} Sponsor</div>
                        <div className="admin-stat-label">Mitra & Logo Sponsor</div>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon">
                        <Activity size={24} color="#8B5CF6" />
                      </div>
                      <div>
                        <div className="admin-stat-value">{activityLogs.length} Log</div>
                        <div className="admin-stat-label">Riwayat Aktivitas Admin</div>
                      </div>
                    </div>
                  </div>

                  {/* LOG AKTIVITAS PERUBAHAN & INPUT TERBARU */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(11, 45, 85, 0.12)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)', padding: '1.75rem', display: 'grid', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid rgba(197, 160, 74, 0.3)', paddingBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Activity size={22} color="#0b2d55" />
                        <h3 style={{ fontSize: '1.2rem', color: '#0b2d55', margin: 0, fontWeight: '700' }}>
                          Log Aktivitas Perubahan & Input Terbaru
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#64748b', background: 'rgba(11, 45, 85, 0.06)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                        Real-time Audit Trail
                      </span>
                    </div>

                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Tipe Aksi</th>
                            <th>Modul Halaman</th>
                            <th>Keterangan Aktivitas / Perubahan</th>
                            <th>Tanggal & Waktu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityLogs.length > 0 ? (
                            activityLogs.map((log, idx) => {
                              const actionBadgeStyle =
                                log.action_type === 'TAMBAH'
                                  ? { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }
                                  : log.action_type === 'EDIT'
                                  ? { background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }
                                  : { background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }

                              return (
                                <tr key={log.id || idx}>
                                  <td>
                                    <span className="admin-tag-category" style={actionBadgeStyle}>
                                      {log.action_type}
                                    </span>
                                  </td>
                                  <td>
                                    <strong style={{ fontSize: '0.9rem', color: '#0b2d55' }}>
                                      {log.module_name}
                                    </strong>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '0.93rem', color: '#334155' }}>
                                      {log.title}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem' }}>
                                      <Clock size={14} color="#64748b" />
                                      <span>
                                        {new Date(log.created_at).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}{' '}
                                        - {new Date(log.created_at).toLocaleTimeString('id-ID', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })} WIB
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                Belum ada riwayat aktivitas perubahan tercatat.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KELOLA GALERI FOTO & 2 JUDUL (FULL CRUD SYSTEM) */}
              {activeTab === 'gallery' && (
                <div className="admin-crud-container">
                  {/* TOOLBAR GALERI */}
                  <div className="admin-crud-toolbar" style={{ justifyContent: 'flex-start', marginBottom: '1.25rem' }}>
                    <button
                      className="button button--primary button--with-icon"
                      onClick={handleOpenAddGalleryModal}
                    >
                      <Plus size={18} /> Tambah Foto Galeri Baru
                    </button>
                  </div>

                  {/* TABEL DATA GALERI FOTO & 2 JUDUL */}
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Foto</th>
                          <th>Judul 1 (Judul Utama)</th>
                          <th>Judul 2 (Subjudul / Kategori)</th>
                          <th style={{ textAlign: 'center' }}>Aksi (CRUD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {galleryItems.length > 0 ? (
                          galleryItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="admin-table-img"
                                  style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover' }}
                                />
                              </td>
                              <td>
                                <strong className="admin-item-title" style={{ fontSize: '0.96rem' }}>{item.title}</strong>
                              </td>
                              <td>
                                <span className="admin-tag-category" style={{ background: 'rgba(197, 160, 74, 0.15)', color: '#c5a04a', border: '1px solid rgba(197, 160, 74, 0.3)' }}>
                                  {item.category}
                                </span>
                              </td>
                              <td>
                                <div className="admin-action-buttons">
                                  <button
                                    className="admin-action-btn admin-action-btn--view"
                                    title="Lihat Detail Foto"
                                    onClick={() => setPreviewGalleryItem(item)}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    className="admin-action-btn admin-action-btn--edit"
                                    title="Edit Foto & 2 Judul"
                                    onClick={() => handleOpenEditGalleryModal(item)}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    className="admin-action-btn admin-action-btn--delete"
                                    title="Hapus Foto Galeri"
                                    onClick={() => handleDeleteGalleryItem(item.id)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                              Data foto galeri kosong. Klik <strong>"Tambah Foto Galeri Baru"</strong> untuk mengunggah foto.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: KELOLA LOGO SPONSOR (FULL CRUD SYSTEM) */}
              {activeTab === 'sponsors' && (
                <div className="admin-crud-container">
                  {/* TOOLBAR SPONSOR */}
                  <div className="admin-crud-toolbar" style={{ justifyContent: 'flex-start', marginBottom: '1.25rem' }}>
                    <button
                      className="button button--primary button--with-icon"
                      onClick={handleOpenAddSponsorModal}
                    >
                      <Plus size={18} /> Tambah Logo Sponsor Baru
                    </button>
                  </div>

                  {/* TABEL DATA SPONSOR */}
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Logo Sponsor</th>
                          <th>Nama / Instansi Sponsor</th>
                          <th style={{ textAlign: 'center' }}>Aksi (CRUD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sponsorsItems.length > 0 ? (
                          sponsorsItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div
                                  style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    border: '1.5px solid rgba(11, 45, 85, 0.15)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#ffffff',
                                    padding: '3px'
                                  }}
                                >
                                  <img
                                    src={item.image || item.src}
                                    alt={item.name || item.alt || 'Sponsor'}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                </div>
                              </td>
                              <td>
                                <strong className="admin-item-title" style={{ fontSize: '0.96rem' }}>
                                  {item.name || item.alt || 'Logo Sponsor'}
                                </strong>
                              </td>
                              <td>
                                <div className="admin-action-buttons">
                                  <button
                                    className="admin-action-btn admin-action-btn--view"
                                    title="Lihat Pratinjau Sponsor"
                                    onClick={() => setPreviewSponsorItem(item)}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    className="admin-action-btn admin-action-btn--edit"
                                    title="Edit Logo Sponsor"
                                    onClick={() => handleOpenEditSponsorModal(item)}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    className="admin-action-btn admin-action-btn--delete"
                                    title="Hapus Sponsor"
                                    onClick={() => handleDeleteSponsorItem(item.id)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>
                              Data logo sponsor kosong. Klik <strong>"Tambah Logo Sponsor Baru"</strong> untuk mengunggah gambar logo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: KELOLA SECTION ABOUT (FULL CRUD SYSTEM) */}
              {activeTab === 'about' && (
                <div className="admin-crud-container" style={{ maxWidth: '800px' }}>
                  <form onSubmit={handleSaveAboutProfile} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(11, 45, 85, 0.12)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)', display: 'grid', gap: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', color: '#0b2d55', margin: 0, fontWeight: '700', borderBottom: '2px solid rgba(197, 160, 74, 0.3)', paddingBottom: '0.75rem' }}>
                        Kelola Tampilan Section About
                      </h3>

                      {/* INPUT JUDUL BESAR */}
                      <div className="admin-form-group">
                        <label className="admin-label" style={{ fontWeight: '600', color: '#0b2d55' }}>
                          Judul Besar Section About *
                        </label>
                        <input
                          type="text"
                          value={aboutForm.title || ''}
                          onChange={(e) => setAboutForm((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="contoh: Tentang Tanjung Sari"
                          required
                          className="admin-input admin-input--simple"
                        />
                      </div>

                      {/* INPUT DESKRIPSI */}
                      <div className="admin-form-group">
                        <label className="admin-label" style={{ fontWeight: '600', color: '#0b2d55' }}>
                          Deskripsi Section About *
                        </label>
                        <textarea
                          value={aboutForm.description || ''}
                          onChange={(e) => setAboutForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Tuliskan gambaran singkat / profil wilayah Tanjung Sari..."
                          rows={5}
                          required
                          className="admin-input admin-input--simple"
                          style={{ resize: 'vertical', lineHeight: '1.6' }}
                        />
                      </div>

                      {/* INPUT UNGGAH FOTO GAMBAR ABOUT */}
                      <div className="admin-form-group">
                        <label className="admin-label" style={{ fontWeight: '600', color: '#0b2d55' }}>
                          Foto / Gambar Utama Section About *
                        </label>

                        {aboutForm.image ? (
                          <div style={{ marginBottom: '0.75rem', position: 'relative' }}>
                            <img
                              src={aboutForm.image}
                              alt="Preview About"
                              style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '14px', border: '1px solid rgba(197, 160, 74, 0.4)' }}
                            />
                            <label
                              className="button button--secondary button--with-icon"
                              style={{ position: 'absolute', bottom: '12px', right: '12px', cursor: 'pointer', background: 'rgba(11, 45, 85, 0.85)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
                            >
                              <Upload size={15} /> Ganti Gambar About
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAboutImageFileUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        ) : (
                          <label
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.75rem',
                              padding: '2.5rem 1.5rem',
                              borderRadius: '14px',
                              border: '2px dashed rgba(197, 160, 74, 0.4)',
                              background: 'rgba(11, 45, 85, 0.04)',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'rgba(197, 160, 74, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Upload size={24} color="#c5a04a" />
                            </div>
                            <div>
                              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0b2d55', display: 'block' }}>
                                Klik untuk mengunggah gambar utama section About
                              </span>
                              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                                Format yang didukung: PNG, JPG, WEBP (Maksimal 5MB)
                              </span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAboutImageFileUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '0.5rem' }}>
                        <button
                          type="submit"
                          disabled={savingAbout}
                          className="button button--primary button--with-icon"
                          style={{ padding: '0.75rem 1.75rem', fontSize: '0.98rem' }}
                        >
                          <CheckCircle2 size={18} />
                          {savingAbout ? 'Memproses...' : 'Simpan Perubahan Section About'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

            </main>
          </div>

          {/* MODAL FORM TAMBAH / EDIT FOTO & 2 JUDUL GALERI */}
          {showGalleryModal && (
            <div className="admin-modal-overlay" onClick={() => setShowGalleryModal(false)}>
              <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="admin-modal-header">
                  <h3>{editingGalleryItem ? 'Edit Foto & 2 Judul Galeri' : 'Tambah Foto Galeri Baru'}</h3>
                  <button className="admin-modal-close" onClick={() => setShowGalleryModal(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveGalleryItem}>
                  <div className="admin-modal-body" style={{ display: 'grid', gap: '1.25rem' }}>
                    {/* INPUT JUDUL 1 */}
                    <div className="admin-form-group">
                      <label className="admin-label">Judul 1 (Judul Utama Foto) *</label>
                      <input
                        type="text"
                        value={galleryForm.title}
                        onChange={(e) => setGalleryForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="contoh: Panorama Pesisir Belakang Padang"
                        required
                        className="admin-input admin-input--simple"
                      />
                    </div>

                    {/* INPUT JUDUL 2 */}
                    <div className="admin-form-group">
                      <label className="admin-label">Judul 2 (Subjudul / Kategori Foto) *</label>
                      <input
                        type="text"
                        value={galleryForm.category}
                        onChange={(e) => setGalleryForm((prev) => ({ ...prev, category: e.target.value }))}
                        placeholder="contoh: Panorama Alam / Wisata Bahari"
                        required
                        className="admin-input admin-input--simple"
                      />
                    </div>

                    {/* INPUT UNGGAH FOTO (WAJIB FILE) */}
                    <div className="admin-form-group">
                      <label className="admin-label">Unggah Foto Galeri *</label>

                      {galleryForm.image ? (
                        <div style={{ marginBottom: '0.75rem', position: 'relative' }}>
                          <img
                            src={galleryForm.image}
                            alt="Preview Foto"
                            style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(197, 160, 74, 0.4)' }}
                          />
                          <label
                            className="button button--secondary button--with-icon"
                            style={{ position: 'absolute', bottom: '12px', right: '12px', cursor: 'pointer', background: 'rgba(11, 45, 85, 0.85)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
                          >
                            <Upload size={15} /> Ganti File Foto
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            padding: '2.5rem 1.5rem',
                            borderRadius: '14px',
                            border: '2px dashed rgba(197, 160, 74, 0.4)',
                            background: 'rgba(11, 45, 85, 0.04)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'rgba(197, 160, 74, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Upload size={24} color="#c5a04a" />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0b2d55', display: 'block' }}>
                              Klik untuk memilih & mengunggah file foto
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                              Format yang didukung: PNG, JPG, WEBP (Maksimal 5MB)
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="admin-modal-footer">
                    <button type="button" className="button button--secondary" onClick={() => setShowGalleryModal(false)}>
                      Batal
                    </button>
                    <button type="submit" className="button button--primary">
                      Simpan Data Galeri
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL PREVIEW DETAIL FOTO GALERI */}
          {previewGalleryItem && (
            <div className="admin-modal-overlay" onClick={() => setPreviewGalleryItem(null)}>
              <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                <div className="admin-modal-header">
                  <h3>Preview Galeri</h3>
                  <button className="admin-modal-close" onClick={() => setPreviewGalleryItem(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="admin-modal-body" style={{ display: 'grid', gap: '1rem' }}>
                  <img
                    src={previewGalleryItem.image}
                    alt={previewGalleryItem.title}
                    style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '16px' }}
                  />
                  <div>
                    <span className="admin-tag-category" style={{ background: 'rgba(197, 160, 74, 0.15)', color: '#c5a04a', border: '1px solid rgba(197, 160, 74, 0.3)', marginBottom: '0.5rem', display: 'inline-block' }}>
                      {previewGalleryItem.category}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', margin: '0.25rem 0', color: '#ffffff' }}>{previewGalleryItem.title}</h3>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button className="button button--secondary" onClick={() => setPreviewGalleryItem(null)}>
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL FORM TAMBAH / EDIT LOGO SPONSOR */}
          {showSponsorModal && (
            <div className="admin-modal-overlay" onClick={() => setShowSponsorModal(false)}>
              <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                <div className="admin-modal-header">
                  <h3>{editingSponsorItem ? 'Edit Logo Sponsor' : 'Tambah Logo Sponsor Baru'}</h3>
                  <button className="admin-modal-close" onClick={() => setShowSponsorModal(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveSponsorItem}>
                  <div className="admin-modal-body" style={{ display: 'grid', gap: '1.25rem' }}>
                    {/* INPUT NAMA / INSTANSI SPONSOR */}
                    <div className="admin-form-group">
                      <label className="admin-label">Nama / Instansi (Opsional)</label>
                      <input
                        type="text"
                        value={sponsorForm.name}
                        onChange={(e) => setSponsorForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="contoh: Universitas Maritim Raja Ali Haji (UMRAH)"
                        className="admin-input admin-input--simple"
                      />
                    </div>

                    {/* INPUT UNGGAH GAMBAR LOGO */}
                    <div className="admin-form-group">
                      <label className="admin-label">Unggah Gambar Logo Sponsor *</label>
                      {sponsorForm.image ? (
                        <div style={{ marginBottom: '0.75rem', position: 'relative' }}>
                          <div
                            style={{
                              width: '100%',
                              height: '180px',
                              background: '#ffffff',
                              borderRadius: '12px',
                              border: '1px solid rgba(197, 160, 74, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '1rem'
                            }}
                          >
                            <img
                              src={sponsorForm.image}
                              alt="Preview Logo Sponsor"
                              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <label
                            className="button button--secondary button--with-icon"
                            style={{
                              position: 'absolute',
                              bottom: '12px',
                              right: '12px',
                              cursor: 'pointer',
                              background: 'rgba(11, 45, 85, 0.85)',
                              backdropFilter: 'blur(4px)',
                              color: '#ffffff',
                              fontSize: '0.82rem',
                              padding: '0.4rem 0.85rem'
                            }}
                          >
                            <Upload size={15} /> Ganti File Logo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSponsorImageFileUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            padding: '2.5rem 1.5rem',
                            borderRadius: '14px',
                            border: '2px dashed rgba(197, 160, 74, 0.4)',
                            background: 'rgba(11, 45, 85, 0.04)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'rgba(197, 160, 74, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Upload size={24} color="#c5a04a" />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0b2d55', display: 'block' }}>
                              Klik untuk memilih & mengunggah file logo sponsor
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                              Format yang didukung: PNG, JPG, WEBP (Maksimal 5MB)
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSponsorImageFileUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="admin-modal-footer">
                    <button type="button" className="button button--secondary" onClick={() => setShowSponsorModal(false)}>
                      Batal
                    </button>
                    <button type="submit" className="button button--primary">
                      Simpan Logo Sponsor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL PREVIEW SPONSOR */}
          {previewSponsorItem && (
            <div className="admin-modal-overlay" onClick={() => setPreviewSponsorItem(null)}>
              <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="admin-modal-header">
                  <h3>Pratinjau Logo Sponsor</h3>
                  <button className="admin-modal-close" onClick={() => setPreviewSponsorItem(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      border: '2px solid rgba(197, 160, 74, 0.4)',
                      background: '#ffffff',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img
                      src={previewSponsorItem.image || previewSponsorItem.src}
                      alt={previewSponsorItem.name || previewSponsorItem.alt || 'Sponsor'}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: '#ffffff', textAlign: 'center', margin: 0 }}>
                    {previewSponsorItem.name || previewSponsorItem.alt || 'Logo Sponsor'}
                  </h3>
                </div>
                <div className="admin-modal-footer">
                  <button className="button button--secondary" onClick={() => setPreviewSponsorItem(null)}>
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL TAMBAH / EDIT DATA UMKM */}
          {showUmkmModal && (
            <div className="admin-modal-overlay" onClick={() => setShowUmkmModal(false)} data-lenis-prevent>
              <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()} data-lenis-prevent style={{ maxWidth: '600px' }}>
                <div className="admin-modal-header">
                  <h3>{editingUmkmItem ? 'Edit Data UMKM' : 'Tambah UMKM Baru'}</h3>
                  <button className="admin-modal-close" onClick={() => setShowUmkmModal(false)}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveUmkmItem} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <div className="admin-modal-body" data-lenis-prevent style={{ display: 'grid', gap: '1.2rem' }}>

                    <div className="admin-form-group">
                      <label className="admin-label">Nama UMKM / Usaha *</label>
                      <input
                        type="text"
                        value={umkmForm.name}
                        onChange={(e) => setUmkmForm({ ...umkmForm, name: e.target.value })}
                        placeholder="Contoh: Kedai Kopi Ameng"
                        required
                        className="admin-input admin-input--simple"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="admin-form-group">
                        <label className="admin-label">Lokasi / Wilayah</label>
                        <input
                          type="text"
                          value={umkmForm.location}
                          onChange={(e) => setUmkmForm({ ...umkmForm, location: e.target.value })}
                          placeholder="Tanjung Sari, Belakang Padang"
                          className="admin-input admin-input--simple"
                        />
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-label">Nomor WhatsApp / HP</label>
                        <input
                          type="text"
                          value={umkmForm.phone}
                          onChange={(e) => setUmkmForm({ ...umkmForm, phone: e.target.value })}
                          placeholder="0812-3456-7890"
                          className="admin-input admin-input--simple"
                        />
                      </div>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-label">Alamat Lengkap</label>
                      <input
                        type="text"
                        value={umkmForm.address}
                        onChange={(e) => setUmkmForm({ ...umkmForm, address: e.target.value })}
                        placeholder="Jl. Dermaga Utama Tanjung Sari No. 12"
                        className="admin-input admin-input--simple"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-label">Deskripsi Usaha & Produk *</label>
                      <textarea
                        value={umkmForm.description}
                        onChange={(e) => setUmkmForm({ ...umkmForm, description: e.target.value })}
                        placeholder="Deskripsi singkat mengenai produk, keunggulan, atau kisah UMKM..."
                        rows={3}
                        required
                        className="admin-input admin-input--simple"
                        style={{ resize: 'vertical' }}
                      ></textarea>
                    </div>

                    {/* FOTO 1: GAMBAR TOKO (FOTO UTAMA) */}
                    <div className="admin-form-group">
                      <label className="admin-label">1. Foto Utama / Gambar Toko (Sampul Utama)</label>
                      <div className="admin-upload-box">
                        {umkmForm.image ? (
                          <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden' }}>
                            <img src={umkmForm.image} alt="Gambar Toko" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <label
                              className="button button--secondary"
                              style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                cursor: 'pointer',
                                background: 'rgba(11, 45, 85, 0.85)',
                                color: '#ffffff',
                                fontSize: '0.8rem',
                                padding: '0.35rem 0.75rem'
                              }}
                            >
                              <Upload size={14} /> Ganti Gambar Toko
                              <input type="file" accept="image/*" onChange={handleUmkmImageFileUpload} style={{ display: 'none' }} />
                            </label>
                          </div>
                        ) : (
                          <label
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '1.8rem 1rem',
                              borderRadius: '14px',
                              border: '2px dashed rgba(197, 160, 74, 0.4)',
                              background: 'rgba(11, 45, 85, 0.04)',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <Upload size={22} color="#c5a04a" />
                            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#0b2d55' }}>
                              Klik untuk mengunggah Gambar Toko / Foto Utama
                            </span>
                            <input type="file" accept="image/*" onChange={handleUmkmImageFileUpload} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* FOTO 2-4: 3 FOTO PRODUK TERDEBEST */}
                    <div className="admin-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label className="admin-label" style={{ margin: 0 }}>2. Foto Produk Terdebest (Maksimal 3 Foto)</label>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {umkmForm.productImages.length}/3 Foto Terisi
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        {umkmForm.productImages.map((imgSrc, idx) => (
                          <div key={idx} style={{ position: 'relative', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                            <img src={imgSrc} alt={`Produk ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => handleRemoveProductImage(idx)}
                              style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="Hapus foto produk ini"
                            >
                              <Trash2 size={12} />
                            </button>
                            <span style={{ position: 'absolute', bottom: '4px', left: '5px', fontSize: '0.68rem', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
                              Produk #{idx + 1}
                            </span>
                          </div>
                        ))}

                        {umkmForm.productImages.length < 3 && (
                          <label
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100px',
                              borderRadius: '12px',
                              border: '2px dashed rgba(197, 160, 74, 0.5)',
                              background: 'rgba(197, 160, 74, 0.05)',
                              cursor: 'pointer',
                              textAlign: 'center',
                              padding: '0.5rem'
                            }}
                          >
                            <Plus size={18} color="#c5a04a" />
                            <span style={{ fontSize: '0.74rem', fontWeight: '600', color: '#0b2d55', marginTop: '4px' }}>
                              + Tambah Produk
                            </span>
                            <input type="file" accept="image/*" onChange={handleAddProductImageFile} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="admin-modal-footer">
                    <button type="button" className="button button--secondary" onClick={() => setShowUmkmModal(false)}>
                      Batal
                    </button>
                    <button type="submit" className="button button--primary">
                      Simpan Data UMKM
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL VERIFIKASI HIGHLIGHT */}
          {confirmHighlightModal && (
            <div className="admin-modal-overlay" onClick={() => setConfirmHighlightModal(null)}>
              <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div className="admin-modal-header">
                  <h3>Verifikasi Highlight Utama</h3>
                  <button className="admin-modal-close" onClick={() => setConfirmHighlightModal(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="admin-modal-body" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: confirmHighlightModal.actionType === 'set' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                    {confirmHighlightModal.actionType === 'set' ? (
                      <Check size={28} color="#10B981" />
                    ) : (
                      <X size={28} color="#EF4444" />
                    )}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', color: '#0b2d55', margin: '0 0 0.5rem 0', fontWeight: '700' }}>
                    {confirmHighlightModal.actionType === 'set' ? 'Jadikan Sebagai Highlight Utama?' : 'Batalkan Status Highlight?'}
                  </h4>
                  <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                    {confirmHighlightModal.actionType === 'set' ? (
                      <>
                        Apakah Anda yakin ingin menjadikan produk <strong>&quot;{confirmHighlightModal.item.name}&quot;</strong> sebagai <strong>Highlight Utama</strong> di halaman Beranda?
                      </>
                    ) : (
                      <>
                        Apakah Anda yakin ingin <strong>membatalkan</strong> status Highlight Utama untuk produk <strong>&quot;{confirmHighlightModal.item.name}&quot;</strong>?
                      </>
                    )}
                  </p>
                </div>
                <div className="admin-modal-footer" style={{ justifyContent: 'center' }}>
                  <button className="button button--secondary" onClick={() => setConfirmHighlightModal(null)}>
                    Batal
                  </button>
                  <button className="button button--primary" onClick={handleConfirmHighlightAction}>
                    {confirmHighlightModal.actionType === 'set' ? 'Ya, Jadikan Highlight ✓' : 'Ya, Batalkan Highlight'}
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* MOCKUP MODAL DETAIL UMKM */}
          {selectedUmkm && (
            <div className="admin-modal-overlay" onClick={() => setSelectedUmkm(null)}>
              <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                  <h3>Detail UMKM: {selectedUmkm.name}</h3>
                  <button className="admin-modal-close" onClick={() => setSelectedUmkm(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="admin-modal-body" style={{ display: 'grid', gap: '1rem' }}>
                  <img src={selectedUmkm.image} alt={selectedUmkm.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '16px' }} />
                  <div><strong>Kategori:</strong> {selectedUmkm.category}</div>
                  <div><strong>Lokasi:</strong> {selectedUmkm.location}</div>
                  <div><strong>Deskripsi:</strong> {selectedUmkm.description}</div>
                </div>
                <div className="admin-modal-footer">
                  <button className="button button--secondary" onClick={() => setSelectedUmkm(null)}>
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TOAST FLOATING NOTIFICATION */}
          {toastMessage && (
            <div
              style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                background: '#0b2d55',
                border: '1px solid #c5a04a',
                color: '#ffffff',
                padding: '0.85rem 1.4rem',
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                zIndex: 9999
              }}
            >
              <CheckCircle2 size={20} color="#10B981" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SecretAdminPage
