# Windows Firewall Setup for Local Development

## Issue
Your phone can't reach the backend running on your computer because Windows Firewall blocks incoming connections on port 5000.

## Solution
Run this command **as Administrator** in PowerShell:

```powershell
netsh advfirewall firewall add rule name="UniMentor Backend 5000" dir=in action=allow protocol=TCP localport=5000
```

## How to Run as Administrator
1. Press `Windows + X`
2. Select "Terminal (Admin)" or "PowerShell (Admin)"
3. Paste the command above
4. Press Enter

## Verify It Worked
After running the command, check if the rule was added:
```powershell
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*UniMentor*" }
```

You should see: "UniMentor Backend 5000" rule listed.

## Alternative: Windows Firewall GUI
If you prefer using the GUI:
1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" on the left
3. Click "New Rule..." on the right
4. Select "Port" → Next
5. Select "TCP" and enter "5000" → Next
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name: "UniMentor Backend 5000" → Finish

## Current Status
- ✅ Backend running on: `http://192.168.1.5:5000`
- ✅ Mobile app configured to use: `http://192.168.1.5:5000/api`
- ⚠️ Firewall rule needed (run command above)

## After Firewall is Configured
1. Reload your app on the phone (pull down to refresh)
2. The network error should disappear
3. You should be able to login and use all features

## Port 8081 (Already Working)
Port 8081 for Expo Metro bundler is already allowed (you added it earlier).
