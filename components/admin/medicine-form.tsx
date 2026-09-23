'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export interface MedicineFormValues {
  id?: number
  name: string
  genericName: string
  manufacturer: string
  categoryId: string
  form: string
  strength: string
  packSize: string
  hsnCode: string
  mrp: string
  gstRate: string
  requiresPrescription: boolean
  status: string
  photoUrl: string
  description: string
  images: { id: number; imageUrl: string }[]
  variants: { id: number; size: string; sku: string | null }[]
}

const EMPTY: MedicineFormValues = {
  name: '', genericName: '', manufacturer: '', categoryId: '', form: '', strength: '',
  packSize: '', hsnCode: '', mrp: '', gstRate: '5', requiresPrescription: false,
  status: 'ACTIVE', photoUrl: '', description: '',
  images: [],
  variants: [],
}

export function MedicineForm({
  initial,
  categories,
}: {
  initial?: Partial<MedicineFormValues>
  categories: { id: number; name: string }[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [values, setValues] = useState<MedicineFormValues>({ ...EMPTY, ...initial })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removedVariantIds, setRemovedVariantIds] = useState<number[]>([])
  const isEdit = Boolean(values.id)

  function set<K extends keyof MedicineFormValues>(key: K, value: MedicineFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function onImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (files.some((file) => !file.type.startsWith('image/'))) {
      toast({ title: 'Invalid file', description: 'Please select image files only.', variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      const uploaded: { id: number; imageUrl: string }[] = []
      for (const file of files) {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/uploads', { method: 'POST', body })
        const data = await res.json().catch(() => ({}))
        if (res.status === 501) {
          toast({ title: 'Direct upload unavailable', description: data?.error })
          return
        }
        if (!res.ok || data?.success === false) throw new Error(data?.error ?? `HTTP ${res.status}`)
        uploaded.push({ id: -Date.now() - uploaded.length, imageUrl: data.data.fileUrl })
      }
      setValues((v) => ({ ...v, images: [...v.images, ...uploaded], photoUrl: v.photoUrl || uploaded[0]?.imageUrl || '' }))
      toast({ title: `${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`, description: 'Save to attach them to the medicine.' })
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        mrp: Number(values.mrp),
        gstRate: Number(values.gstRate),
      }
      const res = await fetch(isEdit ? `/api/admin/medicines/${values.id}` : '/api/admin/medicines', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not save', description: data?.error ?? `HTTP ${res.status}`, variant: 'destructive' })
        return
      }
      const newImages = values.images.filter((image) => image.id < 0)
      if (newImages.length) {
        await fetch(`/api/admin/medicines/${data.data.id}/images`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: newImages }),
        })
      }
      for (const variant of values.variants) {
        await fetch(`/api/admin/medicines/${data.data.id}/variants`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ size: variant.size, sku: variant.sku }),
        })
      }
      for (const variantId of removedVariantIds) {
        await fetch(`/api/admin/medicines/${data.data.id}/variants?variantId=${variantId}`, { method: 'DELETE' })
      }
      toast({ title: isEdit ? 'Medicine updated' : 'Medicine added' })
      router.push('/admin/medicines')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *"><Input value={values.name} onChange={(e) => set('name', e.target.value)} required /></Field>
        <Field label="Generic name"><Input value={values.genericName} onChange={(e) => set('genericName', e.target.value)} /></Field>
        <Field label="Manufacturer"><Input value={values.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} /></Field>
        <Field label="Category">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={values.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
          >
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Form"><Input value={values.form} onChange={(e) => set('form', e.target.value)} placeholder="Tablet, Syrup…" /></Field>
        <Field label="Strength"><Input value={values.strength} onChange={(e) => set('strength', e.target.value)} placeholder="500 mg" /></Field>
        <Field label="Pack size"><Input value={values.packSize} onChange={(e) => set('packSize', e.target.value)} placeholder="10 tablets" /></Field>
        <Field label="HSN code"><Input value={values.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} /></Field>
        <Field label="MRP *"><Input type="number" step="0.01" value={values.mrp} onChange={(e) => set('mrp', e.target.value)} required /></Field>
        <Field label="GST %"><Input type="number" step="0.01" value={values.gstRate} onChange={(e) => set('gstRate', e.target.value)} /></Field>
        <Field label="Status">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={values.status}
            onChange={(e) => set('status', e.target.value)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
          </select>
        </Field>
        <Field label="Medicine image">
          <div className="space-y-2">
            <input type="file" accept="image/*" multiple onChange={onImageSelect} disabled={uploading} className="block text-sm" />
            <Input
              value={values.photoUrl}
              onChange={(e) => set('photoUrl', e.target.value)}
              placeholder={uploading ? 'Uploading…' : 'Or paste image URL'}
            />
            {values.photoUrl ? (
              <div className="h-24 w-24 overflow-hidden rounded-md border border-border bg-muted/40">
                <Image src={values.photoUrl} alt="Medicine preview" width={96} height={96} className="h-full w-full object-cover" />
              </div>
            ) : null}
            {values.images.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {values.images.map((image) => (
                  <div key={image.id} className="group relative h-16 w-16 overflow-hidden rounded border border-border">
                    <Image src={image.imageUrl} alt="Medicine product" width={64} height={64} className="h-full w-full object-cover" />
                    {values.photoUrl === image.imageUrl ? <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1 text-center text-[9px] text-white">Primary</span> : <button type="button" onClick={() => set('photoUrl', image.imageUrl)} className="absolute inset-x-0 bottom-0 bg-black/70 px-1 text-[9px] text-white opacity-0 group-hover:opacity-100">Make primary</button>}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.requiresPrescription} onChange={(e) => set('requiresPrescription', e.target.checked)} />
        Requires prescription
      </label>
      <Field label="Description">
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </Field>
      <Field label="Product variants">
        <div className="space-y-2">
          {values.variants.map((variant, index) => (
            <div key={variant.id} className="flex items-center gap-2">
              <Input value={variant.size} placeholder="Size, e.g. 5 ml" onChange={(e) => setValues((v) => ({ ...v, variants: v.variants.map((item, i) => i === index ? { ...item, size: e.target.value } : item) }))} />
              <Input value={variant.sku ?? ''} placeholder="SKU" onChange={(e) => setValues((v) => ({ ...v, variants: v.variants.map((item, i) => i === index ? { ...item, sku: e.target.value } : item) }))} />
              <button type="button" className="text-xs text-destructive hover:underline" onClick={() => { if (variant.id > 0) setRemovedVariantIds((ids) => [...ids, variant.id]); setValues((v) => ({ ...v, variants: v.variants.filter((_, i) => i !== index) })) }}>Remove</button>
            </div>
          ))}
          <button type="button" className="text-sm text-primary hover:underline" onClick={() => setValues((v) => ({ ...v, variants: [...v.variants, { id: -Date.now(), size: '', sku: null }] }))}>Add size variant</button>
        </div>
      </Field>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add medicine'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
