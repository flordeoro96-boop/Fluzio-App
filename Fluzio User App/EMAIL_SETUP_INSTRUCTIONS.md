# Email System Setup Instructions

## ✅ Email Functions Deployed

Two Cloud Functions have been deployed:

1. **`sendwelcomeemail`** - Automatically sends welcome email when a new user is created
2. **`sendverificationemail`** - Sends email verification link (callable via HTTPS)

## 📧 Gmail SMTP Configuration

To enable email sending, you need to set up Gmail SMTP credentials:

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Under "2-Step Verification", click **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Name it "Fluzio Email System"
7. Click **Generate**
8. Copy the 16-character password (spaces don't matter)

### Step 2: Set Environment Variables in Firebase

Run these commands from your project directory:

```bash
# Set your Gmail address
firebase functions:config:set email.user="your-email@gmail.com"

# Set the app password (16-character code from Step 1)
firebase functions:config:set email.password="your-app-password-here"
```

### Step 3: Deploy Functions Again

```bash
firebase deploy --only functions:sendwelcomeemail,functions:sendverificationemail
```

## 🔧 Alternative: Use `.env` File (Local Development)

Create `functions/.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

**Note**: Never commit `.env` to Git! It's already in `.gitignore`.

## 📨 Email Templates

### Welcome Email
- Sent automatically when user signs up
- Personalized for business vs customer users
- Features overview and call-to-action

### Verification Email
- Contains verification link
- 24-hour expiration notice
- Security warnings

## 🧪 Testing

### Test Welcome Email:
1. Create a new user account
2. Check the email inbox
3. Welcome email should arrive within seconds

### Test Verification Email:
Send a POST request to:
```
https://us-central1-fluzio-13af2.cloudfunctions.net/sendverificationemail
```

With body:
```json
{
  "email": "test@example.com",
  "displayName": "Test User",
  "verificationLink": "https://fluzio-13af2.web.app/verify?code=ABC123"
}
```

## 📊 Monitoring

View email logs in Firebase Console:
```bash
firebase functions:log --only sendwelcomeemail,sendverificationemail
```

## 🔐 Security Notes

1. **Never** commit email credentials to Git
2. Use **App Passwords**, not your Gmail password
3. Monitor email sending limits (Gmail: 500/day for free accounts)
4. For production, consider:
   - SendGrid (better deliverability)
   - AWS SES (cost-effective)
   - Mailgun (developer-friendly)

## 🚀 Production Ready Checklist

- [ ] Gmail App Password created
- [ ] Environment variables set in Firebase
- [ ] Functions redeployed
- [ ] Welcome email tested
- [ ] Verification email tested
- [ ] Email templates reviewed
- [ ] Monitoring set up

## 📧 Current Email Flow

### New User Signup:
1. User creates account in Firestore
2. `onUserCreate` trigger fires
3. `sendwelcomeemail` Cloud Function executes
4. Welcome email sent to user's email
5. Email verification notification appears in app

### Email Verification:
1. User clicks "Verify Email" in settings
2. Frontend calls `sendverificationemail` function
3. Verification email sent with link
4. User clicks link in email
5. Frontend marks email as verified
6. Notification dismissed

## ⚙️ Function URLs

- **Send Verification Email**: 
  `https://us-central1-fluzio-13af2.cloudfunctions.net/sendverificationemail`

## 🛠️ Troubleshooting

### Emails not sending?
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify environment variables are set
3. Check Gmail App Password is correct
4. Ensure 2-Step Verification is enabled on Gmail
5. Check Gmail sending limits (500/day)

### Email in spam folder?
- Add SPF/DKIM records (advanced)
- Use a custom domain email
- Warm up the sending address

### Welcome email not triggered?
- Check Firestore trigger is active
- Verify user document has `email` field
- Check Functions logs for errors
