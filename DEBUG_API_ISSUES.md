# 🔍 API CALLS NOT WORKING - DIAGNOSTIC GUIDE

## 📋 **Quick Checklist**

Before diving deep, check these common issues:

### 1️⃣ **Is the Backend Server Running?**

**Check Terminal/PowerShell:**
- Look for Flask server logs
- Should see: `* Running on http://192.168.1.72:5000`
- If not running: `cd "d:\Mik\Downloads\Me Hungie" ; python hungie_server.py`

**Test Backend Health:**
```bash
# In browser or curl:
http://192.168.1.72:5000/api/health

# Should return:
{"status": "healthy", ...}
```

---

### 2️⃣ **Network Configuration**

**Current API Configuration:**
- **Development Mode:** `http://192.168.1.72:5000` (local IP)
- **Production Mode:** Railway URL
- **Detection:** Uses React Native's `__DEV__` flag

**Potential Issues:**
- ❌ Local IP changed (192.168.1.72 → something else)
- ❌ Phone not on same WiFi network as computer
- ❌ Firewall blocking port 5000
- ❌ Server running on different port

**To Check Your Local IP:**
```bash
# Windows PowerShell:
ipconfig | Select-String "IPv4"

# Look for: IPv4 Address. . . . . . . . . . . : 192.168.1.XX
```

---

### 3️⃣ **Authentication Issues**

**Symptoms:**
- Login works but subsequent API calls fail
- Gets 401 Unauthorized errors
- Token not being sent with requests

**Check in Code:**
```javascript
// YesChefAPI.js should have:
getAuthHeaders() {
  return {
    'Authorization': `Bearer ${this.token}`,
    'Content-Type': 'application/json',
  };
}
```

**Debug in App:**
- Look for: `🐛 YesChefAPI: Making request:` logs
- Check if Authorization header is present
- Verify token exists after login

---

### 4️⃣ **Recent Changes That Could Break APIs**

**What We Changed Today:**
1. ✅ Fixed template_system import (backend) - FIXED
2. ✅ Removed login success alerts (mobile) - Should NOT affect APIs
3. ✅ Cleaned up root directory - Moved files to scripts/

**Potential Issues from Cleanup:**
- If server wasn't restarted after template_system fix
- If imports are still failing

---

## 🔬 **DETAILED INVESTIGATION STEPS**

### **Step 1: Check Server Status**

**Run this command:**
```bash
cd "d:\Mik\Downloads\Me Hungie"
python -c "import requests; print(requests.get('http://192.168.1.72:5000/api/health').json())"
```

**Expected:** `{'status': 'healthy', ...}`  
**If Error:** Server not running or wrong IP

---

### **Step 2: Check Mobile App Console**

**In Metro Bundler Console (where `npm start` is running):**

Look for these log patterns:

✅ **Normal (Working):**
```
🐛 YesChefAPI: Making request: GET http://192.168.1.72:5000/api/v2/recipes/user/11
🐛 YesChefAPI: Response: 200 ✅
```

❌ **Network Error:**
```
❌ YesChefAPI: Fetch error: Network request failed
```
→ **Cause:** Can't reach server (wrong IP, server down, not on WiFi)

❌ **401 Unauthorized:**
```
🐛 YesChefAPI: Response: 401 ❌
```
→ **Cause:** Token missing or invalid

❌ **503 Service Unavailable:**
```
🐛 YesChefAPI: Response: 503 ❌
Error: Template system not available
```
→ **Cause:** Server not restarted after template_system fix

---

### **Step 3: Test Specific Endpoints**

**Use curl or Postman to test directly:**

```bash
# 1. Health Check (no auth required)
curl http://192.168.1.72:5000/api/health

# 2. Login (should return token)
curl -X POST http://192.168.1.72:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tran.mich@gmail.com","password":"your_password"}'

# 3. Get Recipes (requires auth - use token from login)
curl http://192.168.1.72:5000/api/v2/recipes/user/11 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### **Step 4: Check Server Logs**

**In the terminal where server is running, look for:**

✅ **Normal:**
```
INFO:werkzeug:127.0.0.1 - - [28/Oct/2025 10:30:15] "GET /api/v2/recipes/user/11 HTTP/1.1" 200 -
```

❌ **Errors:**
```
ERROR:app:Template system not available
ERROR:app:Failed to authenticate user
```

---

## 🎯 **COMMON ISSUES & SOLUTIONS**

### **Issue 1: "Network request failed"**

**Causes:**
- Server not running
- Wrong IP address
- Phone not on same WiFi
- Firewall blocking

**How to Check:**
1. Ping the server: `ping 192.168.1.72`
2. Check server is running: Look for Flask process
3. Check IP hasn't changed: `ipconfig`
4. Try from browser on phone: http://192.168.1.72:5000/api/health

---

### **Issue 2: "401 Unauthorized"**

**Causes:**
- Token not saved after login
- Token expired
- Token not sent with request

**How to Check:**
1. Check `this.token` is set after login
2. Check `getAuthHeaders()` includes Authorization
3. Check token is being passed to API calls

---

### **Issue 3: "503 Service Unavailable"**

**Causes:**
- template_system import still failing
- Server needs restart

**How to Fix:**
1. Stop server (Ctrl+C)
2. Restart: `python hungie_server.py`
3. Look for: `✅ Template recipe system loaded`

---

### **Issue 4: Some APIs work, others don't**

**Causes:**
- Mixed v1/v2 endpoints
- Some endpoints missing
- Different authentication requirements

**How to Check:**
1. Note which endpoints fail
2. Check if they're v1 or v2
3. Check if endpoint exists in hungie_server.py

---

## 📝 **WHAT TO REPORT**

**Please share:**

1. **Metro Bundler Console Output** (full log when making API call)
2. **Server Terminal Output** (Flask server logs)
3. **Which specific API calls are failing** (login, get recipes, etc.)
4. **Error messages** (exact text from console)
5. **Server status:**
   ```bash
   # Run and share output:
   curl http://192.168.1.72:5000/api/health
   ```

---

## 🔧 **QUICK FIXES TO TRY**

### **Fix 1: Restart Everything**
```bash
# 1. Stop server (Ctrl+C)
# 2. Stop Metro bundler (Ctrl+C in terminal running npm start)
# 3. Restart server:
cd "d:\Mik\Downloads\Me Hungie"
python hungie_server.py

# 4. In new terminal, restart Metro:
cd "d:\Mik\Downloads\Me Hungie\YesChefMobile"
npm start

# 5. Reload app on phone
```

### **Fix 2: Check and Update IP**
```bash
# Get your current IP:
ipconfig | Select-String "IPv4"

# If it's different from 192.168.1.72, you need to update:
# YesChefMobile/src/services/YesChefAPI.js line 13
```

### **Fix 3: Clear App Cache**
```bash
# In YesChefMobile folder:
expo start -c
# (starts with cleared cache)
```

---

## 📞 **Next Steps**

1. **Run health check:** `curl http://192.168.1.72:5000/api/health`
2. **Check Metro console** for error messages
3. **Share findings** - what errors do you see?

Then we can pinpoint the exact issue! 🎯
