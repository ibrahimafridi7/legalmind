# AWS S3 Setup for LegalMind (Free Tier)

Use S3 for PDF uploads while staying within **AWS Free Tier** so you don't get charged.

---

## 1. What’s free (avoid paid usage)

- **Free tier (first 12 months):**
  - **5 GB** Standard storage
  - **20,000** GET requests / month
  - **2,000** PUT, POST, LIST requests / month
  - **100 GB** data transfer out to internet (in/out to your app often free in same region)
- **After 12 months:** Only pay for what you use; keep storage and request counts low to minimize cost.
- **To stay free:**
  - Use **one bucket**, one region (e.g. `us-east-1`).
  - Use **presigned URLs** so the browser uploads directly to S3 (no Lambda needed).
  - Don’t enable **versioning** unless you need it (extra storage).
  - Optional: add a **lifecycle rule** to delete or transition old objects after X days to cap storage.

---

## 2. Step-by-step setup

### 2.1 Create an AWS account (if needed)

- Go to [aws.amazon.com](https://aws.amazon.com) and create an account.
- You’ll need a card on file; free tier usage is $0 if you stay within the limits above.

### 2.2 Create an S3 bucket

1. Open **AWS Console** → **S3** → **Create bucket**.
2. **Bucket name:** e.g. `legalmind-uploads-YOURNAME` (must be globally unique).
3. **Region:** e.g. `us-east-1` (keep it close to your backend).
4. **Block Public Access:** leave **all four** checkboxes **on** (no public access). Uploads use presigned URLs only.
5. **Bucket Versioning:** **Disable** (to avoid extra storage).
6. Create the bucket.

### 2.3 Create an IAM user for the backend (no root keys)

1. **IAM** → **Users** → **Create user**.
2. **User name:** e.g. `legalmind-s3-upload`.
3. **Attach policies:** **Create policy** (or use a custom policy below).

Use this policy (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    }
  ]
}
```

Attach this policy to the user, then create the user.

### 2.4 Create access keys for the IAM user

1. Open the user → **Security credentials** → **Create access key**.
2. Use **Application running outside AWS** (or “Command Line”).
3. Save **Access key ID** and **Secret access key** somewhere safe (you won’t see the secret again).

---

## 3. Configure LegalMind backend

In the backend `.env` (or your host’s env), set:

```env
USE_S3=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=legalmind-uploads-YOURNAME
```

- If `USE_S3` is unset or not `true`, the app uses **local upload** (current dev behavior).
- Never commit `.env` or put keys in git.

---

## 4. CORS (so the browser can upload to S3)

1. S3 → your bucket → **Permissions** → **CORS**.
2. Use something like (replace with your frontend origin if needed):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:5173", "https://your-app.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Save. Now the browser can `PUT` to presigned S3 URLs from your app’s origin.

---

## 5. Optional: lifecycle rule to stay within free storage

1. Bucket → **Management** → **Create lifecycle rule**.
2. Name: e.g. `delete-old-uploads`.
3. Apply to all objects (or a prefix like `uploads/`).
4. Add action: **Expire current versions of objects** after e.g. **90 days** (or 365 if you want to keep longer).
5. Create rule.

This keeps storage from growing forever and helps stay free.

---

## 6. Summary checklist

- [ ] S3 bucket created, **Block Public Access** on, **versioning** off.
- [ ] IAM user with **PutObject / GetObject** (and ListBucket if needed) on that bucket only.
- [ ] Access key created and stored in backend env only.
- [ ] Backend env: `USE_S3=true`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`.
- [ ] CORS on bucket allows your frontend origin and `PUT`/`GET`.
- [ ] (Optional) Lifecycle rule to expire objects after X days.

After this, uploads in LegalMind will go to S3 when `USE_S3=true`; otherwise they use the local backend. No Lambda or extra services are required, so you stay within the free tier if usage is low.
