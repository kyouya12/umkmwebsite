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
  CheckCircle2
} from 'lucide-react'
import { supabase, getGalleryFromSupabase, addGalleryToSupabase, updateGalleryInSupabase, deleteGalleryFromSupabase } from '../lib/supabase.js'
import umkmData from '../data/umkm.js'
import { getStoredGalleryItems, saveStoredGalleryItems, fetchGalleryItemsWithSupabase, initialGalleryItems } from '../data/gallery.js'

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
  const [activeTab, setActiveTab] = useState('umkm') // 'dashboard' | 'umkm' | 'gallery' | 'settings'

  // CRUD Mockup UMKM State
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUmkm, setSelectedUmkm] = useState(null)

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

  // Initial Fetch dari Supabase Database saat Komponen Dimuat
  useEffect(() => {
    async function loadSupabaseGalleryData() {
      const data = await fetchGalleryItemsWithSupabase()
      if (data && data.length > 0) {
        setGalleryItems(data)
      }
    }
    loadSupabaseGalleryData()
  }, [])

  // Toast Notification Auto Dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

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
      await deleteGalleryFromSupabase(id)
      const updated = galleryItems.filter((item) => item.id !== id)
      updateGalleryState(updated)
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

  // Filter UMKM for CRUD table mockup
  const filteredUmkm = umkmData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    return matchesSearch && matchesCategory
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
                className={`admin-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={20} />
                <span>Pengaturan Sistem</span>
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
                <h1>{activeTab === 'umkm' ? 'Kelola Data UMKM' : activeTab === 'dashboard' ? 'Dashboard Utama' : activeTab === 'gallery' ? 'Dokumentasi Galeri' : 'Pengaturan Sistem'}</h1>
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
              {/* TAB 1: KELOLA UMKM (CRUD INTERFACE MOCKUP) */}
              {activeTab === 'umkm' && (
                <div className="admin-crud-container">
                  {/* CRUD TOOLBAR */}
                  <div className="admin-crud-toolbar">
                    <div className="admin-search-box">
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
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="admin-crud-select"
                      >
                        <option value="All">Semua Kategori</option>
                        <option value="Kuliner">Kuliner</option>
                        <option value="Jajanan">Jajanan</option>
                        <option value="Kerajinan">Kerajinan</option>
                        <option value="Perikanan">Perikanan</option>
                      </select>

                      <button
                        className="button button--primary button--with-icon"
                        onClick={() => setShowAddModal(true)}
                      >
                        <Plus size={18} /> Tambah UMKM Baru
                      </button>
                    </div>
                  </div>

                  {/* CRUD DATA TABLE */}
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Foto</th>
                          <th>Nama UMKM</th>
                          <th>Kategori</th>
                          <th>Lokasi</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'center' }}>Aksi (CRUD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUmkm.length > 0 ? (
                          filteredUmkm.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <img src={item.image} alt={item.name} className="admin-table-img" />
                              </td>
                              <td>
                                <strong className="admin-item-title">{item.name}</strong>
                                <p className="admin-item-desc">{item.description.substring(0, 55)}...</p>
                              </td>
                              <td>
                                <span className="admin-tag-category">{item.category}</span>
                              </td>
                              <td>{item.location}</td>
                              <td>
                                <span className={`admin-status-badge ${item.featured ? 'featured' : ''}`}>
                                  {item.featured ? 'Highlight' : 'Aktif'}
                                </span>
                              </td>
                              <td>
                                <div className="admin-action-buttons">
                                  <button
                                    className="admin-action-btn admin-action-btn--view"
                                    title="Lihat Detail"
                                    onClick={() => setSelectedUmkm(item)}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    className="admin-action-btn admin-action-btn--edit"
                                    title="Edit Data (Mockup)"
                                    onClick={() => alert(`Edit Mockup: ${item.name}`)}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    className="admin-action-btn admin-action-btn--delete"
                                    title="Hapus Data (Mockup)"
                                    onClick={() => alert(`Hapus Mockup: ${item.name}`)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                              Data UMKM tidak ditemukan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="admin-overview-container">
                  <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                      <div className="admin-stat-icon">
                        <Store size={24} color="#c5a04a" />
                      </div>
                      <div>
                        <div className="admin-stat-value">{umkmData.length} Usaha</div>
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
                        <ShieldCheck size={24} color="#10B981" />
                      </div>
                      <div>
                        <div className="admin-stat-value">Aktif</div>
                        <div className="admin-stat-label">Supabase Database</div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-panels-grid">
                    <div className="admin-panel-item">
                      <div className="admin-panel-header">
                        <LayoutDashboard size={20} color="#0b2d55" />
                        <h3>Kelola Katalog UMKM</h3>
                      </div>
                      <p>Kelola dan perbarui data UMKM Tanjung Sari secara real-time.</p>
                      <button className="button button--secondary" onClick={() => setActiveTab('umkm')}>
                        Ke Tabel CRUD UMKM
                      </button>
                    </div>

                    <div className="admin-panel-item">
                      <div className="admin-panel-header">
                        <ImageIcon size={20} color="#0b2d55" />
                        <h3>Kelola Galeri Foto & 2 Judul</h3>
                      </div>
                      <p>Kelola foto dokumentasi dan 2 judul (Judul Utama & Subjudul/Kategori).</p>
                      <button className="button button--secondary" onClick={() => setActiveTab('gallery')}>
                        Buka Kelola Galeri
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KELOLA GALERI FOTO & 2 JUDUL (FULL CRUD SYSTEM) */}
              {activeTab === 'gallery' && (
                <div className="admin-crud-container">
                  {/* TOOLBAR GALERI */}
                  <div className="admin-crud-toolbar" style={{ justifyContent: 'flex-end' }}>
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

              {/* TAB 4: PENGATURAN SISTEM PLACEHOLDER */}
              {activeTab === 'settings' && (
                <div className="admin-placeholder-panel">
                  <h2>Pengaturan Sistem</h2>
                  <p>Halaman ini disiapkan untuk pengaturan sistem dan informasi profil KKN 55.</p>
                  <button className="button button--secondary" onClick={() => setActiveTab('umkm')}>
                    Kembali ke Tabel CRUD UMKM
                  </button>
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

          {/* MOCKUP MODAL TAMBAH UMKM BARU */}
          {showAddModal && (
            <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                  <h3>Tambah UMKM Baru (CRUD Mockup)</h3>
                  <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="admin-modal-body">
                  <div className="admin-form-group">
                    <label className="admin-label">Nama UMKM</label>
                    <input type="text" placeholder="Masukkan nama UMKM" className="admin-input admin-input--simple" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Kategori</label>
                    <input type="text" placeholder="Kuliner / Kerajinan / Dll" className="admin-input admin-input--simple" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Alamat / Lokasi</label>
                    <input type="text" placeholder="Tanjung Sari, Belakang Padang" className="admin-input admin-input--simple" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Deskripsi Usaha</label>
                    <textarea placeholder="Deskripsi singkat mengenai produk..." rows={3} className="admin-input admin-input--simple" style={{ resize: 'vertical' }}></textarea>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button className="button button--secondary" onClick={() => setShowAddModal(false)}>
                    Batal
                  </button>
                  <button className="button button--primary" onClick={() => { alert('Mockup: Data UMKM Baru Disimpan!'); setShowAddModal(false); }}>
                    Simpan Data (Mockup)
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
