# Font Download Guide

This guide explains how to download and install the required fonts for Decision Journal v2.

## Required Fonts

We need 3 fonts with specific weights:

1. **Libre Baskerville** (serif - for headings and body text)
2. **IBM Plex Mono** (monospace - for code and timestamps)
3. **Lora** (serif - alternative body text)

---

## Option 1: Download from Google Fonts (Recommended)

### 1. Libre Baskerville

**URL:** https://fonts.google.com/specimen/Libre+Baskerville

**Steps:**
1. Click "Get font" or "Download family"
2. Extract the ZIP file
3. Find these files in the `static/` folder:
   - `LibreBaskerville-Regular.ttf` (weight 400)
   - `LibreBaskerville-Bold.ttf` (weight 700)
4. Convert to web formats (see conversion section below)
5. Rename and place in `/public/fonts/libre-baskerville/`:
   - `libre-baskerville-400.woff2`
   - `libre-baskerville-400.woff`
   - `libre-baskerville-700.woff2`
   - `libre-baskerville-700.woff`

### 2. IBM Plex Mono

**URL:** https://fonts.google.com/specimen/IBM+Plex+Mono

**Steps:**
1. Click "Get font" or "Download family"
2. Extract the ZIP file
3. Find these files in the `static/` folder:
   - `IBMPlexMono-Regular.ttf` (weight 400)
   - `IBMPlexMono-Medium.ttf` (weight 500)
4. Convert to web formats
5. Rename and place in `/public/fonts/ibm-plex-mono/`:
   - `ibm-plex-mono-400.woff2`
   - `ibm-plex-mono-400.woff`
   - `ibm-plex-mono-500.woff2`
   - `ibm-plex-mono-500.woff`

### 3. Lora

**URL:** https://fonts.google.com/specimen/Lora

**Steps:**
1. Click "Get font" or "Download family"
2. Extract the ZIP file
3. Find these files in the `static/` folder:
   - `Lora-Regular.ttf` (weight 400)
   - `Lora-Medium.ttf` (weight 500)
   - `Lora-SemiBold.ttf` (weight 600)
4. Convert to web formats
5. Rename and place in `/public/fonts/lora/`:
   - `lora-400.woff2`
   - `lora-400.woff`
   - `lora-500.woff2`
   - `lora-500.woff`
   - `lora-600.woff2`
   - `lora-600.woff`

---

## Option 2: Use google-webfonts-helper (Easier)

**URL:** https://gwfh.mranftl.com/fonts

This tool provides pre-converted woff/woff2 files ready to use!

### Steps for each font:

1. Search for the font (e.g., "Libre Baskerville")
2. Select the weights you need:
   - Libre Baskerville: 400, 700
   - IBM Plex Mono: 400, 500
   - Lora: 400, 500, 600
3. Choose "Modern Browsers" (woff2 only) or "Best Support" (woff2 + woff)
4. Click "Download files"
5. Extract and place in appropriate folder
6. Rename files to match the expected names in `globals.css`

---

## Converting TTF to Web Formats

If you have TTF files and need to convert them:

### Online Converters (No Installation)

1. **CloudConvert**
   - URL: https://cloudconvert.com/ttf-to-woff2
   - Upload TTF → Convert to woff2
   - Repeat for woff format

2. **Font Squirrel Webfont Generator**
   - URL: https://www.fontsquirrel.com/tools/webfont-generator
   - Upload TTF
   - Choose "Optimal" settings
   - Download package

### Command Line (If you have FontForge installed)

```bash
# Install FontForge (macOS)
brew install fontforge

# Convert TTF to WOFF2
fontforge -lang=ff -c 'Open($1); Generate($2)' input.ttf output.woff2

# Convert TTF to WOFF
fontforge -lang=ff -c 'Open($1); Generate($2)' input.ttf output.woff
```

---

## Expected Directory Structure

After downloading and placing all fonts:

```
public/
└── fonts/
    ├── libre-baskerville/
    │   ├── libre-baskerville-400.woff2
    │   ├── libre-baskerville-400.woff
    │   ├── libre-baskerville-700.woff2
    │   └── libre-baskerville-700.woff
    ├── ibm-plex-mono/
    │   ├── ibm-plex-mono-400.woff2
    │   ├── ibm-plex-mono-400.woff
    │   ├── ibm-plex-mono-500.woff2
    │   └── ibm-plex-mono-500.woff
    └── lora/
        ├── lora-400.woff2
        ├── lora-400.woff
        ├── lora-500.woff2
        ├── lora-500.woff
        ├── lora-600.woff2
        └── lora-600.woff
```

**Total:** 14 font files (7 woff2 + 7 woff)

---

## Verification

Once fonts are in place:

1. Run `npm run tauri:dev`
2. Open the app
3. Check the Typography Test section on the home page
4. Fonts should load instead of fallback system fonts
5. Check browser DevTools Network tab - no 404 errors for font files

---

## File Size Reference

Approximate sizes for downloaded fonts:

- Libre Baskerville: ~120KB (all weights)
- IBM Plex Mono: ~140KB (all weights)
- Lora: ~180KB (all weights)

**Total bundle size:** ~440KB for all fonts (woff2 format)

---

## Troubleshooting

### Fonts not loading?

1. **Check file paths:** Ensure fonts are in `public/fonts/` not `src/fonts/`
2. **Check file names:** Match exactly with `globals.css` (e.g., `libre-baskerville-400.woff2`)
3. **Check DevTools:** Open Network tab, filter by "font", look for 404 errors
4. **Clear cache:** Hard refresh (Cmd+Shift+R on macOS)
5. **Restart dev server:** Stop and run `npm run tauri:dev` again

### Wrong font displaying?

- Check font-family names in `globals.css` @font-face rules
- Verify Tailwind config has correct font-family mappings
- Check that CSS is importing `globals.css` correctly

---

## License Information

All three fonts are **open source** and free to use:

- **Libre Baskerville:** SIL Open Font License 1.1
- **IBM Plex Mono:** SIL Open Font License 1.1
- **Lora:** SIL Open Font License 1.1

Safe for commercial use, modification, and distribution.

---

## Quick Start Script (macOS/Linux)

If you want to automate this:

```bash
#!/bin/bash
# download-fonts.sh

# Create directories
mkdir -p public/fonts/{libre-baskerville,ibm-plex-mono,lora}

# TODO: Add download commands using curl/wget from google-webfonts-helper
# Or manually download and place files

echo "Font directories created!"
echo "Please download fonts manually from:"
echo "- https://gwfh.mranftl.com/fonts/libre-baskerville"
echo "- https://gwfh.mranftl.com/fonts/ibm-plex-mono"
echo "- https://gwfh.mranftl.com/fonts/lora"
```

---

**Next Steps:** Once fonts are downloaded, the app will have the complete design system working!
