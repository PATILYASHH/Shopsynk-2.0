# Push Notification Setup Guide

Your Shopsynk PWA now supports **background push notifications**! Users will receive notifications even when the app is completely closed.

## 🚀 Features Added

✅ **Background Push Notifications** - Works even when PWA is closed  
✅ **Service Worker Integration** - Enhanced PWA capabilities  
✅ **Push Subscription Management** - Automatic subscription handling  
✅ **User Preferences** - Enable/disable push notifications  
✅ **Supabase Integration** - Database storage for subscriptions  
✅ **Edge Function** - Server-side push notification sending  

## 📁 Files Created/Modified

### New Files:
- `src/services/PushNotificationService.ts` - Push notification management
- `src/components/PushNotificationSettings.tsx` - User settings UI
- `supabase/migrations/20250901000003_create_push_subscriptions.sql` - Database table
- `supabase/functions/send-push-notification/index.ts` - Edge function for sending
- `generate-vapid-keys.js` - VAPID key generation helper

### Modified Files:
- `public/sw.js` - Enhanced service worker with push support
- `src/services/NotificationService.ts` - Added push notification sending
- `src/contexts/NotificationContext.tsx` - Integrated push initialization
- `src/pages/Profile.tsx` - Added push notification settings

## 🔧 Setup Instructions

### 1. Apply Database Migration
```bash
# In Supabase dashboard, apply the migration:
# supabase/migrations/20250901000003_create_push_subscriptions.sql
```

### 2. Generate VAPID Keys
```bash
npm install web-push
npx web-push generate-vapid-keys
```

### 3. Update Keys in Code
Update these files with your generated VAPID keys:
- `src/services/PushNotificationService.ts` (line 92) - Public key
- `supabase/functions/send-push-notification/index.ts` (lines 96-97) - Both keys

### 4. Deploy Edge Function
```bash
supabase functions deploy send-push-notification
```

### 5. Set Environment Variables
In Supabase Dashboard > Edge Functions > Environment Variables:
```
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

## 🔔 How It Works

### For Users:
1. **Enable Notifications**: Go to Profile > Push Notifications > Enable
2. **Automatic Subscription**: App registers for push notifications
3. **Background Notifications**: Receive notifications even when app is closed
4. **Click to Open**: Clicking notification opens the app to relevant page

### For Developers:
1. **Real-time + Push**: Combines Supabase Realtime with Web Push API
2. **Fallback Strategy**: Falls back to browser notifications if push fails
3. **Subscription Management**: Automatic subscription cleanup and renewal
4. **Cross-platform**: Works on mobile PWA and desktop browsers

## 📱 User Experience

### When App is Open:
- Real-time notifications via Supabase Realtime
- In-app notification dropdown updates instantly
- Browser notifications for background tabs

### When App is Closed:
- Background push notifications via service worker
- Native OS notification style
- Click notification to open app
- Automatic "read" status when clicked

## 🛠 Testing Push Notifications

### 1. Enable in Development:
- Open app in Chrome/Edge (HTTPS required)
- Go to Profile page
- Enable push notifications
- Check browser console for subscription success

### 2. Test Background Mode:
- Close browser completely
- Add transaction from another device/user
- Should receive native OS notification

### 3. Debug Issues:
- Check browser console for errors
- Verify VAPID keys are correct
- Test push subscription in DevTools > Service Workers
- Check Supabase Edge Function logs

## 🔐 Security & Privacy

- **User Consent**: Explicit permission required
- **Secure Storage**: Push subscriptions encrypted in database
- **VAPID Keys**: Secure authentication for push service
- **RLS Policies**: Database access controlled per user
- **Easy Disable**: Users can disable anytime in Profile

## 🚨 Production Checklist

- [ ] Generate production VAPID keys
- [ ] Deploy Edge Function to production
- [ ] Set production environment variables
- [ ] Test on production domain (HTTPS required)
- [ ] Update service worker cache version
- [ ] Test cross-browser compatibility

## 💡 Usage Examples

### Scenario: Multi-Owner Business
1. **Owner A** adds transaction: ₹5000 supplies from ABC Store
2. **Owner B** (app closed) receives push notification:
   - "New Transaction Added"  
   - "Owner A purchased ₹5,000 supplies from ABC Store"
3. **Owner B** clicks notification → App opens to supplier detail
4. **Real-time sync** ensures all data is current

## 🐛 Troubleshooting

### Push Notifications Not Working:
1. **Check HTTPS**: Push requires secure context
2. **Verify VAPID Keys**: Must match in client and server
3. **Browser Support**: Not supported in all browsers
4. **Permission Denied**: User must grant permission
5. **Service Worker**: Must be registered successfully

### Common Errors:
- `applicationServerKey` type error → Cast to `BufferSource`
- VAPID key mismatch → Regenerate and update all locations
- Subscription failed → Check browser console and network tab
- Edge function failed → Check Supabase function logs

## 📈 Next Enhancements

Possible future improvements:
- **Rich Notifications**: Images, action buttons, custom sounds
- **Notification Categories**: Different types (urgent, info, etc.)
- **Batching**: Group multiple notifications  
- **Analytics**: Track notification delivery and engagement
- **Offline Support**: Queue notifications when offline

---

**Your notification system is now enterprise-ready! 🎉**

Users can stay connected to their business even when the app is closed, ensuring they never miss important transactions or updates.
