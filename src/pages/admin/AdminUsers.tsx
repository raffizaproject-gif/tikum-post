import { useEffect, useState } from 'react'
import { deleteUserProfile, fetchAllProfilesAdmin, setUserActive, updateUserRole } from '@/services/profileService'
import type { Profile } from '@/types'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const data = await fetchAllProfilesAdmin(q)
      setUsers(data)
    } catch {
      showToast('Could not load users.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const toggleRole = async (u: Profile) => {
    if (u.id === currentUser?.id) {
      showToast("You can't change your own role.", 'error')
      return
    }
    const nextRole = u.role === 'admin' ? 'user' : 'admin'
    try {
      await updateUserRole(u.id, nextRole)
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, role: nextRole } : p)))
      showToast(`${u.username} is now ${nextRole}.`, 'success')
    } catch {
      showToast('Could not update role.', 'error')
    }
  }

  const toggleActive = async (u: Profile) => {
    try {
      await setUserActive(u.id, !u.is_active)
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, is_active: !p.is_active } : p)))
      showToast(u.is_active ? `${u.username} deactivated.` : `${u.username} reactivated.`, 'success')
    } catch {
      showToast('Could not update user.', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteUserProfile(pendingDelete.id)
      setUsers((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      showToast('User removed.', 'success')
    } catch {
      showToast('Could not delete user.', 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Search users by name, username, email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="focus-ring min-h-[44px] w-full max-w-sm rounded-full border border-line bg-white px-5 text-sm text-ink"
        style={{ fontSize: 16 }}
      />

      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading...</p>
      ) : (
        <div className="mt-6 space-y-3 md:hidden">
          {users.map((u) => (
            <div key={u.id} className="rounded-card border border-line bg-white p-4">
              <p className="font-medium text-ink">{u.full_name} <span className="text-muted">@{u.username}</span></p>
              <p className="text-sm text-muted">{u.email}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-line px-3 py-1 capitalize">{u.role}</span>
                <span className={`rounded-full px-3 py-1 ${u.is_active ? 'border border-line' : 'bg-ink text-white'}`}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => toggleRole(u)} className="focus-ring min-h-[44px] rounded-full border border-line px-4 text-xs font-medium">
                  Make {u.role === 'admin' ? 'user' : 'admin'}
                </button>
                <button onClick={() => toggleActive(u)} className="focus-ring min-h-[44px] rounded-full border border-line px-4 text-xs font-medium">
                  {u.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
                <button onClick={() => setPendingDelete(u)} className="focus-ring min-h-[44px] rounded-full border border-line px-4 text-xs font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-6 hidden overflow-x-auto rounded-card border border-line bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{u.full_name}</td>
                  <td className="px-4 py-3 text-muted">@{u.username}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-ink">{u.role}</td>
                  <td className="px-4 py-3">{u.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleRole(u)} className="focus-ring rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:bg-page">
                        Make {u.role === 'admin' ? 'user' : 'admin'}
                      </button>
                      <button onClick={() => toggleActive(u)} className="focus-ring rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:bg-page">
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button onClick={() => setPendingDelete(u)} className="focus-ring rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:bg-page">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title={`Delete ${pendingDelete?.username}?`}
        description="This removes their profile record. Consider deactivating instead if you may need this account again."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
