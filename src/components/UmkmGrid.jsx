import UmkmCard from './UmkmCard.jsx'

function UmkmGrid({ umkmList, onViewDetail }) {
  return (
    <div className="umkm-grid">
      {umkmList.map((umkm) => (
        <UmkmCard key={umkm.id} umkm={umkm} onViewDetail={onViewDetail} />
      ))}
    </div>
  )
}

export default UmkmGrid
