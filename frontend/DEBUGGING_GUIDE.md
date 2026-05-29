# Debugging 400 Error Guide

## What I Fixed:
1. ✅ Enhanced error messages in middleware (more specific 401 errors instead of generic 400)
2. ✅ Added cookie options: `httpOnly: false`, `secure: false`, `sameSite: 'Lax'`
3. ✅ Improved CORS configuration with explicit methods and headers
4. ✅ Better error handling for TokenExpiredError and JsonWebTokenError
5. ✅ Added console logging for debugging

## How to Check Which Error You're Getting:

### Step 1: Open Browser DevTools
1. Open your app at `http://localhost:5173`
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab

### Step 2: Try the Action That Causes 400 Error
- If you get an error, look for the response body in **Network** tab

### Step 3: Check Each Possible Error:

**Error: "Authentication token is missing"**
- Solution: Make sure you're logged in first
- Check Application/Storage > Cookies for `token` cookie

**Error: "Token has expired"**
- Solution: Your session expired, login again

**Error: "User account not found"**
- Solution: User doesn't exist in database (requires admin check)

**Error: "Admin access required"**
- Solution: This account is not an admin account

## Quick Checklist:

```
☐ Are you logged in? (Check if token cookie exists)
☐ Is the token valid? (Check browser console for error message)
☐ Is the user still in database? (Check MongoDB)
☐ Is the token expired? (Login again to get fresh token)
☐ Are you running backend on port 3000? (Check npm output)
☐ Are you running frontend on port 5173? (Check Vite output)
```

## How to Verify the Fix:

### Method 1: Check Network Tab
1. Open DevTools → Network tab
2. Login and perform an action
3. Look for API calls - you should see:
   - Status: 200 or 201 (success)
   - NOT 400 or 401

### Method 2: Check Console
1. Open DevTools → Console tab
2. You should see debug messages like:
   ```
   Auth middleware: User authenticated successfully
   ```

## If You Still Get 400 Error:

1. **Check Backend Terminal**: Look for error logs like:
   ```
   Auth middleware error: ...
   ```

2. **Enable More Logging**: Add this in ProblemPage.jsx:
   ```javascript
   axiosClient.interceptors.response.use(
     response => response,
     error => {
       console.error('Full error response:', error.response?.data);
       return Promise.reject(error);
     }
   );
   ```

3. **Test Authentication Endpoint**:
   - POST http://localhost:3000/user/login
   - Body: `{"emailId": "your@email.com", "password": "password"}`
   - Check if you get a token cookie back

## Next Steps:

1. Restart your backend server: `npm start` (in DAY9 folder)
2. Restart your frontend: Check Vite terminal
3. Clear browser cookies: DevTools → Application → Cookies → Delete all
4. Try logging in again
5. Try accessing a problem page

If errors persist, share the exact error message from the Network tab response body!
