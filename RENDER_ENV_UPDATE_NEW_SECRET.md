# Update Sadad Secret Key in Render

## New Secret Key
The secret key has been regenerated. Update it in Render immediately.

## Steps to Update in Render Dashboard

1. Go to: https://dashboard.render.com
2. Select your backend service: **GUILD-backend**
3. Click **Environment** tab
4. Find `SADAD_SECRET_KEY` and click **Edit**
5. Replace the old value with: `+efrWl1GCKwPzJaR`
6. Click **Save Changes**
7. Render will automatically redeploy

## Environment Variables (Updated)

```
SADAD_MID=2334863
SADAD_SECRET_KEY=+efrWl1GCKwPzJaR
SADAD_BASE_URL=https://api.sadadqatar.com/api-v4
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

## Bulk Format (for copy-paste)

```
SADAD_SECRET_KEY=+efrWl1GCKwPzJaR
```

## After Update

1. Wait 2-3 minutes for automatic redeployment
2. Test coin purchase in the app
3. Check Render logs for success or new error messages

## Expected Success Response

After the update, you should see:

```json
{
  "checksum": "g8J+JoVxoTAElGd6TCgVlVqHs5TYb/YPaBJchr5j+9q..."
}
```

## If Still Getting 401 Error

Contact Sadad support and provide:
- Merchant ID: `2334863`
- Domain: `https://guild-yf7q.onrender.com`
- Ask them to:
  1. Activate API v4 access for your merchant account
  2. Whitelist your domain in their system
  3. Confirm the secret key is active and correct

---

**Note:** The old secret key (`kOGQrmkFr5LcNW9c`) is now invalid. Make sure to update it in Render before testing again.



