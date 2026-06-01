'use client'

import { useState } from 'react'

export function EarningsCalculator() {
  const [jobsPerWeek, setJobsPerWeek] = useState(3)
  const [avgJobValue, setAvgJobValue] = useState(45)

  const gross = jobsPerWeek * avgJobValue * 4
  const net = Math.round(gross * 0.88)

  return (
    <div className="rounded-2xl bg-[#1a1535] text-white p-6 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xl">💰</span>
        <h3 className="font-bold text-base">Earnings estimator</h3>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#CEC8E4]">Jobs per week</span>
            <span className="font-bold text-[#D4A017]">{jobsPerWeek} job{jobsPerWeek !== 1 ? 's' : ''}</span>
          </div>
          <input
            type="range" min="1" max="20" value={jobsPerWeek}
            onChange={(e) => setJobsPerWeek(Number(e.target.value))}
            className="w-full accent-[#D4A017]"
          />
          <div className="flex justify-between text-xs text-[#9d97c4] mt-1">
            <span>1</span><span>20</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#CEC8E4]">Average job value</span>
            <span className="font-bold text-[#D4A017]">${avgJobValue}</span>
          </div>
          <input
            type="range" min="10" max="200" step="5" value={avgJobValue}
            onChange={(e) => setAvgJobValue(Number(e.target.value))}
            className="w-full accent-[#D4A017]"
          />
          <div className="flex justify-between text-xs text-[#9d97c4] mt-1">
            <span>$10</span><span>$200</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white/10 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#9d97c4] mb-0.5">Est. monthly earnings</p>
          <p className="text-3xl font-black text-white">${net.toLocaleString()}</p>
          <p className="text-xs text-[#9d97c4] mt-0.5">after 12% platform fee</p>
        </div>
        <div className="text-right text-xs text-[#9d97c4] space-y-1">
          <p>{jobsPerWeek} × ${avgJobValue} × 4 weeks</p>
          <p>= ${gross.toLocaleString()} gross</p>
          <p>− 12% = <span className="text-white font-semibold">${net.toLocaleString()}</span></p>
        </div>
      </div>

      <p className="text-xs text-[#6b6580] text-center">
        Estimates only. Actual earnings depend on demand in your area and your pricing.
      </p>
    </div>
  )
}
