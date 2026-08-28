import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalUsers: number
  totalPhotos: number
  publicPhotos: number
  recentUploads: { id: string; title: string; created_at: string; username?: string }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const [totalUsersRes, totalPhotosRes, publicPhotosRes, recentRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('photos').select('id', { count: 'exact', head: true }),
        supabase.from('photos').select('id', { count: 'exact', head: true }).eq('is_public', true),
        supabase
          .from('photos')
          .select('id, title, created_at, owner_username')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      setStats({
        totalUsers: totalUsersRes.count ?? 0,
        totalPhotos: totalPhotosRes.count ?? 0,
        publicPhotos: publicPhotosRes.count ?? 0,
        // owner_username is denormalized onto each photo row at upload time
        // (no server-side JOIN) — see photoService.uploadPhoto.
        recentUploads: (recentRes.data ?? []).map((d) => ({
          id: d.id,
          title: d.title,
          created_at: d.created_at,
          username: d.owner_username,
        })),
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-muted">Loading...</p>

  const cards = [
    { label: 'Total users', value: stats?.totalUsers ?? 0 },
    { label: 'Total photos', value: stats?.totalPhotos ?? 0 },
    { label: 'Public photos', value: stats?.publicPhotos ?? 0 },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line bg-white p-6">
            <p className="text-3xl font-semibold text-ink">{c.value}</p>
            <p className="mt-1 text-sm text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-card border border-line bg-white p-6">
        <h2 className="text-sm font-semibold text-ink">Recent uploads</h2>
        <ul className="mt-4 divide-y divide-line">
          {(stats?.recentUploads ?? []).map((u) => (
            <li key={u.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-ink">{u.title}</span>
              <span className="text-muted">@{u.username} · {new Date(u.created_at).toLocaleDateString()}</span>
            </li>
          ))}
          {(stats?.recentUploads?.length ?? 0) === 0 && (
            <li className="py-3 text-sm text-muted">No uploads yet.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
