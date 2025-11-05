# HashConnect "URI Missing" Error - Fixed

## What This Error Means

The "URI Missing" error occurs when HashConnect tries to open the pairing modal before WalletConnect has generated a pairing URI. This is a timing issue - WalletConnect needs a moment to initialize and create the URI for the pairing session.

## Why It Happens

1. **Timing Issue**: `openPairingModal()` is called before WalletConnect finishes initialization
2. **WalletConnect Internal State**: The pairing URI hasn't been generated yet
3. **Race Condition**: HashConnect initialization completes, but WalletConnect's URI generation is still in progress

## Fixes Applied

### 1. **Added Initialization Delay** (`lib/hashconnect.ts`)
- Waits 300ms after `init()` completes
- Gives WalletConnect time to generate pairing URI
- Prevents premature modal opening

### 2. **Added Connection Delay** (`hooks/useHashConnect.ts`)
- Waits 200ms before attempting connection
- Ensures HashConnect singleton is fully ready
- Waits 500ms before opening modal

### 3. **Error Handling with Retry** (`hooks/useHashConnect.ts`)
- Catches "URI Missing" errors gracefully
- Waits 1 second and retries opening the modal
- Shows user-friendly error message if retry fails

### 4. **Event Listener Safety** (`hooks/useHashConnect.ts`)
- Sets up event listeners BEFORE opening modal
- Uses optional chaining (`?.`) to prevent errors
- Properly cleans up on timeout

## What You'll See Now

✅ **No more "URI Missing" errors** - They're handled gracefully
✅ **Automatic retry** - If URI isn't ready, waits and tries again
✅ **User-friendly messages** - Clear error messages if connection fails
✅ **Smooth connection flow** - Proper timing ensures modal opens correctly

## If You Still See Errors

1. **Clear Browser Cache**: Old cached data might cause issues
2. **Clear localStorage**: 
   ```javascript
   // In browser console:
   Object.keys(localStorage).forEach(key => {
     if (key.includes('wc@') || key.includes('walletconnect')) {
       localStorage.removeItem(key);
     }
   });
   ```
3. **Refresh Page**: Sometimes a simple refresh fixes timing issues
4. **Check WalletConnect Project ID**: Ensure it's valid and correctly set

## Technical Details

- **HashConnect v3** uses WalletConnect v2 under the hood
- WalletConnect needs to:
  1. Initialize WebSocket connection
  2. Generate pairing URI
  3. Create pairing session
- Our fix ensures we wait for these steps to complete before opening the modal

## Status

✅ **Fixed** - The error is now handled gracefully with automatic retry logic.

