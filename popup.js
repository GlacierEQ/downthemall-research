// DownThemAll Research - Popup JavaScript

class ResearchPopup {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadStats();
    this.bindEvents();
    await this.scanCurrentPage();
  }

  bindEvents() {
    // Main action buttons
    document.getElementById('scan-page').addEventListener('click', () => this.handleScanPage());
    document.getElementById('batch-download').addEventListener('click', () => this.handleBatchDownload());
    document.getElementById('academic-search').addEventListener('click', () => this.handleAcademicSearch());
    document.getElementById('quick-download').addEventListener('click', () => this.handleQuickDownload());
    
    // Settings and utility buttons
    document.getElementById('open-options').addEventListener('click', () => this.openOptions());
    document.getElementById('view-queue').addEventListener('click', () => this.viewQueue());
    document.getElementById('export-data').addEventListener('click', () => this.exportData());
    
    // Enter key for quick download
    document.getElementById('manual-url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleQuickDownload();
    });
  }

  async loadStats() {
    try {
      const stats = await chrome.storage.local.get(['foundLinks', 'totalDownloads', 'processedFiles']);
      
      document.getElementById('found-links').textContent = stats.foundLinks || 0;
      document.getElementById('downloads').textContent = stats.totalDownloads || 0;
      document.getElementById('processed').textContent = stats.processedFiles || 0;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async handleScanPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script to scan for downloadable links
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.scanPageForLinks
      });
      
      const linkCount = results[0]?.result || 0;
      document.getElementById('found-links').textContent = linkCount;
      
      // Update storage
      await chrome.storage.local.set({ foundLinks: linkCount });
      
      this.showNotification(`Found ${linkCount} downloadable links`);
    } catch (error) {
      console.error('Error scanning page:', error);
      this.showNotification('Error scanning page', 'error');
    }
  }

  scanPageForLinks() {
    // This function runs in the context of the active tab
    const links = document.querySelectorAll('a[href]');
    const downloadableExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz', '.7z',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp',
      '.txt', '.csv', '.xml', '.json'
    ];
    
    let downloadableCount = 0;
    const downloadableLinks = [];
    
    links.forEach(link => {
      const href = link.href.toLowerCase();
      const hasDownloadableExt = downloadableExtensions.some(ext => href.includes(ext));
      const hasDownloadAttr = link.hasAttribute('download');
      
      if (hasDownloadableExt || hasDownloadAttr) {
        downloadableCount++;
        downloadableLinks.push({
          url: link.href,
          text: link.textContent.trim() || 'Download',
          type: this.getFileType(href)
        });
      }
    });
    
    // Store found links for later use
    if (downloadableLinks.length > 0) {
      chrome.storage.local.set({ 
        lastScannedLinks: downloadableLinks,
        lastScannedUrl: window.location.href,
        lastScannedTime: Date.now()
      });
    }
    
    return downloadableCount;
  }

  getFileType(url) {
    if (url.includes('.pdf')) return 'PDF';
    if (url.includes('.doc') || url.includes('.docx')) return 'Document';
    if (url.includes('.xls') || url.includes('.xlsx')) return 'Spreadsheet';
    if (url.includes('.ppt') || url.includes('.pptx')) return 'Presentation';
    if (url.includes('.zip') || url.includes('.rar')) return 'Archive';
    if (url.includes('.mp3') || url.includes('.mp4')) return 'Media';
    if (url.includes('.jpg') || url.includes('.png')) return 'Image';
    return 'File';
  }

  async handleBatchDownload() {
    try {
      const { lastScannedLinks } = await chrome.storage.local.get(['lastScannedLinks']);
      
      if (!lastScannedLinks || lastScannedLinks.length === 0) {
        this.showNotification('No links found. Scan page first.', 'warning');
        return;
      }
      
      // Start batch download
      let downloadCount = 0;
      for (const link of lastScannedLinks) {
        try {
          await chrome.downloads.download({ url: link.url });
          downloadCount++;
        } catch (error) {
          console.error(`Failed to download ${link.url}:`, error);
        }
      }
      
      // Update stats
      const { totalDownloads } = await chrome.storage.local.get(['totalDownloads']);
      const newTotal = (totalDownloads || 0) + downloadCount;
      await chrome.storage.local.set({ totalDownloads: newTotal });
      
      document.getElementById('downloads').textContent = newTotal;
      this.showNotification(`Started ${downloadCount} downloads`);
      
    } catch (error) {
      console.error('Error in batch download:', error);
      this.showNotification('Error starting downloads', 'error');
    }
  }

  async handleAcademicSearch() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if current page is an academic site
      const academicSites = ['arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'scholar.google.com', 'researchgate.net'];
      const isAcademicSite = academicSites.some(site => tab.url.includes(site));
      
      if (isAcademicSite) {
        await this.handleScanPage(); // Use enhanced scanning for academic sites
        this.showNotification('Academic content detected and scanned');
      } else {
        // Open academic search tools
        const searchUrl = 'https://scholar.google.com';
        await chrome.tabs.create({ url: searchUrl });
        this.showNotification('Opened Google Scholar');
      }
    } catch (error) {
      console.error('Error in academic search:', error);
      this.showNotification('Error accessing academic features', 'error');
    }
  }

  async handleQuickDownload() {
    const url = document.getElementById('manual-url').value.trim();
    
    if (!url) {
      this.showNotification('Please enter a URL', 'warning');
      return;
    }
    
    try {
      // Handle DOI URLs
      let downloadUrl = url;
      if (url.startsWith('10.') || url.includes('doi.org')) {
        downloadUrl = url.startsWith('http') ? url : `https://doi.org/${url}`;
      }
      
      await chrome.downloads.download({ url: downloadUrl });
      
      // Update stats
      const { totalDownloads } = await chrome.storage.local.get(['totalDownloads']);
      const newTotal = (totalDownloads || 0) + 1;
      await chrome.storage.local.set({ totalDownloads: newTotal });
      
      document.getElementById('downloads').textContent = newTotal;
      document.getElementById('manual-url').value = '';
      
      this.showNotification('Download started');
    } catch (error) {
      console.error('Error starting download:', error);
      this.showNotification('Error starting download', 'error');
    }
  }

  openOptions() {
    chrome.runtime.openOptionsPage();
  }

  viewQueue() {
    chrome.tabs.create({ url: 'chrome://downloads/' });
  }

  async exportData() {
    try {
      const data = await chrome.storage.local.get(null);
      const exportData = {
        timestamp: new Date().toISOString(),
        stats: {
          foundLinks: data.foundLinks || 0,
          totalDownloads: data.totalDownloads || 0,
          processedFiles: data.processedFiles || 0
        },
        lastScanned: {
          url: data.lastScannedUrl,
          time: data.lastScannedTime,
          links: data.lastScannedLinks || []
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      await chrome.downloads.download({
        url: url,
        filename: `downthemall-research-export-${Date.now()}.json`
      });
      
      this.showNotification('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showNotification('Error exporting data', 'error');
    }
  }

  async scanCurrentPage() {
    // Auto-scan when popup opens
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && !tab.url.startsWith('chrome://')) {
        await this.handleScanPage();
      }
    } catch (error) {
      console.debug('Auto-scan not available for this page');
    }
  }

  showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4CAF50'};
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ResearchPopup();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);