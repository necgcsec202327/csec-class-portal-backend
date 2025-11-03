# 📦 Cloudinary Migration Guide

## 🚨 **Why You Need This**

Your old files were stored on **Render's disk storage** which is **ephemeral** (temporary). Every time Render restarts your server:
- 🗑️ All uploaded files get **deleted**
- ❌ URLs in database become **broken** (404 errors)
- 😞 Users can't access their downloads

**Solution:** Use **Cloudinary** - a cloud storage service with 25GB free tier!

---

## ⚡ **Quick Start (5 Minutes)**

### **Step 1: Get Cloudinary Credentials** (2 minutes)

1. Go to https://cloudinary.com/users/register_free
2. Sign up with your email (or use Google/GitHub)
3. After signup, you'll see your **Dashboard** with these credentials:

```
Cloud Name:    your-cloud-name-here
API Key:       123456789012345
API Secret:    abcdefghijklmnopqrstuvwxyz
```

**📸 Take a screenshot or note these down!**

---

### **Step 2: Configure Render** (2 minutes)

1. Go to https://dashboard.render.com
2. Click on your backend service: **`csec-class-portal-backend`**
3. Click **"Environment"** tab on the left
4. Click **"Add Environment Variable"** button
5. Add these **3 variables**:

| Key | Value | Example |
|-----|-------|---------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name from step 1 | `dxyz123abc` |
| `CLOUDINARY_API_KEY` | Your API key from step 1 | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Your API secret from step 1 | `abcXYZ123_secretKey` |

6. Click **"Save Changes"**
7. Render will automatically **redeploy** (wait 1-2 minutes)

---

### **Step 3: Clear Old Broken Files** (1 minute)

1. Open your admin dashboard: https://your-frontend-url.netlify.app/admin/dashboard.html
2. Login with admin credentials
3. Go to **"Resources"** tab
4. Click the red **"Clear All Files"** button
5. Confirm the warning dialog
6. ✅ All broken file URLs removed! (Folders are kept)

---

### **Step 4: Re-upload Files** (Time varies)

Now you need to **re-upload** all your study materials:

1. In the **Resources** tab, navigate to each folder
2. Click **"Upload File"** for each document
3. Files will now upload to **Cloudinary** (permanent storage!)
4. New URLs will look like: `https://res.cloudinary.com/your-cloud/...`

---

## ✅ **Verify Everything Works**

After completing the steps, test:

1. **Upload a test file:**
   - Go to Resources → Upload any PDF
   - Check the URL starts with `res.cloudinary.com`
   
2. **Test download:**
   - Click the file in the frontend
   - File should download/open correctly
   
3. **Check persistence:**
   - Wait a few hours or trigger a Render restart
   - Files should still be accessible (not deleted!)

---

## 🔍 **How to Check If Cloudinary Is Configured**

Run this in your terminal:

```bash
curl https://csec-class-portal-backend.onrender.com/api/health
```

**If configured correctly**, you should see:

```json
{
  "status": "ok",
  "cloudinary": {
    "configured": true,
    "cloud_name": "your-cloud-name"
  }
}
```

**If NOT configured**, you'll see:

```json
{
  "status": "ok",
  "cloudinary": {
    "configured": false
  }
}
```

---

## ❓ **FAQ**

### **Q: Will my old files come back?**
**A:** No, they're permanently deleted. You must re-upload them.

### **Q: Can I keep some files on Render disk?**
**A:** No, Render's disk is ephemeral. Use Cloudinary for all files.

### **Q: Is Cloudinary free?**
**A:** Yes! Free tier includes:
- 25GB storage
- 25GB bandwidth/month
- 1000s of transformations

### **Q: What happens if I don't configure Cloudinary?**
**A:** New uploads will use **base64 encoding** (stored in database). This works but:
- ⚠️ Database becomes huge (slow)
- ⚠️ Limited to small files (<5MB)
- ⚠️ Not recommended for production

### **Q: Can I migrate existing files automatically?**
**A:** No, because the original files are already deleted from Render. You must re-upload manually.

### **Q: How long does it take to re-upload everything?**
**A:** Depends on your internet speed and number of files. Estimate ~1-2 minutes per file.

---

## 🛟 **Troubleshooting**

### **Problem:** Files still showing 404 errors after configuration

**Solution:**
1. Check Cloudinary credentials are correct (no typos!)
2. Make sure you clicked "Save Changes" on Render
3. Wait for Render to finish redeploying
4. Clear old files using the "Clear All Files" button
5. Re-upload files

---

### **Problem:** Upload button not working

**Solution:**
1. Open browser console (F12)
2. Look for errors
3. Make sure you're logged in as admin
4. Try refreshing the page

---

### **Problem:** "Cloudinary not configured" message

**Solution:**
1. Go to Render dashboard
2. Click Environment tab
3. Verify all 3 environment variables are present
4. Values should NOT have quotes or spaces
5. Click "Save Changes" and wait for redeploy

---

## 📊 **Monitor Your Usage**

Check Cloudinary usage at: https://cloudinary.com/console/usage

You'll see:
- Storage used (out of 25GB)
- Bandwidth used this month
- Transformations count

---

## 🎯 **Best Practices**

1. ✅ **Name files clearly** - Use descriptive names (e.g., `Module-5-Notes.pdf`)
2. ✅ **Organize by subject** - Keep folders for each course
3. ✅ **Compress large files** - PDFs >10MB should be compressed
4. ✅ **Delete unused files** - Free up Cloudinary storage
5. ✅ **Backup important files** - Keep copies on your computer

---

## 🔐 **Security Notes**

- ✅ Cloudinary credentials are **secret** - Never share them!
- ✅ API Secret should only be on **backend** (never frontend)
- ✅ Files are **publicly accessible** by URL (by design)
- ✅ Users need your website link to find files (not searchable)

---

## 🚀 **What's Changed in the Code?**

### **Backend (`src/routes/resources.js`)**

**Before:**
```javascript
const storage = multer.diskStorage({
  destination: 'uploads/',  // ❌ Ephemeral storage
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
```

**After:**
```javascript
// ✅ Upload to Cloudinary cloud storage
if (cloudinary.config().cloud_name) {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'csec-resources',
    resource_type: 'auto'
  });
  fileUrl = result.secure_url; // https://res.cloudinary.com/...
}
```

### **Frontend (`js/admin/dashboard.js`)**

**Before:**
```javascript
const fileUrl = `${API_BASE_URL}${result.file.url}`; // ❌ Always concatenated
```

**After:**
```javascript
const fileUrl = result.file.url.startsWith('http') 
  ? result.file.url  // ✅ Use absolute URL as-is
  : `${API_BASE_URL}${result.file.url}`; // Fallback for relative URLs
```

---

## 📞 **Need Help?**

If you're stuck:
1. Check the [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md) file
2. Review error messages in browser console (F12)
3. Check Render logs for backend errors
4. Verify Cloudinary dashboard for upload activity

---

## ✨ **Done!**

Once you complete these steps:
- ✅ Files are **permanently stored** in the cloud
- ✅ Render restarts **won't delete** files
- ✅ Users can **reliably download** materials
- ✅ You can sleep peacefully 😴

**Estimated time:** 5-10 minutes + re-upload time

**Next:** Start fresh by uploading your study materials!
