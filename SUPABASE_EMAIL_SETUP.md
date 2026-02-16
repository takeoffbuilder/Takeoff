# Supabase Email Verification Setup Guide

## 🚨 Problem: Email Verification Codes Not Being Sent

If users aren't receiving email verification codes from Supabase, follow these steps:

---

## ✅ Step 1: Check Supabase Auth Settings

### Navigate to Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/fmcjnmghzflwcwlbedoe
2. Click **Authentication** in the left sidebar
3. Click **Settings** tab
4. Scroll to **Email Auth** section

### Required Settings:

#### A. Email Confirmation Settings:
- ✅ **Enable email confirmations**: ON
- ✅ **Confirm email**: ENABLED
- ✅ **Secure email change**: ENABLED (optional but recommended)

#### B. Email Rate Limiting:
- Check if you've hit rate limits (default: 3-4 emails per hour in development)
- If testing repeatedly, you might be rate-limited
- **Solution**: Wait 1 hour or upgrade to Pro plan for higher limits

#### C. Email Templates:
1. Click **Email Templates** in Auth Settings
2. Find **"Confirm signup"** template
3. Ensure it's **ENABLED** and has valid content
4. Default template should look like:
   ```
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your email:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
   ```

---

## 🔧 Step 2: Development vs Production Email Behavior

### Development Mode (Default):
- Supabase may **suppress emails** in test mode
- Emails might go to **Supabase's test inbox** instead of real addresses
- Look for **"View Emails"** or **"Email Logs"** in your Supabase dashboard

### Check Test Inbox:
1. In Supabase Dashboard → **Authentication** → **Settings**
2. Look for **"Inbucket"** or **"Email testing"** section
3. Click **"View test emails"** if available
4. Your verification codes will appear here in development

---

## 📧 Step 3: Configure Custom SMTP (Recommended for Production)

For reliable email delivery, set up custom SMTP:

### A. Using Gmail:
1. In Supabase Dashboard → **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enter:
   - **Host**: smtp.gmail.com
   - **Port**: 587
   - **Username**: your-email@gmail.com
   - **Password**: [App Password - NOT your Gmail password]
   - **Sender email**: your-email@gmail.com
   - **Sender name**: Take Off Credit

### B. Using SendGrid (Recommended):
1. Create SendGrid account: https://sendgrid.com
2. Get API key from SendGrid dashboard
3. In Supabase SMTP Settings:
   - **Host**: smtp.sendgrid.net
   - **Port**: 587
   - **Username**: apikey
   - **Password**: [Your SendGrid API Key]
   - **Sender email**: noreply@takeoffcredit.com
   - **Sender name**: Take Off Credit

### C. Using Resend (Modern Alternative):
1. Sign up at: https://resend.com
2. Get API key
3. Configure SMTP in Supabase

---

## 🛠️ Step 4: Temporary Workaround for Development

If you need to test immediately without email:

### Option A: Disable Email Confirmation (TESTING ONLY):
1. Supabase Dashboard → **Authentication** → **Settings**
2. **Email Auth** section
3. Toggle **"Enable email confirmations"** to OFF
4. ⚠️ **WARNING**: Users will be auto-confirmed without verification
5. ⚠️ **ONLY for development testing - RE-ENABLE before production**

### Option B: Use Magic Links Instead:
```typescript
// In authService.ts - Alternative to password signup
async signInWithOTP(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getURL()}auth/callback`
    }
  });
  return { data, error };
}
```

---

## 🔍 Step 5: Debugging Email Issues

### Check Supabase Logs:
1. Supabase Dashboard → **Logs** → **Auth Logs**
2. Filter for: `signup` or `email`
3. Look for error messages

### Common Error Messages:

#### "Email rate limit exceeded"
- **Solution**: Wait 1 hour or upgrade plan
- **Prevention**: Don't test repeatedly with same email

#### "Invalid email address"
- **Solution**: Check email format validation
- Our code normalizes emails: `.trim().toLowerCase()`

#### "SMTP configuration error"
- **Solution**: Verify SMTP credentials
- Test SMTP connection in Supabase settings

#### "Email template disabled"
- **Solution**: Re-enable "Confirm signup" template
- Verify template has `{{ .ConfirmationURL }}` variable

---

## ✅ Step 6: Verify Configuration

After making changes, test the email flow:

### Test Signup:
1. Go to: /signup
2. Enter a **real email address you control**
3. Complete signup form
4. Check:
   - ✅ Your email inbox (including spam/junk)
   - ✅ Supabase test inbox (if in dev mode)
   - ✅ Supabase Auth logs for errors

### Successful Email Should Contain:
- **Subject**: "Confirm Your Email"
- **6-digit verification code** (if using OTP)
- **OR confirmation link** (if using magic links)

---

## 📱 Current Implementation

Your app uses **OTP (6-digit codes)** for verification:

```typescript
// signup.tsx - Sends user to verify-email page
await authService.signUp(email, password);
router.push(`/verify-email?email=${email}`);

// verify-email.tsx - User enters 6-digit code
await authService.verifyEmailOTP(email, code);
```

### Alternative: Auto-confirmation Links
If OTP emails aren't working, you can switch to magic links:
1. User clicks link in email
2. Automatically redirects to `/auth/callback`
3. No code entry needed

---

## 🚀 Production Checklist

Before going live:

- [ ] Custom SMTP configured (SendGrid/Resend recommended)
- [ ] Email confirmations ENABLED
- [ ] "Confirm signup" template tested and working
- [ ] Sender email domain authenticated (SPF/DKIM)
- [ ] Test with multiple email providers (Gmail, Outlook, Yahoo)
- [ ] Check spam folder handling
- [ ] Monitor email delivery rates in SMTP dashboard

---

## 📞 Support

If emails still aren't working after following this guide:

1. **Supabase Support**: https://supabase.com/dashboard/support
2. **Check Supabase Status**: https://status.supabase.com
3. **Community Discord**: https://discord.supabase.com

---

## 🔗 Useful Links

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- SMTP Configuration: https://supabase.com/docs/guides/auth/auth-smtp
- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Debugging Auth: https://supabase.com/docs/guides/auth/debugging
