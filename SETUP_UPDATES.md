# Auto-Update Setup Guide

This guide will help you complete the setup for automatic updates in your Decision Journal app.

## ✅ Already Completed

- ✅ Tauri updater plugin installed and configured
- ✅ Frontend update UI implemented (dialog, settings, etc.)
- ✅ GitHub Actions workflows created
- ✅ Update signing keys generated
- ✅ Public key added to tauri.conf.json

## 🔑 Step 1: Add Private Key to GitHub Secrets

Your private key has been saved to: `~/.tauri/decision-journal-private-key.txt`

**To add it to GitHub:**

1. Go to your GitHub repository: https://github.com/sinameraji/decision-journal-redesign
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

**Secret 1:**
- Name: `TAURI_SIGNING_PRIVATE_KEY`
- Value: (Copy the entire contents of `~/.tauri/decision-journal-private-key.txt`)

```bash
cat ~/.tauri/decision-journal-private-key.txt | pbcopy
```

This copies the private key to your clipboard. Paste it as the secret value.

**Secret 2:**
- Name: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- Value: Leave empty (press save without entering a value)

⚠️ **IMPORTANT**: Keep your private key secret! Never commit it to git.

## 🍎 Step 2: macOS Code Signing (Optional but Recommended)

To avoid "unidentified developer" warnings on macOS, you need an Apple Developer account and certificate.

**Requirements:**
- Apple Developer account ($99/year)
- Developer ID Application certificate

**Setup:**

1. **Export your certificate from Keychain Access:**
   - Open Keychain Access
   - Find "Developer ID Application: Your Name (TEAM_ID)"
   - Right-click → Export → Save as .p12 with a password

2. **Convert to base64:**
   ```bash
   base64 -i /path/to/certificate.p12 | pbcopy
   ```

3. **Add to GitHub Secrets:**
   - `APPLE_CERTIFICATE` - Paste the base64 string
   - `APPLE_CERTIFICATE_PASSWORD` - Your .p12 password
   - `APPLE_SIGNING_IDENTITY` - Full certificate name (e.g., "Developer ID Application: Your Name (ABC123XYZ)")
   - `APPLE_ID` - Your Apple ID email
   - `APPLE_PASSWORD` - App-specific password (generate at appleid.apple.com)
   - `APPLE_TEAM_ID` - 10-character Team ID from developer.apple.com

**Skip for now:** You can release without macOS signing initially. Users will see a warning but can still run the app.

## 🪟 Step 3: Windows Code Signing (Optional)

To avoid Windows SmartScreen warnings, you need a code signing certificate.

**Requirements:**
- Code signing certificate from a trusted CA (Sectigo, DigiCert, etc.)
- Cost: $100-400/year

**Setup:**

1. **Export certificate as .pfx:**
   ```bash
   # On Windows
   certutil -encode certificate.pfx certificate.txt

   # On macOS/Linux
   base64 -i certificate.pfx | pbcopy
   ```

2. **Add to GitHub Secrets:**
   - `WINDOWS_CERTIFICATE` - Paste the base64 string
   - `WINDOWS_CERTIFICATE_PASSWORD` - Certificate password

**Skip for now:** You can release without Windows signing initially. Users will see a SmartScreen warning.

## 🚀 Step 4: Create Your First Release

Once you've added the private key to GitHub Secrets:

1. **Update version numbers** in these files:
   - `src-tauri/tauri.conf.json`
   - `package.json`
   - `src-tauri/Cargo.toml`

2. **Commit and create a tag:**
   ```bash
   git add .
   git commit -m "chore: bump version to 2.0.1"
   git tag v2.0.1
   git push origin main
   git push origin v2.0.1
   ```

3. **Watch the workflow:**
   - Go to GitHub → Actions tab
   - You'll see the "Release" workflow running
   - It will build for macOS (x64 + ARM), Windows, and Linux

4. **Check the release:**
   - Once complete, go to GitHub → Releases
   - Your release will have all the platform binaries
   - A `latest.json` file will be automatically generated

## ✨ Step 5: Test Updates

1. **Build and install the app locally:**
   ```bash
   npm run tauri:build
   ```

2. **Install the built app** (from `src-tauri/target/release/bundle/`)

3. **Create a new version** (e.g., v2.0.2) and push the tag

4. **Open the app:**
   - Go to Settings → Updates
   - Click "Check for Updates"
   - You should see an update notification!
   - Click "Install Now" to test the update flow

## 📋 Update Process (For Future Releases)

When you're ready to release a new version:

```bash
# 1. Update version numbers in:
#    - src-tauri/tauri.conf.json
#    - package.json
#    - src-tauri/Cargo.toml

# 2. Update CHANGELOG.md (optional but recommended)

# 3. Commit and tag
git add .
git commit -m "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z

# 4. GitHub Actions automatically:
#    ✓ Builds all platforms
#    ✓ Signs binaries
#    ✓ Creates release
#    ✓ Uploads artifacts
#    ✓ Generates update manifest
```

## 🎯 Quick Start (Minimum Setup)

If you just want to get updates working quickly:

1. ✅ Add `TAURI_SIGNING_PRIVATE_KEY` to GitHub Secrets (from Step 1)
2. ✅ Add empty `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` to GitHub Secrets
3. ✅ Create a tag and push it: `git tag v2.0.1 && git push origin v2.0.1`
4. ✅ Wait for GitHub Actions to complete
5. ✅ Download and install the built app
6. ✅ Create another tag to test updates

Code signing (Steps 2 & 3) can be added later for production releases.

## 🔒 Security Notes

- **Never commit** the private key file to git
- **Keep the private key secret** - anyone with it can sign updates
- **Back up the private key** securely - if you lose it, you can't update existing installations
- The private key is stored at: `~/.tauri/decision-journal-private-key.txt`

## 🎉 Features

Your app now has:
- ✅ Daily automatic update checks
- ✅ Manual "Check for Updates" button
- ✅ User-friendly update dialogs
- ✅ Download progress tracking
- ✅ Automatic restart after update
- ✅ Toggle to enable/disable auto-checks
- ✅ Multi-platform support
- ✅ Fully automated CI/CD pipeline

## 📚 Next Steps

Consider adding:
- [ ] CHANGELOG.md to document version history
- [ ] Release notes in GitHub releases
- [ ] Beta/stable update channels
- [ ] Update rollback mechanism
- [ ] Analytics to track update adoption

## 🆘 Troubleshooting

**"No updates available" when there should be:**
- Check that `latest.json` exists in the GitHub release
- Verify the endpoint URL in `tauri.conf.json` is correct
- Check browser DevTools console for errors

**Signature verification fails:**
- Ensure the public key in `tauri.conf.json` matches your private key
- Verify GitHub Actions has the correct private key in secrets

**Build fails in GitHub Actions:**
- Check the Actions logs for specific errors
- Ensure all required secrets are set
- Verify the repository has Actions enabled

**macOS "unidentified developer" warning:**
- This is normal without Apple Developer certificates
- Users can right-click → Open to bypass
- Add Apple certificates (Step 2) to eliminate the warning

---

Need help? Check the [Tauri Updater Documentation](https://v2.tauri.app/plugin/updater/)
