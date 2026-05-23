'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Molecule {
  id: string
  name: string
  smiles: string
  mol_block: string | null
  inchi: string | null
  inchi_key: string | null
  tags: string[] | null
  notes: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function MoleculesPage() {
  const router = useRouter()
  const [molecules, setMolecules] = useState<Molecule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchSessionAndMolecules = async () => {
      try {
        const sessionRes = await fetch('/api/session')
        if (sessionRes.status === 401) {
          router.push('/')
          return
        }
        if (!sessionRes.ok) {
          setError('Failed to verify session')
          setIsLoading(false)
          return
        }

        const moleculesRes = await fetch('/api/molecules')
        if (!moleculesRes.ok) {
          const payload = await moleculesRes.json().catch(() => ({}))
          setError(payload.error || 'Failed to load molecules')
          setIsLoading(false)
          return
        }

        const data = await moleculesRes.json()
        setMolecules(data as Molecule[])
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to connect to server')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessionAndMolecules()
  }, [router])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this molecule?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/molecules/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        alert(payload.error || 'Failed to delete molecule')
        return
      }
      setMolecules((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete molecule')
    } finally {
      setDeletingId(null)
    }
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const truncateSmiles = (smiles: string, maxLen = 40) => {
    if (smiles.length <= maxLen) return smiles
    return smiles.substring(0, maxLen) + '...'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading your molecules...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Account
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-2xl font-bold text-white">My Molecules</h1>
          </div>
          <Link
            href="/draw"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
          >
            + New Structure
          </Link>
        </div>

        {/* Molecule Grid */}
        {molecules.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg mb-2">No molecules saved yet.</p>
            <p className="text-gray-500 text-sm mb-6">
              Visit <Link href="/draw" className="text-cyan-400 hover:underline">/draw</Link> to create and save your first structure.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {molecules.map((mol) => (
              <div
                key={mol.id}
                className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-5 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white truncate" title={mol.name}>
                    {mol.name}
                  </h3>
                  {mol.is_public && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                      Public
                    </span>
                  )}
                </div>

                <p className="text-sm font-mono text-cyan-400 mb-3 break-all" title={mol.smiles}>
                  {truncateSmiles(mol.smiles)}
                </p>

                {mol.tags && mol.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mol.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs rounded-md bg-gray-800 text-gray-300 border border-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mb-4">
                  Saved on {formatDate(mol.created_at)}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/draw?mol_id=${mol.id}`}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors"
                  >
                    Open in Editor
                  </Link>
                  <button
                    onClick={() => handleDelete(mol.id)}
                    disabled={deletingId === mol.id}
                    className="px-3 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === mol.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
