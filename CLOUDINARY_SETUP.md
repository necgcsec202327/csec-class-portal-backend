# 🌟 Cloudinary Setup Guide

## Why Cloudinary?
- ✅ **FREE**: 25GB storage + 25GB bandwidth/month
- ✅ **Fast CDN**: Worldwide delivery
- ✅ **Reliable**: 99.9% uptime
- ✅ **Perfect for 60 users**: More than enough capacity
- ✅ **Easy to use**: 5-minute setup

---

## 📝 Step 1: Create Cloudinary Account (2 minutes)

1. Go to: https://cloudinary.com/users/register/free
2. Fill in:
   - Email
   - Password
   - Choose a cloud name (e.g., `csec-portal` or `your-name`)
3. Verify email
4. Done! ✅

---

## 🔑 Step 2: Get Your API Credentials (1 minute)

1. Go to: https://cloudinary.com/console
2. You'll see your **Dashboard**
3. Copy these 3 values:
   ```
   Cloud name: your-cloud-name
   API Key: 123456789012345
   API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
   ```

---

## ⚙️ Step 3: Add to Render Environment Variables (2 minutes)

### On Render.com:

1. Go to: https://dashboard.render.com
2. Click on your **backend service** (csec-class-portal-backend)
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add these 3 variables:

```
CLOUDINARY_CLOUD_NAME = your-cloud-name
CLOUDINARY_API_KEY = your-api-key-here
CLOUDINARY_API_SECRET = your-api-secret-here
```

6. Click **Save Changes**
7. Render will **auto-redeploy** (takes 2-3 minutes)

---

## ✅ Step 4: Test It! (1 minute)

1. Wait for Render deployment to finish
2. Go to your **admin dashboard**
3. Try uploading a file (PDF, image, etc.)
4. Click on the uploaded file
5. **IT WORKS!** 🎉

---

## 🎯 What Happens Now?

### When you upload a file:

1. ✅ File goes to **Cloudinary servers** (not Render)
2. ✅ Gets a permanent URL like:
   ```
   https://res.cloudinary.com/your-cloud/raw/upload/v123/csec-class-portal/resources/file.pdf
   ```
3. ✅ Stored **forever** (never deleted)
4. ✅ **Fast CDN delivery** worldwide
5. ✅ Works even if Render restarts

### If Cloudinary NOT configured:
- ⚠️ Falls back to **base64 in database**
- ⚠️ Still works but limited to 10MB files
- ⚠️ Slower performance

---

## 📊 Free Tier Limits (MORE than enough!)

```
Storage:        25 GB
Bandwidth:      25 GB/month
Transformations: 25 credits/month
Requests:       Unlimited
```

### For 60 users:
- Average file: 5MB
- 25GB ÷ 5MB = **5,000 files** can be stored
- 25GB bandwidth = **5,000 downloads/month**
- Per user: **83 downloads/month** (plenty!)

---

## 🔧 Advanced: Test Locally (Optional)

If you want to test on localhost:

1. Create `.env` file in backend:
   ```bash
   cd csec-class-portal-backend
   nano .env
   ```

2. Add:
   ```
   PORT=4000
   MONGO_URI=your-mongodb-uri
   ADMIN_KEY=your-admin-key
   JWT_SECRET=your-jwt-secret
   ALLOWED_ORIGIN=http://localhost:3000
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

3. Start backend:
   ```bash
   npm start
   ```

4. Test upload:
   ```bash
   curl http://localhost:4000/api/resources
   ```

---

## 🚨 Troubleshooting

### "Cloudinary not configured" in logs?
- ✅ Check environment variables on Render
- ✅ Make sure they're spelled correctly
- ✅ Redeploy after adding variables

### Files still 404?
- ✅ Wait for Render deployment (2-3 min)
- ✅ Re-upload files after deployment
- ✅ Old files won't work (re-upload needed)

### Upload fails?
- ✅ Check file size (<50MB limit)
- ✅ Check internet connection
- ✅ Check Cloudinary dashboard for quota

---

## 📈 Monitoring Usage

1. Go to: https://cloudinary.com/console
2. See **Storage** and **Bandwidth** usage
3. Get alerts at 80% usage
4. Free tier is more than enough for 60 users!

---

## 🎉 You're Done!

Your file storage is now:
- ✅ Production-ready
- ✅ Scalable
- ✅ Reliable
- ✅ Free (for your needs)
- ✅ Fast CDN delivery

**No more 404 errors!** 🚀

---

## 💡 Next Steps (Optional)

After everything works:

1. **Migrate old files**: Re-upload from local backup
2. **Set up automatic backups**: Download Cloudinary files monthly
3. **Monitor usage**: Check dashboard weekly
4. **Upgrade if needed**: If you exceed free tier (unlikely!)

---

## 🆘 Need Help?

- Cloudinary Docs: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com
- Community: https://community.cloudinary.com

**You got this!** 💪
