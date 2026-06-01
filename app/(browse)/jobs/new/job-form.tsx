'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { MATERIALS, COLORS, formatFileSize, JOB_TYPES, MANUFACTURING_PROCESSES } from '@/lib/utils'

interface ClientLocation { address: string; lat: number | null; lng: number | null }

export function NewJobForm({ clientId, clientLocation, isGuest }: { clientId: string; clientLocation: ClientLocation; isGuest?: boolean }) {
  const router = useRouter()
  const modelFileRef = useRef<HTMLInputElement>(null)
  const imageFileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelFiles, setModelFiles] = useState<File[]>([])
  const [modelInputMode, setModelInputMode] = useState<'file' | 'link'>('file')
  const [modelUrl, setModelUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    material: '',
    color: '',
    quantity: '1',
    deadline: '',
    budget: '',
    location: clientLocation.address,
    lat: clientLocation.lat,
    lng: clientLocation.lng,
    shipping_required: true,
    pickup_ok: false,
    job_type: 'functional',
    process: 'fdm',
    print_quality: 'normal',
  })

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleModelFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const allowed = ['stl', 'step', 'stp', '3mf', 'zip', 'obj']
    const valid = selected.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      return allowed.includes(ext)
    })
    if (valid.length !== selected.length) {
      setError('Some files were rejected. Allowed types: STL, STEP, 3MF, ZIP, OBJ.')
    }
    setModelFiles((prev) => [...prev, ...valid])
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!allowed.includes(ext)) {
      setError('Image must be JPG, PNG, WEBP, or GIF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.material) { setError('Please select a material.'); return }
    if (modelInputMode === 'file' && modelFiles.length === 0) { setError('Please upload at least one 3D model file (STL, 3MF, etc.).'); return }
    if (modelInputMode === 'link' && !modelUrl.trim()) { setError('Please paste a link to your model on Thingiverse or MakerWorld.'); return }
    if (modelInputMode === 'link') {
      const validDomains = ['thingiverse.com', 'makerworld.com', 'printables.com', 'myminifactory.com', 'cults3d.com']
      const isValidUrl = validDomains.some((d) => modelUrl.includes(d)) || modelUrl.startsWith('http')
      if (!isValidUrl) { setError('Please enter a valid URL (e.g. a Thingiverse or MakerWorld link).'); return }
    }
    if (!imageFile) { setError('Please upload a reference photo so makers can see what you need.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // lat/lng already set from address autocomplete selection

    // Upload reference image first
    let imageUrl: string | null = null
    const imagePath = `job-images/${clientId}/${Date.now()}-${imageFile.name}`
    const { error: imgUploadError } = await supabase.storage
      .from('job-files')
      .upload(imagePath, imageFile, { contentType: imageFile.type })

    if (imgUploadError) {
      setError(`Image upload failed: ${imgUploadError.message}`)
      setLoading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('job-files').getPublicUrl(imagePath)
    imageUrl = publicUrl

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        client_id: clientId,
        title: form.title,
        description: form.description,
        material: form.material,
        color: form.color || null,
        quantity: parseInt(form.quantity) || 1,
        deadline: form.deadline || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        location: form.location.trim(),
        shipping_required: form.shipping_required,
        pickup_ok: form.pickup_ok,
        image_url: imageUrl,
        latitude: form.lat,
        longitude: form.lng,
        job_type: form.job_type,
        process: form.process,
        print_quality: form.print_quality,
      })
      .select()
      .single()

    if (jobError || !job) {
      setError(jobError?.message ?? 'Failed to create job.')
      setLoading(false)
      return
    }

    // Upload 3D model files or save link
    if (modelInputMode === 'link' && modelUrl.trim()) {
      // Extract a display name from the URL
      const urlObj = (() => { try { return new URL(modelUrl.trim()) } catch { return null } })()
      const displayName = urlObj
        ? urlObj.hostname.replace('www.', '') + urlObj.pathname
        : modelUrl.trim()
      await supabase.from('job_files').insert({
        job_id: job.id,
        uploaded_by: user.id,
        file_name: displayName,
        file_url: modelUrl.trim(),
        file_size: 0,
        file_type: 'link',
      })
    } else {
      for (const file of modelFiles) {
        const path = `${job.id}/${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-files')
          .upload(path, file)

        if (uploadError) {
          console.error('File upload error:', uploadError.message)
          continue
        }

        const { data: { publicUrl: filePublicUrl } } = supabase.storage.from('job-files').getPublicUrl(path)

        await supabase.from('job_files').insert({
          job_id: job.id,
          uploaded_by: user.id,
          file_name: file.name,
          file_url: uploadData?.path ? filePublicUrl : '',
          file_size: file.size,
          file_type: file.name.split('.').pop()?.toLowerCase(),
        })
      }
    }

    router.push(`/jobs/${job.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="section-heading">Post a New Request</h1>
        <p className="text-warm-500 text-sm mt-0.5">
          Describe your part and receive quotes from local printer owners.
        </p>
      </div>

      {isGuest && (
        <div className="mb-6 rounded-xl border border-[#D4A017]/40 bg-[#D4A017]/10 px-4 py-3 flex items-start gap-3">
          <span className="text-[#D4A017] text-lg mt-0.5">👀</span>
          <p className="text-sm text-[#CEC8E4]">
            You're previewing the form as a guest. Fill in your details, then{' '}
            <a href="/signup" className="font-semibold text-[#D4A017] hover:underline">create a free account</a>
            {' '}to submit your request.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Job Details</h2>
          <Input
            label="Job title *"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Custom bracket for bike mount"
          />
          <Textarea
            label="Description *"
            required
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="Describe dimensions, tolerances, intended use, any special requirements…"
          />
        </div>

        {/* Job type */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-ink-900">Job Type <span className="text-red-500">*</span></h2>
            <p className="text-xs text-warm-500 mt-0.5">This determines which certified makers can see and quote your job.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {JOB_TYPES.map((jt) => {
              const active = form.job_type === jt.value
              const colorMap: Record<string, string> = {
                warm:   active ? 'border-warm-400   bg-warm-50   ring-warm-200'   : 'border-warm-200   hover:border-warm-400',
                ink:    active ? 'border-ink-500    bg-ink-50    ring-ink-200'    : 'border-warm-200   hover:border-ink-400',
                gold:   active ? 'border-gold-400   bg-gold-50   ring-gold-200'   : 'border-warm-200   hover:border-gold-400',
                violet: active ? 'border-violet-400 bg-violet-50 ring-violet-200' : 'border-warm-200   hover:border-violet-400',
              }
              return (
                <button
                  key={jt.value}
                  type="button"
                  onClick={() => set('job_type', jt.value)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${active ? `${colorMap[jt.color]} ring-2` : colorMap[jt.color]}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-mono text-warm-600">{jt.icon}</span>
                    <span className="font-semibold text-ink-900 text-sm">{jt.label}</span>
                    {jt.minCertLevel > 0 && (
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-warm-400">
                        Level {jt.minCertLevel}+
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-warm-500 leading-relaxed">{jt.description}</p>
                  <p className="text-[10px] text-warm-400 mt-1.5 font-medium">{jt.hint}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Manufacturing process */}
        <div className="card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-ink-900">Manufacturing Process</h2>
            <div className="relative group">
              <button type="button" className="h-4 w-4 rounded-full bg-warm-200 text-warm-600 text-[10px] font-bold flex items-center justify-center hover:bg-warm-300 transition-colors flex-shrink-0">
                ?
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-ink-950 text-white text-xs rounded-xl p-3 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 space-y-2">
                <p className="font-semibold text-gold-400 mb-1">Process guide</p>
                {MANUFACTURING_PROCESSES.map((p) => (
                  <div key={p.value}>
                    <span className="font-medium text-white">{p.label}:</span>{' '}
                    <span className="text-warm-300">{p.tooltip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {MANUFACTURING_PROCESSES.filter((p) => p.available).map((p) => {
              const active = form.process === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set('process', p.value)}
                  className={`relative rounded-xl border px-3 py-2 text-sm font-medium transition-all text-left ${
                    active
                      ? 'bg-ink-900 text-white border-ink-900'
                      : 'bg-white text-warm-700 border-warm-300 hover:border-ink-400'
                  }`}
                >
                  {p.recommended && (
                    <span className="absolute -top-2 -right-1 rounded-full bg-gold-400 text-ink-950 text-[9px] font-bold px-1.5 py-0.5 leading-none">
                      Recommended
                    </span>
                  )}
                  {p.label}
                </button>
              )
            })}
            {MANUFACTURING_PROCESSES.filter((p) => !p.available).map((p) => (
              <span key={p.value} className="rounded-xl border border-warm-200 px-3 py-2 text-sm text-warm-300 cursor-not-allowed">
                {p.label} <span className="text-[10px]">soon</span>
              </span>
            ))}
          </div>
        </div>

        {/* Print specs */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Print Specifications</h2>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Material *"
              options={MATERIALS.map((m) => ({ value: m, label: m }))}
              placeholder="Select material"
              value={form.material}
              onChange={(e) => set('material', e.target.value)}
            />
            <Select
              label="Preferred color"
              options={COLORS.map((c) => ({ value: c, label: c }))}
              placeholder="Any color"
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
            />
          </div>

          {/* Print quality */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <p className="form-label !mb-0">Print Quality</p>
              <div className="relative group">
                <svg className="h-3.5 w-3.5 text-warm-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 rounded-xl bg-ink-900 text-white text-xs p-3 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 space-y-2">
                  <p><span className="font-semibold text-gold-400">Smooth</span> — Ultra-fine layer lines for an excellent surface finish. Great for display pieces or parts where appearance matters. Takes longer and costs more.</p>
                  <p><span className="font-semibold text-warm-300">Normal</span> — The standard for most 3D prints. A good balance of quality, strength, and cost. Works well for most functional and everyday parts.</p>
                  <p><span className="font-semibold text-emerald-400">Strong</span> — Thicker layer lines that improve structural integrity, making the part more resistant to mechanical stress. Ideal for load-bearing parts. Slightly rougher surface.</p>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-ink-900" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'smooth', label: 'Smooth', icon: '✦', desc: 'Best finish, finer detail', color: 'border-violet-300 bg-violet-50 ring-violet-200 text-violet-800', inactive: 'border-warm-200 hover:border-violet-300' },
                { value: 'normal', label: 'Normal', icon: '◆', desc: 'Balanced quality & speed', color: 'border-ink-400 bg-ink-50 ring-ink-200 text-ink-800', inactive: 'border-warm-200 hover:border-ink-300' },
                { value: 'strong', label: 'Strong', icon: '▲', desc: 'Maximum strength', color: 'border-emerald-400 bg-emerald-50 ring-emerald-200 text-emerald-800', inactive: 'border-warm-200 hover:border-emerald-300' },
              ] as const).map((q) => {
                const active = form.print_quality === q.value
                return (
                  <button key={q.value} type="button" onClick={() => set('print_quality', q.value)}
                    className={`text-left rounded-xl border-2 p-3 transition-all ${active ? `${q.color} ring-2` : q.inactive}`}>
                    <p className="font-mono text-base mb-1">{q.icon}</p>
                    <p className="font-semibold text-ink-900 text-sm">{q.label}</p>
                    <p className="text-xs text-warm-500 mt-0.5">{q.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
            />
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
            />
          </div>
        </div>

        {/* Budget & Delivery */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Budget & Delivery</h2>
          <Input
            label="Budget (CHF)"
            type="number"
            min="0"
            step="0.01"
            value={form.budget}
            onChange={(e) => set('budget', e.target.value)}
            placeholder="50.00"
            hint="Leave blank if flexible"
          />
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.shipping_required}
                onChange={(e) => set('shipping_required', e.target.checked as unknown as boolean)}
                className="h-4 w-4 rounded border-warm-300 text-ink-600 focus:ring-ink-500"
              />
              <span className="text-sm text-warm-700">
                Shipping OK — makers can ship your order
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pickup_ok}
                onChange={(e) => set('pickup_ok', e.target.checked as unknown as boolean)}
                className="h-4 w-4 rounded border-warm-300 text-ink-600 focus:ring-ink-500"
              />
              <span className="text-sm text-warm-700">
                Pickup OK — I can also collect the print in person
              </span>
            </label>
          </div>
        </div>

        {/* 3D Model files */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-ink-900">3D Model <span className="text-red-500">*</span></h2>
            <p className="text-sm text-warm-500 mt-0.5">Upload your model file, or paste a link from Thingiverse, MakerWorld, or Printables.</p>
          </div>

          {/* Toggle tabs */}
          <div className="flex rounded-xl border border-warm-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setModelInputMode('file')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                modelInputMode === 'file'
                  ? 'bg-ink-900 text-white'
                  : 'bg-white text-warm-600 hover:bg-warm-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setModelInputMode('link')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-l border-warm-200 ${
                modelInputMode === 'link'
                  ? 'bg-ink-900 text-white'
                  : 'bg-white text-warm-600 hover:bg-warm-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Paste a link
            </button>
          </div>

          {modelInputMode === 'file' ? (
            <>
              <div
                onClick={() => modelFileRef.current?.click()}
                className="border-2 border-dashed border-warm-300 rounded-xl p-8 text-center cursor-pointer hover:border-ink-400 hover:bg-warm-50 transition-colors"
              >
                <svg className="mx-auto h-10 w-10 text-warm-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-warm-600 font-medium">Click to upload 3D files</p>
                <p className="text-xs text-warm-400 mt-1">STL · STEP · 3MF · OBJ · ZIP</p>
                <input
                  ref={modelFileRef}
                  type="file"
                  multiple
                  accept=".stl,.step,.stp,.3mf,.zip,.obj"
                  onChange={handleModelFileChange}
                  className="hidden"
                />
              </div>

              {modelFiles.length > 0 && (
                <ul className="space-y-2">
                  {modelFiles.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-warm-50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="h-4 w-4 text-ink-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-ink-700 truncate">{f.name}</span>
                        <span className="text-xs text-warm-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModelFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-warm-400 hover:text-red-500 ml-2 text-lg leading-none"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <input
                type="url"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                placeholder="https://www.thingiverse.com/thing:... or https://makerworld.com/..."
                className="w-full rounded-xl border border-warm-300 bg-white px-4 py-3 text-sm text-ink-900 placeholder-warm-400 focus:border-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-200 transition"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Thingiverse', url: 'https://www.thingiverse.com/', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'MakerWorld', url: 'https://makerworld.com/', color: 'bg-green-50 text-green-700 border-green-200' },
                  { label: 'Printables', url: 'https://www.printables.com/', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                  { label: 'MyMiniFactory', url: 'https://www.myminifactory.com/', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                ].map((site) => (
                  <a
                    key={site.label}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-opacity hover:opacity-75 ${site.color}`}
                  >
                    {site.label} ↗
                  </a>
                ))}
              </div>
              <p className="text-xs text-warm-400">
                Find your model on one of these platforms, copy the page URL, and paste it above.
              </p>
            </div>
          )}
        </div>

        {/* Reference photo */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-ink-900">Reference Photo <span className="text-red-500">*</span></h2>
            <p className="text-sm text-warm-500 mt-0.5">
              Upload a photo or render of what you need. This helps makers quickly understand the job when browsing.
            </p>
          </div>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Reference preview"
                className="w-full max-h-64 object-cover rounded-xl border border-warm-200"
              />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute top-2 right-2 rounded-full bg-ink-900/80 text-white h-7 w-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              onClick={() => imageFileRef.current?.click()}
              className="border-2 border-dashed border-warm-300 rounded-xl p-8 text-center cursor-pointer hover:border-gold-400 hover:bg-gold-50/30 transition-colors"
            >
              <svg className="mx-auto h-10 w-10 text-warm-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-warm-600 font-medium">Click to upload a reference photo</p>
              <p className="text-xs text-warm-400 mt-1">JPG · PNG · WEBP — max 10 MB</p>
            </div>
          )}
          <input
            ref={imageFileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            onChange={handleImageFileChange}
            className="hidden"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          {isGuest ? (
            <a href="/signup" className="flex-1">
              <Button type="button" className="w-full" variant="gold">
                Sign up to Post Request →
              </Button>
            </a>
          ) : (
            <Button type="submit" loading={loading} className="flex-1" variant="gold">
              Post Request
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
