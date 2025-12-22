# Domain Verification Files

This directory contains domain verification files for various services and platforms.

## Structure

```
.well-known/
├── apple-app-site-association          # Apple Universal Links
├── assetlinks.json                     # Android App Links
├── microsoft-identity-association.json # Microsoft/Azure verification
├── security.txt                        # Security contact information
└── README.md                           # This file
```

## File Purposes

### apple-app-site-association
Used for Apple Universal Links to associate your domain with your iOS app.

### assetlinks.json
Used for Android App Links to associate your domain with your Android app.

### microsoft-identity-association.json
Used for Microsoft Azure AD and other Microsoft services verification.

### security.txt
Provides security researchers with contact information for responsible disclosure.

## Adding Platform-Specific Verification Files

### Google Site Verification
Create a file named `google-site-verification-[CODE].html` in the `public` directory.

### Meta (Facebook) Domain Verification
Add meta tag to your main HTML or create a verification file as instructed by Meta.

### TikTok Domain Verification
Follow TikTok's domain verification process and add the required file here.

## Notes

- All files in this directory should be publicly accessible
- Do not add sensitive information to these files
- Keep verification codes and files secure
- Update files when verification codes change
