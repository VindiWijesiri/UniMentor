# App Icon Instructions

## Current Icons
- `icon.png` - Main app icon with UniMentor logo
- `adaptive-icon.png` - Android adaptive icon (foreground)
- `splash.png` - Splash screen shown while app loads

## To Update Icons (Without Text)

### Requirements
- Icon should be **1024x1024 pixels** (PNG format)
- Icon should be **logo only** (no "UniMentor" text)
- Background should be **transparent** or white
- Must be the graduation cap logo in blue (#1565C0) and yellow (#FFA000)

### Files to Replace
1. **`icon.png`** (1024x1024) - Main app icon
2. **`adaptive-icon.png`** (1024x1024) - Android adaptive icon foreground
3. **`splash.png`** (1284x2778 or similar) - Splash screen with logo centered

### How to Update
1. Create your logo without text (just the graduation cap icon)
2. Resize to 1024x1024 pixels
3. Replace the existing `icon.png` and `adaptive-icon.png`
4. For splash screen, place logo on blue background (#1565C0)
5. Run `npx expo start --clear` to see changes

### Background Colors (app.json)
- iOS: No specific background (uses icon itself)
- Android: `#1565C0` (blue) - set in app.json adaptive icon backgroundColor
- Splash: `#1565C0` (blue) - set in app.json splash backgroundColor

## Current Status
The existing icons still have "UniMentor" text. Replace them with logo-only versions as described above.

To generate icons automatically from a single 1024x1024 PNG:
```bash
npx expo install expo-splash-screen
npx expo prebuild --clean
```

Or use online tools:
- https://www.appicon.co/
- https://hotpot.ai/icon-resizer
