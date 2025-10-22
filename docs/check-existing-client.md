# Check if Existing Cognito Client Can Be Used

## What to Check in Your Existing Client:

1. **Go to your User Pool** → "App integration" → "App clients and analytics"
2. **Click on your existing client**
3. **Check these settings**:

### ✅ Required for Frontend Use:
- **App type**: Should be "Public client" (not Confidential)
- **Client secret**: Should be "No client secret generated"
- **Authentication flows**: Must include:
  - `ALLOW_USER_SRP_AUTH` (for username/password login)
  - `ALLOW_REFRESH_TOKEN_AUTH` (for token refresh)

### ❌ Backend-Only Settings (Won't Work for Frontend):
- **App type**: "Confidential client" 
- **Client secret**: "Client secret generated"
- **Authentication flows**: Only `ALLOW_ADMIN_USER_PASSWORD_AUTH`

## If Your Existing Client Has Backend Settings:

**Don't modify it!** Your backend depends on it. Instead:

1. Create a new app client (see main instructions)
2. Keep both clients in the same User Pool
3. Users can authenticate with either client
4. Each client serves its specific purpose

## If Your Existing Client Works for Frontend:

You can reuse it! Just add the Client ID to your `.env.local`:

```env
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_WEB_CLIENT_ID=your-existing-client-id
```

## Why Separate Clients Are Better:

- **Security**: Different security models (public vs confidential)
- **Configuration**: Different token expiration, flows, etc.
- **Maintenance**: Changes to one don't affect the other
- **Monitoring**: Separate analytics and logs