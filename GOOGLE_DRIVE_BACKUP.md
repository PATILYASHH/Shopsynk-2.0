# Shopsynk Google Drive Backup Integration

## Overview
This feature provides automatic daily backups of all your Shopsynk data to Google Drive, ensuring your supplier and transaction information is safely stored and accessible.

## Features

### ✨ **Key Capabilities:**
- **🔗 Google Drive Integration**: Connect your Google account for secure cloud storage
- **⏰ Automatic Daily Backups**: Scheduled backups every day at midnight
- **📱 Manual Backup**: Create instant backups anytime
- **📊 Backup History**: Track all your backup activities
- **📥 Local Download**: Download backup files directly to your device
- **🔧 Flexible Settings**: Enable/disable auto-backup as needed

## Setup Instructions

### 1. **Connect Google Drive**
1. Go to the **Profile** page in Shopsynk
2. Find the "Google Drive Backup" section
3. Click "Connect Google Drive"
4. Authenticate with your Google account
5. Grant necessary permissions for file storage

### 2. **Configure Auto Backup**
- Once connected, auto-backup is enabled by default
- Backups run daily at midnight (your local timezone)
- Toggle the auto-backup switch to enable/disable
- All backups are stored in your Google Drive

### 3. **Manual Backup**
- Click "Backup Now" for immediate backup
- Useful before major data changes
- No limit on manual backup frequency

## What Gets Backed Up

Your backup includes:
- ✅ **All Suppliers**: Complete supplier database with contact information
- ✅ **All Transactions**: Purchase history, payments, and dues
- ✅ **Metadata**: Export date, user information, and data counts
- ✅ **Relationships**: Supplier-transaction linkages preserved

## Backup File Structure

```json
{
  "suppliers": [
    {
      "id": "uuid",
      "name": "Supplier Name",
      "contact_person": "Contact Person",
      "phone": "Phone Number",
      "email": "Email",
      "address": "Address",
      "created_at": "Date",
      "updated_at": "Date"
    }
  ],
  "transactions": [
    {
      "id": "uuid",
      "type": "new_purchase|pay_due|settle_bill",
      "amount": 1000,
      "description": "Transaction description",
      "due_date": "Date",
      "is_paid": true,
      "created_at": "Date",
      "supplier": {
        "name": "Supplier Name"
      }
    }
  ],
  "exportDate": "2025-08-25T10:00:00.000Z",
  "userEmail": "user@example.com"
}
```

## Email Notifications

You'll receive email notifications for:
- ✅ **Successful Backups**: Confirmation when backup completes
- ❌ **Failed Backups**: Alert when backup encounters issues
- 🔗 **Connection Issues**: Warning when Google Drive is disconnected

## Security & Privacy

### 🔒 **Data Protection:**
- All data is encrypted in transit and at rest
- OAuth 2.0 secure authentication with Google
- No passwords stored in Shopsynk
- You control all Google Drive permissions

### 🛡️ **Privacy Measures:**
- Backup files are stored only in your personal Google Drive
- No third-party access to your backup data
- You can revoke access anytime through Google Account settings
- Local downloads don't require internet connection

## Troubleshooting

### Common Issues:

**Connection Failed:**
- Check your internet connection
- Verify Google Drive has sufficient storage space
- Try disconnecting and reconnecting

**Backup Failed:**
- Ensure Google Drive connection is active
- Check if you have sufficient Google Drive storage
- Try a manual backup to test connection

**Missing Backups:**
- Check your Google Drive for backup files
- Verify auto-backup is enabled in settings
- Check backup history for error messages

### Support:
If you continue experiencing issues:
1. Check the backup history section for error details
2. Try downloading a local backup to verify data integrity
3. Disconnect and reconnect Google Drive
4. Contact Shopsynk support with error messages

## Production Setup (For Developers)

### Environment Variables:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Required Google APIs:
- Google Drive API v3
- Google OAuth 2.0

### Database Migration:
Run the backup system migration to create required tables:
- `user_backups` - Backup history tracking
- `user_settings` - Google Drive connection settings

## Usage Tips

### 💡 **Best Practices:**
- **Regular Monitoring**: Check backup history monthly
- **Before Major Changes**: Run manual backup before bulk data operations
- **Storage Management**: Clean old backups periodically from Google Drive
- **Security**: Review Google Drive permissions regularly

### 📈 **Optimization:**
- Enable auto-backup for peace of mind
- Use manual backups before important business periods
- Download local copies for offline access
- Monitor backup file sizes for storage planning

## File Locations

### In Google Drive:
- Backup files are stored in: `/Shopsynk Backups/`
- File naming: `shopsynk-backup-YYYY-MM-DD-HH-MM-SS.json`
- Organized chronologically for easy access

### Local Downloads:
- Downloads go to your default download folder
- File format: JSON (human-readable and parseable)
- Can be imported back into Shopsynk or analyzed externally

---

**📞 Need Help?**
Contact Shopsynk support for assistance with backup setup or issues.

**🔄 Last Updated:** August 25, 2025
