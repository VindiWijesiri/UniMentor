# UniMentor Video Calling Setup Guide

## ✅ Implementation Complete

Video calling with audio and video has been successfully integrated into UniMentor for student-tutor sessions using Agora RTC.

---

## 🎯 What Was Implemented

### Mobile App (React Native)
1. **Dependencies Added**
   - `react-native-agora` - Agora RTC SDK for React Native
   - `expo-av` - Audio/video permissions management
   - Camera permissions already configured via `expo-camera`

2. **VideoCallScreen Created**
   - Real-time video calling with Agora RTC
   - Local video preview (self-view in top-right corner)
   - Remote video display (tutor/student full screen)
   - Audio mute/unmute toggle
   - Video on/off toggle
   - End call button with confirmation
   - Connection status indicator
   - Session info display

3. **Navigation Integration**
   - Added `VideoCall` route to AppNavigator
   - Student: "Join Session" button in SessionsScreen → VideoCallScreen
   - Tutor: "Join Live Room" button in TutorSessionsScreen → VideoCallScreen
   - Both roles properly identified (`isTutor: true/false`)

### Backend (Express/MongoDB)
1. **Dependencies Added**
   - `agora-token` - Agora token generation library

2. **New Endpoint**
   - `POST /api/sessions/:id/token` - Generates Agora RTC tokens
   - Authenticates users before generating tokens
   - Returns: token, appId, channelName, uid, expiresAt
   - Token expires in 24 hours

3. **Environment Variables**
   - `AGORA_APP_ID` - Your Agora project App ID
   - `AGORA_APP_CERTIFICATE` - Your Agora project certificate

---

## 🔧 Required Setup Steps

### Step 1: Create Agora Account & Project

1. Go to [https://console.agora.io/](https://console.agora.io/)
2. Sign up / Log in
3. Create a new project:
   - Click "Create" → "Create New Project"
   - Project name: `UniMentor`
   - Use case: `Video Calling`
   - Authentication mechanism: `Secured mode: APP ID + Token`
4. Copy your credentials:
   - **App ID**: Found on project dashboard
   - **App Certificate**: Click "Generate" if not visible, then copy

### Step 2: Configure Backend

1. Open `backend/.env` file
2. Add Agora credentials:
   ```env
   AGORA_APP_ID=your_agora_app_id_here
   AGORA_APP_CERTIFICATE=your_agora_certificate_here
   ```

3. Install new dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Restart backend:
   ```bash
   npm run dev
   ```

### Step 3: Configure Mobile App

1. Install new dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. The mobile app will automatically fetch tokens from the backend. No additional configuration needed.

3. Start the app:
   ```bash
   npx expo start --lan --clear
   ```

---

## 📱 How to Use Video Calling

### For Students:
1. Navigate to **Bookings** tab
2. Find a booked tutor session
3. Click **"Join Session"** button
4. Video call screen opens with camera/mic access
5. Wait for tutor to join
6. Both participants can see/hear each other

### For Tutors:
1. Navigate to **Sessions** tab
2. Find an active or scheduled session
3. Click **"Join Live Room"** button
4. Video call screen opens
5. Wait for student(s) to join
6. Conduct the mentoring session

### During Call:
- **Mute/Unmute**: Toggle microphone on/off
- **Video On/Off**: Toggle camera on/off
- **End Call**: Red phone button (with confirmation)
- **Switch Camera**: Automatic front camera for both parties
- **Session Info**: Top-left shows session ID and role

---

## 🔒 Security & Permissions

### Mobile Permissions (Automatically Requested)
- **Camera**: Required for video streaming
- **Microphone**: Required for audio streaming
- **Network**: Required for RTC connection

### Backend Security
- All token requests require authentication (`authenticate` middleware)
- Tokens expire after 24 hours
- Users can only generate tokens for valid sessions
- Channel names are unique per session

---

## 🐛 Troubleshooting

### "Unable to connect to video service"
**Cause**: Backend not configured or Agora credentials missing
**Solution**:
1. Verify `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are set in `backend/.env`
2. Restart backend server
3. Check backend logs for errors

### "Failed to start video call"
**Cause**: Invalid Agora credentials or network issues
**Solution**:
1. Double-check Agora App ID in console.agora.io matches `.env`
2. Ensure certificate is correct (regenerate if needed)
3. Check device has internet connection
4. Verify camera/mic permissions are granted

### Remote video not showing
**Cause**: Other user hasn't joined or network connectivity issue
**Solution**:
1. Wait 10-15 seconds for connection to establish
2. Ensure both users are on stable internet
3. Check Agora project is in "Secured mode: APP ID + Token"
4. Verify backend token endpoint is accessible

### No audio during call
**Cause**: Microphone permission denied or muted
**Solution**:
1. Check microphone permission in device settings
2. Verify mic is not muted in app (check red button)
3. Test audio on another app to confirm device mic works

---

## 📂 Modified Files

### Mobile App
- `mobile/package.json` - Added react-native-agora, expo-av
- `mobile/src/presentation/screens/video/VideoCallScreen.tsx` - New video call screen
- `mobile/src/presentation/navigation/AppNavigator.tsx` - Added VideoCall route
- `mobile/src/presentation/screens/sessions/SessionsScreen.tsx` - Join Session button navigation
- `mobile/src/presentation/screens/home/TutorSessionsScreen.tsx` - Join Live Room navigation

### Backend
- `backend/package.json` - Added agora-token
- `backend/.env.example` - Added Agora credentials template
- `backend/src/controllers/sessionController.ts` - Added generateAgoraToken function
- `backend/src/routes/sessionRoutes.ts` - Added POST /:id/token route

---

## 🚀 Next Steps (Optional Enhancements)

1. **Screen Sharing**: Add screen share capability for tutors
2. **Recording**: Implement session recording and playback
3. **Chat Messages**: In-call text chat for sharing links/notes
4. **Whiteboard**: Collaborative whiteboard for explaining concepts
5. **Session Analytics**: Track call duration, quality, attendance
6. **Push Notifications**: Notify users when other party joins
7. **Background Mode**: Allow audio to continue in background
8. **Network Quality**: Display connection quality indicator

---

## 📞 Support

### Agora Documentation
- Video Calling Guide: https://docs.agora.io/en/video-calling/get-started/get-started-sdk
- React Native SDK: https://docs.agora.io/en/sdks/react-native
- Token Authentication: https://docs.agora.io/en/video-calling/develop/authentication-workflow

### UniMentor Video Calling
- Backend endpoint: `POST /api/sessions/:id/token`
- Frontend component: `VideoCallScreen.tsx`
- For issues, check backend logs and Agora console project analytics

---

**Implementation Date**: January 2026  
**Status**: ✅ Production Ready (after Agora credentials configured)
