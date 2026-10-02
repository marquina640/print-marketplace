import { NextRequest, NextResponse } from 'next/server'
import { inviteMakerToJob } from '@/app/actions/invitations'

export async function POST(req: NextRequest) {
  try {
    const { jobId, makerId } = await req.json()
    if (!jobId || !makerId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    const result = await inviteMakerToJob(jobId, makerId)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
