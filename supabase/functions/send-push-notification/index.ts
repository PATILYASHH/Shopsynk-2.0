import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationPayload {
  title: string
  body: string
  userId?: string
  userIds?: string[]
  url?: string
  image?: string
  tag?: string
  notificationId?: string
}

interface PushSubscription {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const payload: PushNotificationPayload = await req.json()
    const { title, body, userId, userIds, url, image, tag, notificationId } = payload

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine target users
    let targetUsers: string[] = []
    if (userId) {
      targetUsers = [userId]
    } else if (userIds) {
      targetUsers = userIds
    } else {
      return new Response(
        JSON.stringify({ error: 'Either userId or userIds must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get push subscriptions for target users
    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUsers)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found for specified users' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare push notification data
    const notificationData = {
      title,
      body,
      url: url || '/',
      image,
      tag: tag || 'shopsynk-notification',
      notificationId
    }

    // VAPID keys (you need to generate these)
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? 'BEl62iUYgUivxIkv69yViEuiBIa40HI80YS_qZfKsRBF2uMi85KZJw-q9_-k9Q_nM8F1jQk2dGvQQQ6VDNt-3hc'
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? 'your-private-key-here'

    // Send push notifications
    const pushPromises = subscriptions.map(async (subscription: PushSubscription) => {
      try {
        // Create push subscription object
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        // Import webpush library
        const webpush = await import('https://esm.sh/web-push@3.6.6')
        
        // Set VAPID details
        webpush.setVapidDetails(
          'mailto:your-email@example.com',
          vapidPublicKey,
          vapidPrivateKey
        )

        // Send notification
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationData)
        )

        return { success: true, userId: subscription.user_id }
      } catch (error) {
        console.error(`Failed to send push notification to user ${subscription.user_id}:`, error)
        return { success: false, userId: subscription.user_id, error: error.message }
      }
    })

    const results = await Promise.allSettled(pushPromises)
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length
    const failed = results.length - successful

    return new Response(
      JSON.stringify({
        message: 'Push notifications processed',
        successful,
        failed,
        total: results.length,
        details: results.map(result => result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' })
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
