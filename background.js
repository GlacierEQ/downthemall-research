// DownThemAll Research - Background Service Worker

class ResearchBackground {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeStorage();
  }

  setupEventListeners() {
    // Extension installation/startup
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Context menu setup
    chrome.runtime.onInstalled.addListener(() => {
      this.createContextMenus();
    });

    // Context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Download progress tracking
    chrome.downloads.onChanged.addListener((downloadDelta) => {
      this.handleDownloadProgress(downloadDelta);
    });

    // Tab updates for academic site detection
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Message handling from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  async initializeStorage() {
    const defaultStorage = {
      foundLinks: 0,
      totalDownloads: 0,
      processedFiles: 0,
      academicSites: [
        'arxiv.org',
        'pubmed.ncbi.nlm.nih.gov',
        'scholar.google.com',
        'researchgate.net',
        'ieee.org',
        'acm.org',
        'springer.com',
        'sciencedirect.com',
        'jstor.org',
        'wiley.com'
      ],
      downloadQueue: [],
      settings: {
        autoScan: true,
        maxConcurrentDownloads: 3,
        academicMode: true,
        notificationsEnabled: true
      }
    };

    const existing = await chrome.storage.local.get(Object.keys(defaultStorage));
    
    // Only set defaults for missing keys
    const toSet = {};
    for (const [key, value] of Object.entries(defaultStorage)) {
      if (!(key in existing)) {
        toSet[key] = value;
      }
    }
    
    if (Object.keys(toSet).length > 0) {
      await chrome.storage.local.set(toSet);
    }
  }

  handleInstallation(details) {
    if (details.reason === 'install') {
      // First installation
      this.showWelcomeNotification();
      chrome.tabs.create({ 
        url: 'https://github.com/GlacierEQ/downthemall-research#readme' 
      });
    } else if (details.reason === 'update') {
      // Extension updated
      this.showUpdateNotification(details.previousVersion);
    }
  }

  createContextMenus() {
    // Remove existing menus first
    chrome.contextMenus.removeAll(() => {
      // Download this link
      chrome.contextMenus.create({
        id: 'download-link',
        title: 'Download with DownThemAll Research',
        contexts: ['link']
      });

      // Download all links on page
      chrome.contextMenus.create({
        id: 'download-all-links',
        title: 'Download all links on page',
        contexts: ['page']
      });

      // Academic research specific
      chrome.contextMenus.create({
        id: 'academic-download',
        title: 'Academic Research Download',
        contexts: ['link', 'page']
      });

      // Separator
      chrome.contextMenus.create({
        id: 'separator1',
        type: 'separator',
        contexts: ['link', 'page']
      });

      // Queue management
      chrome.contextMenus.create({
        id: 'add-to-queue',
        title: 'Add to download queue',
        contexts: ['link']
      });

      chrome.contextMenus.create({
        id: 'view-queue',
        title: 'View download queue',
        contexts: ['page']
      });
    });
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'download-link':
        await this.downloadSingleLink(info.linkUrl);
        break;
        
      case 'download-all-links':
        await this.downloadAllLinksOnPage(tab);
        break;
        
      case 'academic-download':
        await this.handleAcademicDownload(info, tab);
        break;
        
      case 'add-to-queue':
        await this.addToQueue(info.linkUrl, tab);
        break;
        
      case 'view-queue':
        await this.openQueueManager();
        break;
    }
  }

  async downloadSingleLink(url) {
    try {
      await chrome.downloads.download({ url });
      await this.incrementDownloadCount();
      this.showNotification('Download started', 'success');
    } catch (error) {
      console.error('Error downloading link:', error);
      this.showNotification('Error starting download', 'error');
    }
  }

  async downloadAllLinksOnPage(tab) {
    try {
      // Inject script to find all downloadable links
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.findAllDownloadableLinks
      });

      const links = results[0]?.result || [];
      
      if (links.length === 0) {
        this.showNotification('No downloadable links found', 'warning');
        return;
      }

      // Start downloads with rate limiting
      let downloadCount = 0;
      const { maxConcurrentDownloads } = await chrome.storage.local.get(['maxConcurrentDownloads']);
      const maxConcurrent = maxConcurrentDownloads || 3;
      
      for (let i = 0; i < links.length; i += maxConcurrent) {
        const batch = links.slice(i, i + maxConcurrent);
        
        await Promise.allSettled(
          batch.map(async (link) => {
            try {
              await chrome.downloads.download({ url: link.url });
              downloadCount++;
            } catch (error) {
              console.error(`Failed to download ${link.url}:`, error);
            }
          })
        );
        
        // Rate limiting delay
        if (i + maxConcurrent < links.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      await this.incrementDownloadCount(downloadCount);
      this.showNotification(`Started ${downloadCount} downloads`, 'success');
      
    } catch (error) {
      console.error('Error downloading all links:', error);
      this.showNotification('Error starting batch download', 'error');
    }
  }

  findAllDownloadableLinks() {
    // This function runs in the context of the active tab
    const links = document.querySelectorAll('a[href]');
    const downloadableExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz', '.7z',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp',
      '.txt', '.csv', '.xml', '.json', '.dat'
    ];
    
    const downloadableLinks = [];
    
    links.forEach(link => {
      const href = link.href.toLowerCase();
      const hasDownloadableExt = downloadableExtensions.some(ext => href.includes(ext));
      const hasDownloadAttr = link.hasAttribute('download');
      
      if (hasDownloadableExt || hasDownloadAttr) {
        downloadableLinks.push({
          url: link.href,
          text: link.textContent.trim() || 'Download',
          type: this.getFileType(href)
        });
      }
    });
    
    return downloadableLinks;
  }

  async handleAcademicDownload(info, tab) {
    const { academicSites } = await chrome.storage.local.get(['academicSites']);
    const isAcademicSite = academicSites.some(site => tab.url.includes(site));
    
    if (isAcademicSite) {
      // Enhanced academic downloading
      if (info.linkUrl) {
        await this.downloadAcademicResource(info.linkUrl, tab);
      } else {
        await this.downloadAllAcademicResources(tab);
      }
    } else {
      this.showNotification('Not an academic site', 'warning');
    }
  }

  async downloadAcademicResource(url, tab) {
    try {
      // Enhanced metadata collection for academic resources
      const metadata = await this.extractAcademicMetadata(tab);
      
      await chrome.downloads.download({ 
        url,
        filename: this.generateAcademicFilename(url, metadata)
      });
      
      await this.incrementDownloadCount();
      await this.incrementProcessedCount();
      
      this.showNotification('Academic resource download started', 'success');
    } catch (error) {
      console.error('Error downloading academic resource:', error);
      this.showNotification('Error downloading academic resource', 'error');
    }
  }

  async extractAcademicMetadata(tab) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Extract common academic metadata
          const title = document.querySelector('title')?.textContent || 'Academic Resource';
          const author = document.querySelector('[name="citation_author"]')?.content ||
                        document.querySelector('[name="author"]')?.content ||
                        'Unknown Author';
          const year = document.querySelector('[name="citation_publication_date"]')?.content ||
                      document.querySelector('[name="date"]')?.content ||
                      new Date().getFullYear();
          const doi = document.querySelector('[name="citation_doi"]')?.content || '';
          
          return { title, author, year, doi, url: window.location.href };
        }
      });
      
      return results[0]?.result || {};
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {};
    }
  }

  generateAcademicFilename(url, metadata) {
    const sanitize = (str) => str.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
    const ext = this.getFileExtension(url);
    
    if (metadata.author && metadata.year && metadata.title) {
      return `${sanitize(metadata.author)}_${metadata.year}_${sanitize(metadata.title)}.${ext}`;
    }
    
    return null; // Use default filename
  }

  getFileExtension(url) {
    const match = url.match(/\.([^.?#]+)(\?|#|$)/);
    return match ? match[1] : 'pdf';
  }

  async addToQueue(url, tab) {
    const { downloadQueue } = await chrome.storage.local.get(['downloadQueue']);
    const queue = downloadQueue || [];
    
    const newItem = {
      id: Date.now(),
      url,
      title: tab.title,
      sourceUrl: tab.url,
      added: new Date().toISOString(),
      status: 'queued'
    };
    
    queue.push(newItem);
    await chrome.storage.local.set({ downloadQueue: queue });
    
    this.showNotification('Added to download queue', 'success');
  }

  async openQueueManager() {
    // Could open options page or dedicated queue page
    chrome.runtime.openOptionsPage();
  }

  async handleDownloadProgress(downloadDelta) {
    if (downloadDelta.state && downloadDelta.state.current === 'complete') {
      await this.incrementProcessedCount();
      
      const { notificationsEnabled } = await chrome.storage.local.get(['notificationsEnabled']);
      if (notificationsEnabled) {
        this.showNotification('Download completed', 'success');
      }
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      const { academicSites, settings } = await chrome.storage.local.get(['academicSites', 'settings']);
      
      if (settings?.autoScan && academicSites.some(site => tab.url.includes(site))) {
        // Auto-scan academic pages
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
          });
        } catch (error) {
          console.debug('Could not inject content script:', error);
        }
      }
    }
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getStats':
        const stats = await chrome.storage.local.get(['foundLinks', 'totalDownloads', 'processedFiles']);
        sendResponse(stats);
        break;
        
      case 'updateStats':
        await chrome.storage.local.set(request.data);
        sendResponse({ success: true });
        break;
        
      case 'downloadUrl':
        await this.downloadSingleLink(request.url);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async incrementDownloadCount(count = 1) {
    const { totalDownloads } = await chrome.storage.local.get(['totalDownloads']);
    await chrome.storage.local.set({ totalDownloads: (totalDownloads || 0) + count });
  }

  async incrementProcessedCount(count = 1) {
    const { processedFiles } = await chrome.storage.local.get(['processedFiles']);
    await chrome.storage.local.set({ processedFiles: (processedFiles || 0) + count });
  }

  showNotification(message, type = 'info') {
    const iconUrl = chrome.runtime.getURL('icons/icon48.png');
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: iconUrl,
      title: 'DownThemAll Research',
      message: message
    });
  }

  showWelcomeNotification() {
    this.showNotification('Welcome to DownThemAll Research! Right-click on links or pages to get started.', 'success');
  }

  showUpdateNotification(previousVersion) {
    this.showNotification(`Updated from v${previousVersion}. Check out the new features!`, 'info');
  }
}

// Initialize background service worker
const researchBackground = new ResearchBackground();