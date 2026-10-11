# Gmail SMTP Setup Guide for Email Verification

## Why Email Verification Isn't Working

Your backend needs Gmail SMTP credentials to send verification codes for:
- Password reset
- Email verification during registration
- Login codes (2FA)

## How to Setup Gmail App Password

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Click **2-Step Verification**
3. Follow the steps to enable it (required for app passwords)

### Step 2: Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Sign in if prompted
3. In "Select app" dropdown → choose **Mail**
4. In "Select device" dropdown → choose **Other (Custom name)**
5. Type: `UniMentor Backend`
6. Click **Generate**
7. Copy the **16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update Backend .env File

Open `backend/.env` and update these lines:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASS=abcdefghijklmnop
```

**Important:** Remove all spaces from the app password!

### Step 4: Update Render Environment Variables

1. Go to https://dashboard.render.com
2. Open your `unimentor-backend-5b5w` service
3. Go to **Environment** tab
4. Add:
   - `GMAIL_USER` = `your-email@gmail.com`
   - `GMAIL_APP_PASS` = `abcdefghijklmnop` (no spaces)
5. Click **Save Changes** (Render will redeploy)

### Step 5: Test Email Verification

After Render finishes deploying:

1. Open your app
2. Try **Forgot Password** or **Register**
3. You should receive a 6-digit verification code via email within seconds!

## Troubleshooting

### "Less secure app access" error
- Make sure you created an **App Password**, not using your regular Gmail password
- App passwords only work if 2-Step Verification is enabled

### Still not receiving emails
- Check spam folder
- Verify `GMAIL_USER` is correct
- Verify `GMAIL_APP_PASS` has no spaces
- Check Render logs for error messages

### Alternative: Use a different Gmail account
If you don't want to use your personal Gmail:
1. Create a new Gmail account specifically for UniMentor
2. Enable 2-Step Verification
3. Generate App Password
4. Use those credentials in .env

## Current Status

✅ Backend code is ready (nodemailer configured)
❌ Gmail credentials not set → **emails not sending**
❌ Render environment variables not set → **emails won't work in production**

## Summary

**To fix email verification:**
1. Create Gmail App Password (5 minutes)
2. Update `backend/.env` with credentials
3. Update Render environment variables
4. Wait for Render to redeploy (~3 minutes)
5. Test forgot password/registration → should receive email! ✅
