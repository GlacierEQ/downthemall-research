# 🚀 DownThemAll Research - Deployment Guide

## Quick Browser Installation

### Method 1: Direct Chrome Installation (Recommended)

1. **Download Extension Files**
   ```bash
   git clone https://github.com/GlacierEQ/downthemall-research.git
   cd downthemall-research
   ```

2. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `downthemall-research` folder
   - Extension will be loaded and ready to use!

3. **Verify Installation**
   - Look for the 🚀 DownThemAll Research icon in your toolbar
   - Right-click on any webpage to see context menu options
   - Click the extension icon to open the research popup

### Method 2: Download ZIP from GitHub

1. **Download Repository**
   - Go to [https://github.com/GlacierEQ/downthemall-research](https://github.com/GlacierEQ/downthemall-research)
   - Click **Code** → **Download ZIP**
   - Extract the ZIP file to a folder

2. **Install in Browser**
   - Follow steps 2-3 from Method 1 above

## Features Available After Installation

### 🎯 Core Functionality
- **Page Scanning**: Automatically detects downloadable links
- **Batch Downloads**: Download multiple files simultaneously
- **Academic Integration**: Enhanced support for research sites
- **Queue Management**: Organize and manage download queues
- **Statistics Tracking**: Monitor download activity

### 🔍 Research-Specific Features
- **Academic Site Detection**: arXiv, PubMed, Google Scholar, etc.
- **Citation Download**: BibTeX, RIS, EndNote formats
- **Metadata Extraction**: Author, DOI, publication details
- **DOI Resolution**: Direct DOI-to-download conversion
- **Research Export**: JSON export of collected data

### 🖱️ Usage Methods
1. **Extension Popup**: Click toolbar icon for main interface
2. **Context Menus**: Right-click for quick actions
3. **Keyboard Shortcuts**: Quick access to common functions
4. **Auto-detection**: Automatic scanning of academic pages

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Full Support | Primary target - all features available |
| Edge | ✅ Full Support | Chromium-based - identical functionality |
| Brave | ✅ Full Support | Chromium-based - privacy-focused |
| Firefox | 🔄 Planned | Manifest V2 conversion needed |
| Safari | ❓ Future | Requires Safari-specific adaptation |

## Development Mode Features

### Enable Advanced Logging
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Enable verbose logging for debugging

### Access Storage Data
1. Navigate to `chrome://extensions/`
2. Click **Details** on DownThemAll Research
3. Click **Extension options** for settings
4. Use **Inspect views: background page** for debugging

### Test Academic Features
1. Visit supported academic sites:
   - [arXiv.org](https://arxiv.org) - preprint repository
   - [PubMed](https://pubmed.ncbi.nlm.nih.gov) - medical literature
   - [Google Scholar](https://scholar.google.com) - academic search
   - [ResearchGate](https://researchgate.net) - researcher network

2. Test functionality:
   - Automatic page scanning
   - Academic metadata extraction
   - Citation format detection
   - DOI resolution

## Permissions Explained

| Permission | Purpose | Why Needed |
|------------|---------|------------|
| `activeTab` | Access current page content | Scan for downloadable links |
| `downloads` | Initiate file downloads | Core download functionality |
| `storage` | Save settings and statistics | Remember user preferences |
| `tabs` | Manage browser tabs | Academic site detection |
| `scripting` | Inject content scripts | Enhanced page analysis |
| `<all_urls>` | Access all websites | Universal download support |

## Performance Optimization

### Recommended Settings
- **Max Concurrent Downloads**: 3 (default)
- **Auto-scan Academic Pages**: Enabled
- **Notifications**: Enabled for important events
- **Queue Processing**: Background processing

### Resource Usage
- **Memory**: ~5-10MB typical usage
- **CPU**: Minimal impact, event-driven
- **Network**: Only for initiated downloads
- **Storage**: <1MB for settings and statistics

## Troubleshooting

### Common Issues

**Extension Not Loading**
- Check that Developer mode is enabled
- Verify all files are present in the folder
- Look for error messages in `chrome://extensions/`

**Downloads Not Starting**
- Check Chrome's download permissions
- Verify popup blocker settings
- Ensure sufficient disk space

**Academic Features Not Working**
- Test on known academic sites (arXiv, PubMed)
- Check console for JavaScript errors
- Verify site hasn't changed structure

**Performance Issues**
- Reduce max concurrent downloads
- Clear extension storage data
- Restart browser

### Debug Information

**View Extension Logs**
```javascript
// In browser console on any page:
chrome.runtime.sendMessage({action: 'getStats'}, (response) => {
  console.log('Extension Stats:', response);
});
```

**Check Storage Usage**
```javascript
// In extension background page console:
chrome.storage.local.get(null, (data) => {
  console.log('Storage Data:', data);
});
```

## Advanced Configuration

### Custom Academic Sites
Add additional academic domains to recognition list:

1. Open extension popup
2. Click **Options**
3. Add domains to academic sites list
4. Save configuration

### Download Queue Management
- Access via popup → **View Queue**
- Pause/resume individual downloads
- Reorder queue priorities
- Export queue data

### Statistics and Analytics
- Track download patterns
- Monitor academic resource usage
- Export usage data for analysis
- Performance metrics dashboard

## Security Considerations

### Data Privacy
- All processing happens locally
- No data sent to external servers
- Academic metadata stored locally only
- User controls all data retention

### Download Safety
- Downloads subject to Chrome's security checks
- Malware protection via browser's built-in scanner
- User confirmation for potentially harmful files
- Respect for site rate limiting and ToS

## Updates and Maintenance

### Getting Updates
1. Pull latest changes from GitHub:
   ```bash
   cd downthemall-research
   git pull origin main
   ```

2. Reload extension in Chrome:
   - Go to `chrome://extensions/`
   - Click reload button on DownThemAll Research

### Feature Requests
- Submit issues on [GitHub](https://github.com/GlacierEQ/downthemall-research/issues)
- Join development discussions
- Contribute to academic site support
- Share usage feedback

---

**Ready to revolutionize your research workflow?** 🚀

[Install Now](#quick-browser-installation) | [Report Issues](https://github.com/GlacierEQ/downthemall-research/issues) | [Contribute](CONTRIBUTING.md)