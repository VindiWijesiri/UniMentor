# WA Client WhatsApp Integration Setup Guide

## ✅ Implementation Complete

UniMentor now sends WhatsApp booking confirmations via **WA Client API** (backend-to-backend integration).

---

## 🎯 Architecture

### Flow:
1. **Student books session** → Enters phone number → Confirms payment
2. **Mobile app** → Sends booking details to backend API
3. **Backend** → Calls WA Client API → Sends WhatsApp message
4. **Student** → Receives WhatsApp message automatically

### Why Backend Integration?
- ✅ No need to open WhatsApp app on user's device
- ✅ Messages sent automatically in background
- ✅ Works even if user doesn't have WhatsApp installed on booking device
- ✅ Professional, reliable delivery
- ✅ Can send to any phone number worldwide

---

## 🔧 Setup Instructions

### Step 1: Create WA Client Account

1. Go to [https://waclient.com](https://waclient.com)
2. Click **"Sign Up"** or **"Dashboard"**
3. Create your account
4. Verify your email

### Step 2: Get API Credentials

1. **Login to Dashboard**: https://waclient.com/dashboard
2. **Generate Access Token**:
   - Navigate to **Settings** → **API Tokens**
   - Click **"Generate New Token"**
   - Copy your `ACCESS_TOKEN`
   - Save it securely (you'll add to `.env`)

3. **Connect WhatsApp Instance**:
   - Go to **Instances** section
   - Click **"Add New Instance"**
   - Scan QR code with your WhatsApp (like WhatsApp Web)
   - Once connected, copy your `INSTANCE_ID`

### Step 3: Configure Backend

1. Open `backend/.env` file

2. Add WA Client credentials:
```env
# WA Client WhatsApp API
WA_CLIENT_API_URL=https://api.waclient.com/api
WA_CLIENT_ACCESS_TOKEN=your_access_token_here
WA_CLIENT_INSTANCE_ID=your_instance_id_here
```

3. Restart backend:
```bash
cd backend
npm run dev
```

---

## 📡 API Endpoints

### 1. Send Booking Confirmation
**POST** `/api/whatsapp/send-booking-confirmation`

**Headers:**
```json
{
  "Authorization": "Bearer <user_jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "phoneNumber": "0771234567",
  "studentName": "Vindi Wijesiri",
  "tutorName": "Tharushi Perera",
  "subject": "Data Structures",
  "date": "Monday, 13 Jan 2026",
  "time": "10:00 AM",
  "amount": 2500,
  "transactionId": "DP-LKR-1234567890"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "WhatsApp notification sent successfully",
  "sent": true,
  "messageId": "msg_abc123xyz"
}
```

**Response (Not Configured):**
```json
{
  "success": false,
  "message": "WhatsApp service not configured",
  "sent": false
}
```

### 2. Check Status
**GET** `/api/whatsapp/status`

**Response:**
```json
{
  "configured": true,
  "status": "active",
  "instance": {
    "id": "your-instance-id",
    "connected": true,
    "phone": "94771234567"
  }
}
```

### 3. Send Test Message
**POST** `/api/whatsapp/test`

**Request Body:**
```json
{
  "phoneNumber": "0771234567"
}
```

---

## 🧪 Testing

### Test from Postman/Insomnia:

1. **Get JWT Token** first (login to get user token)
   ```
   POST http://localhost:5000/api/auth/login
   ```

2. **Test WhatsApp Status**:
   ```
   GET http://localhost:5000/api/whatsapp/status
   Headers: Authorization: Bearer <token>
   ```

3. **Send Test Message**:
   ```
   POST http://localhost:5000/api/whatsapp/test
   Headers: Authorization: Bearer <token>
   Body: { "phoneNumber": "0771234567" }
   ```

4. **Send Booking Confirmation**:
   ```
   POST http://localhost:5000/api/whatsapp/send-booking-confirmation
   Headers: Authorization: Bearer <token>
   Body: { ... booking details ... }
   ```

### Test from Mobile App:

1. Complete a booking in the app
2. Enter your phone number in the modal
3. Complete payment
4. Check your WhatsApp → should receive confirmation message

---

## 📱 Message Format

The WhatsApp message sent to students:

```
🎓 *UniMentor Booking Confirmed*

Hi Vindi Wijesiri!

Your session with *Tharushi Perera* has been successfully booked.

📚 *Subject:* Data Structures
📅 *Date:* Monday, 13 Jan 2026
⏰ *Time:* 10:00 AM
💰 *Amount Paid:* Rs. 2,500
🔖 *Transaction ID:* DP-LKR-1234567890

See you at the session! 🚀

- UniMentor Team
```

---

## 🔐 Phone Number Handling

### Automatic Formatting:
- Input: `0771234567` → Sends to: `94771234567`
- Input: `771234567` → Sends to: `94771234567`
- Input: `94771234567` → Sends to: `94771234567`
- Input: `+94771234567` → Sends to: `94771234567`

### International Support:
The system currently adds **94** (Sri Lanka) by default. To support other countries:
1. Add country code selector in phone modal
2. Pass country code to backend
3. Backend uses that code instead of hardcoded `94`

---

## 🚨 Error Handling

### What Happens if WhatsApp Fails?
- ✅ Booking still completes successfully
- ✅ Payment is processed
- ✅ User sees success screen
- ⚠️ WhatsApp notification silently fails
- 📝 Error logged in backend console

### Common Errors:

**"WhatsApp service not configured"**
- **Cause**: `WA_CLIENT_ACCESS_TOKEN` or `WA_CLIENT_INSTANCE_ID` not set
- **Fix**: Add credentials to `backend/.env`

**"Instance not connected"**
- **Cause**: WhatsApp Web session expired
- **Fix**: Login to WA Client dashboard, reconnect instance

**"Invalid phone number"**
- **Cause**: Phone number format invalid
- **Fix**: Check phone number has at least 10 digits

**"API timeout"**
- **Cause**: WA Client API slow or down
- **Fix**: Check WA Client status page, retry later

---

## 📂 Implementation Files

### Backend:
- `backend/src/controllers/whatsappController.ts` - API logic
- `backend/src/routes/whatsappRoutes.ts` - Route definitions
- `backend/src/app.ts` - Route registration
- `backend/.env` - API credentials (not committed to git)
- `backend/.env.example` - Template with placeholders

### Mobile:
- `mobile/src/presentation/screens/booking/BookingFlowScreen.tsx`
  - Phone number collection modal
  - API call to backend after payment

---

## 💰 WA Client Pricing

Check current pricing at: https://waclient.com/pricing

**Typical Plans:**
- **Free Tier**: Limited messages for testing
- **Starter**: ~$10-20/month for basic usage
- **Pro**: Higher message limits, multiple instances
- **Enterprise**: Custom solutions, dedicated support

**Note**: Pricing varies, check their website for latest plans.

---

## 🔄 Alternative Options

If WA Client doesn't work for you:

1. **Twilio WhatsApp API**
   - Official WhatsApp partner
   - Template-based messages
   - Requires business verification

2. **Meta Cloud API**
   - Direct from Meta/Facebook
   - Free tier available
   - Complex setup process

3. **Other providers**: MessageBird, Vonage, InfoBip

---

## 📊 Monitoring

### Check Delivery Status:
1. Login to WA Client Dashboard
2. Navigate to **Messages** section
3. View sent messages, delivery status, timestamps

### Backend Logs:
```bash
cd backend
npm run dev

# Watch for:
✅ WhatsApp message sent via WA Client
❌ WhatsApp send error
```

---

## 🎯 Next Steps (Optional Enhancements)

1. **Delivery Receipts**: Use webhooks to track message delivery
2. **Tutor Notifications**: Send WhatsApp to tutor when student books
3. **Session Reminders**: Send reminder 1 hour before session
4. **Rich Media**: Send session materials, PDFs, images
5. **Two-way Chat**: Enable students to reply for quick questions
6. **Bulk Messaging**: Send announcements to all students

---

## 🆘 Support

**WA Client Support:**
- Documentation: https://docs.waclient.com
- Support Email: support@waclient.com
- Discord/Telegram: Check dashboard for community links

**UniMentor Integration Issues:**
- Check backend logs for errors
- Verify `.env` credentials are correct
- Test with `/api/whatsapp/test` endpoint first

---

**Implementation Date**: January 2026  
**Status**: ✅ Production Ready (after WA Client credentials configured)  
**Integration**: WA Client Web API  
**Backend**: Express.js + Axios  
**Mobile**: React Native + Fetch API
