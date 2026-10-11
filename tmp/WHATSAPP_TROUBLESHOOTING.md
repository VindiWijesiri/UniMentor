# WhatsApp Integration Troubleshooting

## 🔍 Current Issue
**Error**: "Access token is required" from WA Client API

## ✅ What We Know
- Backend received the booking request ✅
- Phone number was provided: `0767893782` ✅
- WhatsApp API was called ✅
- Auth token is in `.env` ✅
- Instance ID is in `.env` ✅

## ❌ Problem
WA Client API returned: `{ status: 'error', message: 'Access token is required' }`

## 🔧 Possible Causes

### 1. **Token Format Issue**
WA Client might expect the token in a specific format.

**Try these in `.env`:**
```env
# Option 1: Just the token (current)
WA_CLIENT_ACCESS_TOKEN=a98ebdd0e82f1104260307a36e41388418b7b285ac1b30b88e8bf0e450f5649b

# Option 2: With "Bearer" prefix
WA_CLIENT_ACCESS_TOKEN=Bearer a98ebdd0e82f1104260307a36e41388418b7b285ac1b30b88e8bf0e450f5649b
```

### 2. **API Endpoint Issue**
The endpoint might be different from the documentation.

**Verify in WA Client Dashboard:**
- Login: https://waclient.com/dashboard
- Check **API Documentation** section
- Look for the exact endpoint URL
- Common variations:
  - `https://api.waclient.com/api/send`
  - `https://api.waclient.com/send`
  - `https://waclient.com/api/send`

### 3. **Instance Not Connected**
Your WhatsApp instance might be disconnected.

**Check Status:**
1. Go to https://waclient.com/dashboard
2. Navigate to **Instances**
3. Check if instance `6ACA67B203B79` shows "Connected" ✅
4. If "Disconnected" ❌, scan QR code again

### 4. **Token Expired**
Access tokens might have expiration dates.

**Regenerate Token:**
1. Go to https://waclient.com/dashboard
2. Settings → API Tokens
3. Delete old token
4. Generate new token
5. Update `.env` with new token
6. Restart backend

## 🧪 Test Directly

### Test 1: Check Status
```bash
# In Postman or Insomnia
GET http://localhost:5000/api/whatsapp/status
Headers: Authorization: Bearer demo_student_token
```

**Expected Response (if configured):**
```json
{
  "configured": true,
  "status": "active"
}
```

### Test 2: Send Test Message
```bash
POST http://localhost:5000/api/whatsapp/test
Headers: Authorization: Bearer demo_student_token
Body: {
  "phoneNumber": "0767893782"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Test message sent successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Access token is required",
  "error": {...}
}
```

## 📞 Alternative: Direct WhatsApp Client Integration

If WA Client doesn't work, here's a fallback using WhatsApp URL scheme:

### Update BookingFlowScreen:
```typescript
const sendWhatsAppConfirmation = (transactionId: string, time: string) => {
  if (!studentPhone) return;

  const cleanPhone = studentPhone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('94') ? cleanPhone : `94${cleanPhone}`;

  const message = `🎓 *UniMentor Booking Confirmed*

Hi ${studentName}!

Your session with *${mentor.name}* has been booked.

📚 Subject: ${mentor.subjects?.[0]}
📅 Date: ${selectedDate}
⏰ Time: ${time}
💰 Amount: Rs. ${totalPayable.toLocaleString()}
🔖 ID: ${transactionId}

See you at the session! 🚀

- UniMentor Team`;

  const whatsappUrl = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;

  Linking.openURL(whatsappUrl).catch(err => {
    console.log('WhatsApp not available:', err);
  });
};
```

This opens WhatsApp app on user's device with pre-filled message.

## 📋 Next Steps

1. **Verify WA Client Dashboard**
   - Instance is connected ✅
   - Token is active ✅
   - API endpoint is correct ✅

2. **Check Backend Logs**
   ```bash
   cd backend
   npm run dev
   # Watch for: "✅ WhatsApp message sent" or "❌ WhatsApp send error"
   ```

3. **Try Test Endpoint**
   - Use `/api/whatsapp/test` to isolate the issue
   - Check exact error message from WA Client

4. **Contact WA Client Support**
   - Email: support@waclient.com
   - Provide: Token format issue, API endpoint docs
   - Ask: "How should I send access_token for /api/send endpoint?"

## 🎯 Working Alternatives

### Option A: Twilio WhatsApp API
- More expensive but very reliable
- Official WhatsApp partner
- Better documentation

### Option B: Direct WhatsApp Client (Current Fallback)
- Free
- Opens WhatsApp app on user's device
- User must press send manually
- Works immediately without server setup

### Option C: Meta Cloud API
- Official from Meta/Facebook
- Free tier available
- Complex business verification process

## 🔄 Current Workaround

Until WA Client works, the booking confirmation still succeeds and shows success modal. The WhatsApp message just doesn't send automatically.

**User Experience:**
- ✅ Booking is saved
- ✅ Payment is processed
- ✅ Success screen shows
- ⚠️ WhatsApp notification skipped (logged in console)

---

**Status**: Investigating WA Client token format  
**Priority**: Medium (booking works, just no WhatsApp notification)  
**ETA**: 15-30 minutes once WA Client credentials are verified
