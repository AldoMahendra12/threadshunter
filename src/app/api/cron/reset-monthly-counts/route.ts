import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  // Protect cron route
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // Reset messages_sent_this_month for all users
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        messages_sent_this_month: 0,
        month_reset_at: new Date().toISOString()
      })
      .not('id', 'is', null) // Target all user profiles

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, message: 'Monthly limits reset successfully.' })
  } catch (err: any) {
    console.error('Monthly reset error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
