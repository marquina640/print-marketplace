'use client'

import { useState, useEffect } from 'react'

interface CalcSettings {
  electricityRate: number   // currency per kWh
  laborRate:       number   // currency per hour
  machineWatts:    number   // printer power in watts
  materialCosts:   Record<string, number>  // material name -> cost per gram
}

const DEFAULTS: CalcSettings = {
  electricityRate: 0.30,
  laborRate:       25,
  machineWatts:    150,
  materialCosts:   {},
}

function load(): CalcSettings {
  try {
    const raw = localStorage.getItem('pmh_calc_v1')
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULTS
}

function save(s: CalcSettings) {
  try { localStorage.setItem('pmh_calc_v1', JSON.stringify(s)) } catch {}
}

interface Props {
  currency:   string
  onUsePrice: (price: number) => void
}

export function PriceCalculator({ currency, onUsePrice }: Props) {
  const [open,     setOpen]     = useState(false)
  const [settings, setSettings] = useState<CalcSettings>(DEFAULTS)

  const [material,     setMaterial]     = useState('')
  const [weightGrams,  setWeightGrams]  = useState('')
  const [printHours,   setPrintHours]   = useState('')
  const [preHours,     setPreHours]     = useState('')
  const [postHours,    setPostHours]    = useState('')
  const [failBuffer,   setFailBuffer]   = useState('10')
  const [packaging,    setPackaging]    = useState('2')
  const [marginPct,    setMarginPct]    = useState('20')
  const [withShipping, setWithShipping] = useState(false)
  const [shippingCost, setShippingCost] = useState('')

  useEffect(() => { setSettings(load()) }, [])

  function patchSettings(patch: Partial<CalcSettings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    save(next)
  }

  function setMatCost(mat: string, cost: number) {
    patchSettings({ materialCosts: { ...settings.materialCosts, [mat]: cost } })
  }

  // --- calculations ---
  const weight     = parseFloat(weightGrams) || 0
  const costPerG   = material ? (settings.materialCosts[material.trim()] ?? 0) : 0
  const matCost    = weight * costPerG

  const printH     = parseFloat(printHours) || 0
  const elecCost   = printH * (settings.machineWatts / 1000) * settings.electricityRate

  const preH       = parseFloat(preHours) || 0
  const postH      = parseFloat(postHours) || 0
  const laborCost  = (preH + postH) * settings.laborRate

  const packCost   = parseFloat(packaging) || 0
  const shipCost   = withShipping ? (parseFloat(shippingCost) || 0) : 0

  const baseCost   = matCost + elecCost + laborCost + packCost + shipCost
  const failAdd    = baseCost * ((parseFloat(failBuffer) || 0) / 100)
  const withFail   = baseCost + failAdd
  const marginAdd  = withFail * ((parseFloat(marginPct) || 0) / 100)
  const makerWants = withFail + marginAdd
  // gross up so maker still gets their target after 12% platform fee
  const quotePrice = makerWants / 0.88
  const platFee    = quotePrice * 0.12
  const makerTake  = quotePrice - platFee

  const fmt = (n: number) => n.toFixed(2)
  const hasCalc = baseCost > 0

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-ink-900 transition-colors"
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {open ? 'Hide calculator' : 'Calculate price'}
      </button>

      {open && (
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-4 space-y-5 text-xs">

          {/* Rates (persisted) */}
          <div>
            <p className="font-semibold text-ink-800 mb-2.5">Your rates <span className="font-normal text-warm-400">(saved for next time)</span></p>
            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-warm-500">Electricity ({currency}/kWh)</span>
                <input
                  type="number" step="0.01" min="0"
                  value={settings.electricityRate}
                  onChange={e => patchSettings({ electricityRate: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-warm-500">Labor rate ({currency}/hr)</span>
                <input
                  type="number" step="1" min="0"
                  value={settings.laborRate}
                  onChange={e => patchSettings({ laborRate: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-warm-500">Printer power (W)</span>
                <input
                  type="number" step="10" min="0"
                  value={settings.machineWatts}
                  onChange={e => patchSettings({ machineWatts: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
            </div>
          </div>

          {/* Material */}
          <div>
            <p className="font-semibold text-ink-800 mb-2.5">Material</p>
            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-warm-500">Material (e.g. PLA, PETG)</span>
                <input
                  type="text"
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                  placeholder="PLA"
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-warm-500">Cost per gram ({currency})</span>
                <input
                  type="number" step="0.001" min="0"
                  value={material.trim() ? (settings.materialCosts[material.trim()] ?? '') : ''}
                  onChange={e => material.trim() && setMatCost(material.trim(), parseFloat(e.target.value) || 0)}
                  placeholder="0.025"
                  disabled={!material.trim()}
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5 disabled:opacity-40"
                />
              </label>
              <label className="space-y-1">
                <span className="text-warm-500">Weight used (grams)</span>
                <input
                  type="number" step="1" min="0"
                  value={weightGrams}
                  onChange={e => setWeightGrams(e.target.value)}
                  placeholder="100"
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
            </div>
          </div>

          {/* Time */}
          <div>
            <p className="font-semibold text-ink-800 mb-2.5">Time</p>
            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-warm-500">Print time (hours)</span>
                <input
                  type="number" step="0.5" min="0"
                  value={printHours}
                  onChange={e => setPrintHours(e.target.value)}
                  placeholder="4"
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-warm-500">Pre-processing (hours)</span>
                <input
                  type="number" step="0.25" min="0"
                  value={preHours}
                  onChange={e => setPreHours(e.target.value)}
                  placeholder="0.5"
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-warm-500">Post-processing (hours)</span>
                <input
                  type="number" step="0.25" min="0"
                  value={postHours}
                  onChange={e => setPostHours(e.target.value)}
                  placeholder="0.5"
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
            </div>
          </div>

          {/* Overhead */}
          <div>
            <p className="font-semibold text-ink-800 mb-2.5">Overhead &amp; margin</p>
            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-warm-500">Failed print buffer (%)</span>
                <input
                  type="number" step="1" min="0" max="50"
                  value={failBuffer}
                  onChange={e => setFailBuffer(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-warm-500">Packaging ({currency})</span>
                <input
                  type="number" step="0.5" min="0"
                  value={packaging}
                  onChange={e => setPackaging(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
              <label className="space-y-1">
                <span className="text-warm-500">Profit margin (%)</span>
                <input
                  type="number" step="5" min="0" max="500"
                  value={marginPct}
                  onChange={e => setMarginPct(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white px-2 py-1.5"
                />
              </label>
            </div>
          </div>

          {/* Shipping */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-ink-700">
              <input
                type="checkbox"
                checked={withShipping}
                onChange={e => setWithShipping(e.target.checked)}
                className="rounded"
              />
              Include shipping cost
            </label>
            {withShipping && (
              <input
                type="number" step="1" min="0"
                value={shippingCost}
                onChange={e => setShippingCost(e.target.value)}
                placeholder={`Shipping (${currency})`}
                className="rounded-lg border border-warm-200 bg-white px-2 py-1.5 w-36"
              />
            )}
          </div>

          {/* Breakdown + result */}
          {hasCalc && (
            <div className="rounded-lg bg-white border border-warm-200 p-3 space-y-1.5">
              <p className="font-semibold text-ink-800 mb-2">Breakdown</p>

              {matCost > 0 && (
                <div className="flex justify-between text-warm-500">
                  <span>Material ({weight}g × {currency} {fmt(costPerG)}/g)</span>
                  <span>{currency} {fmt(matCost)}</span>
                </div>
              )}
              {elecCost > 0 && (
                <div className="flex justify-between text-warm-500">
                  <span>Electricity ({printH}h × {settings.machineWatts}W @ {currency} {settings.electricityRate}/kWh)</span>
                  <span>{currency} {fmt(elecCost)}</span>
                </div>
              )}
              {laborCost > 0 && (
                <div className="flex justify-between text-warm-500">
                  <span>Labor ({(preH + postH)}h × {currency} {settings.laborRate}/h)</span>
                  <span>{currency} {fmt(laborCost)}</span>
                </div>
              )}
              {packCost > 0 && (
                <div className="flex justify-between text-warm-500">
                  <span>Packaging</span>
                  <span>{currency} {fmt(packCost)}</span>
                </div>
              )}
              {shipCost > 0 && (
                <div className="flex justify-between text-warm-500">
                  <span>Shipping</span>
                  <span>{currency} {fmt(shipCost)}</span>
                </div>
              )}
              {failAdd > 0 && (
                <div className="flex justify-between text-warm-500">
                  <span>Failed print buffer ({failBuffer}%)</span>
                  <span>{currency} {fmt(failAdd)}</span>
                </div>
              )}
              {marginAdd > 0 && (
                <div className="flex justify-between text-warm-500">
                  <span>Your profit ({marginPct}%)</span>
                  <span>{currency} {fmt(marginAdd)}</span>
                </div>
              )}

              <div className="border-t border-warm-100 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-warm-400">
                  <span>Platform fee (12%)</span>
                  <span>− {currency} {fmt(platFee)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>You receive</span>
                  <span>{currency} {fmt(makerTake)}</span>
                </div>
                <div className="flex justify-between text-ink-900 font-bold text-sm pt-1.5 border-t border-warm-100 mt-1.5">
                  <span>Quote to client</span>
                  <span>{currency} {fmt(quotePrice)}</span>
                </div>
              </div>
            </div>
          )}

          {quotePrice > 0.01 && (
            <button
              type="button"
              onClick={() => {
                onUsePrice(Math.ceil(quotePrice * 100) / 100)
                setOpen(false)
              }}
              className="w-full rounded-xl bg-ink-900 text-white font-bold py-2.5 hover:bg-ink-700 transition-colors"
            >
              Use {currency} {fmt(Math.ceil(quotePrice * 100) / 100)} as my price
            </button>
          )}

          {!hasCalc && (
            <p className="text-warm-400 text-center py-2">Fill in the fields above to see your recommended price.</p>
          )}
        </div>
      )}
    </div>
  )
}
