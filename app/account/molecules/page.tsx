'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalcShell, Card, ErrorBanner } from '@/components/lab'

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border border-t-primary-500 rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your molecules...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <ErrorBanner>{error}</ErrorBanner>
          <Link href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-500 transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <CalcShell
      eyebrow="Account · Library"
      title="My Molecules"
      subtitle="Structures you have saved from the editor. Open, share, or remove them."
      backHref="/account"
      backLabel="Account"
      maxWidth="6xl"
      action={
        <Link
          href="/draw"
          className="inline-flex items-center justify-center rounded-md bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
        >
          + New structure
        </Link>
      }
    >
      {/* Molecule Grid */}
      {molecules.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-md border border-border bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="text-foreground text-lg mb-2">No molecules saved yet.</p>
          <p className="text-muted-foreground text-sm">
            Visit <Link href="/draw" className="text-primary-600 hover:underline">/draw</Link> to create and save your first structure.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {molecules.map((mol) => (
            <Card
              key={mol.id}
              className="p-5 hover:border-primary-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground truncate" title={mol.name}>
                  {mol.name}
                </h3>
                {mol.is_public && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md border border-success/40 bg-success/10 text-success">
                    Public
                  </span>
                )}
              </div>

              <p className="text-sm font-mono text-primary-600 mb-3 break-all" title={mol.smiles}>
                {truncateSmiles(mol.smiles)}
              </p>

              {mol.tags && mol.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mol.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground mb-4">
                Saved on {formatDate(mol.created_at)}
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/draw?mol_id=${mol.id}`}
                  className="flex-1 text-center px-3 py-2 text-sm font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors min-h-[44px] inline-flex items-center justify-center"
                >
                  Open in editor
                </Link>
                <button
                  onClick={() => handleDelete(mol.id)}
                  disabled={deletingId === mol.id}
                  aria-label={`Delete ${mol.name}`}
                  className="px-3 py-2 text-sm font-medium rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors min-h-[44px]"
                >
                  {deletingId === mol.id ? '...' : 'Delete'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </CalcShell>
  )
}
