# Troubleshooting Guide

## HashConnect WalletConnect Errors

### Common Errors

#### "hashconnect - URI Missing"
**Cause:** WalletConnect is trying to access pairing data that doesn't exist or expired.

**Solution:** This error is harmless and has been handled. The app will:
- Clear stale localStorage data automatically
- Retry initialization
- Continue working normally

#### "No matching key. expirer: topic:..."
**Cause:** WalletConnect's internal cleanup mechanism trying to remove expired pairing sessions.

**Solution:** These are cleanup messages, not actual errors. They've been:
- Converted to debug-level logs
- Handled gracefully with automatic cleanup
- Won't affect wallet functionality

### Fixes Applied

1. **Automatic Cleanup:** Stale WalletConnect localStorage data is cleared on app load
2. **Error Handling:** HashConnect initialization handles these errors gracefully
3. **Debug Mode:** Set to `false` to reduce console noise
4. **Retry Logic:** Automatically retries initialization after clearing stale data

### Manual Cleanup (if needed)

If you still see errors, you can manually clear localStorage:

```javascript
// Open browser console and run:
Object.keys(localStorage).forEach(key => {
  if (key.includes('wc@') || key.includes('walletconnect') || key.includes('WCM')) {
    localStorage.removeItem(key);
  }
});
```

Then refresh the page.

### Verification

After these fixes, you should see:
- ✅ No red error messages in console
- ✅ Wallet connection works normally
- ✅ Only debug-level messages (if any)

If errors persist, they're likely from WalletConnect's internal cleanup and won't affect functionality.

