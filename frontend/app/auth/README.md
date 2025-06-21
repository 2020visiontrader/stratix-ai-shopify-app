# Stratix AI Shopify App - Authentication Flow

## Overview

The Stratix AI Shopify app supports multiple authentication methods to accommodate different user scenarios:

1. **Shopify OAuth**: Main authentication method for Shopify merchants
2. **Email/Password**: Alternative authentication for non-Shopify users
3. **Demo Login**: Easy access for trying out the platform

## Authentication Flows

### Shopify OAuth Flow

1. Merchant clicks "Install" from the Shopify App Store
2. They are redirected to the Shopify OAuth consent screen
3. After approving, Shopify redirects to our callback URL with an authorization code
4. Our backend exchanges the code for an access token
5. We create/update the merchant's account and log them in automatically

### Email/Password Registration

1. User navigates to the signup page
2. They provide their email, password, and basic information
3. Account is created in our database
4. User confirms their email (optional)
5. They can then log in using email/password

### Demo Account

We provide a demo account option for users who want to try the platform without connecting their Shopify store or creating an account:

- Email: demo@example.com
- Password: password

## Implementation Details

- Frontend authentication is managed through the `useAuth` hook
- Session persistence is handled via HTTP-only cookies
- Backend validates sessions via middleware
- User profiles are stored in our Supabase database

## Security Considerations

- All API requests are rate-limited to prevent abuse
- Passwords are hashed using bcrypt
- Sessions expire after 7 days
- Shopify access tokens are stored securely
