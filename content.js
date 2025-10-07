// DownThemAll Research - Content Script

class ResearchContentScript {
  constructor() {
    this.init();
  }

  init() {
    this.setupPageAnalysis();
    this.setupMessageListener();
    this.detectAcademicContent();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open
    });
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'scanPage':
        const results = await this.scanPageForDownloads();
        sendResponse(results);
        break;
        
      case 'getAcademicMetadata':
        const metadata = this.extractAcademicMetadata();
        sendResponse(metadata);
        break;
        
      case 'highlightDownloadableLinks':
        this.highlightDownloadableLinks();
        sendResponse({ success: true });
        break;
        
      case 'removeHighlights':
        this.removeHighlights();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async scanPageForDownloads() {
    const downloadableExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz', '.7z', '.bz2',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
      '.txt', '.csv', '.xml', '.json', '.dat', '.sql',
      '.epub', '.mobi', '.djvu', '.ps', '.eps'
    ];
    
    const academicExtensions = [
      '.bib', '.ris', '.enw', '.nbib', '.ciw'
    ];
    
    const allExtensions = [...downloadableExtensions, ...academicExtensions];
    
    const links = document.querySelectorAll('a[href]');
    const downloadableLinks = [];
    const academicLinks = [];
    const mediaLinks = [];
    
    links.forEach((link, index) => {
      const href = link.href.toLowerCase();
      const text = link.textContent.trim();
      const hasDownloadableExt = allExtensions.some(ext => href.includes(ext));
      const hasDownloadAttr = link.hasAttribute('download');
      
      // Check for academic-specific patterns
      const isAcademicLink = this.isAcademicLink(href, text);
      const isMediaLink = this.isMediaLink(href);
      
      if (hasDownloadableExt || hasDownloadAttr || isAcademicLink) {
        const linkData = {
          url: link.href,
          text: text || 'Download',
          type: this.getFileType(href),
          size: this.estimateFileSize(link),
          academic: isAcademicLink,
          media: isMediaLink,
          element: link,
          index: index
        };
        
        downloadableLinks.push(linkData);
        
        if (isAcademicLink) {
          academicLinks.push(linkData);
        }
        
        if (isMediaLink) {
          mediaLinks.push(linkData);
        }
      }
    });
    
    // Also scan for embedded resources
    const embeddedResources = this.scanEmbeddedResources();
    
    const results = {
      downloadableLinks,
      academicLinks,
      mediaLinks,
      embeddedResources,
      pageMetadata: this.extractPageMetadata(),
      academicMetadata: this.extractAcademicMetadata(),
      statistics: {
        totalLinks: links.length,
        downloadableCount: downloadableLinks.length,
        academicCount: academicLinks.length,
        mediaCount: mediaLinks.length,
        embeddedCount: embeddedResources.length
      }
    };
    
    // Store results for later use
    await this.storePageScanResults(results);
    
    return results;
  }

  isAcademicLink(href, text) {
    const academicPatterns = [
      /doi\.org/i,
      /arxiv\.org/i,
      /pubmed/i,
      /researchgate/i,
      /scholar\.google/i,
      /jstor/i,
      /wiley/i,
      /springer/i,
      /sciencedirect/i,
      /ieee\.org/i,
      /acm\.org/i
    ];
    
    const academicKeywords = [
      'download pdf', 'full text', 'supplementary', 'dataset',
      'citation', 'bibtex', 'endnote', 'ris', 'references'
    ];
    
    const hasAcademicPattern = academicPatterns.some(pattern => pattern.test(href));
    const hasAcademicKeyword = academicKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    return hasAcademicPattern || hasAcademicKeyword;
  }

  isMediaLink(href) {
    const mediaExtensions = ['.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    return mediaExtensions.some(ext => href.toLowerCase().includes(ext));
  }

  getFileType(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.pdf')) return 'PDF';
    if (urlLower.includes('.doc') || urlLower.includes('.docx')) return 'Document';
    if (urlLower.includes('.xls') || urlLower.includes('.xlsx')) return 'Spreadsheet';
    if (urlLower.includes('.ppt') || urlLower.includes('.pptx')) return 'Presentation';
    if (urlLower.includes('.zip') || urlLower.includes('.rar') || urlLower.includes('.tar')) return 'Archive';
    if (urlLower.includes('.mp3') || urlLower.includes('.mp4') || urlLower.includes('.avi')) return 'Media';
    if (urlLower.includes('.jpg') || urlLower.includes('.png') || urlLower.includes('.gif')) return 'Image';
    if (urlLower.includes('.txt') || urlLower.includes('.csv') || urlLower.includes('.json')) return 'Data';
    if (urlLower.includes('.bib') || urlLower.includes('.ris') || urlLower.includes('.enw')) return 'Citation';
    
    return 'File';
  }

  estimateFileSize(link) {
    // Try to find size information in the link text or nearby elements
    const text = link.textContent;
    const parent = link.parentElement;
    const sizePattern = /(\d+(?:\.\d+)?\s*(?:KB|MB|GB|bytes?))/i;
    
    let match = text.match(sizePattern);
    if (!match && parent) {
      match = parent.textContent.match(sizePattern);
    }
    
    return match ? match[1] : 'Unknown';
  }

  scanEmbeddedResources() {
    const embeddedResources = [];
    
    // Scan for iframes that might contain downloadable content
    const iframes = document.querySelectorAll('iframe[src]');
    iframes.forEach(iframe => {
      if (iframe.src && this.isPotentialDownload(iframe.src)) {
        embeddedResources.push({
          type: 'iframe',
          url: iframe.src,
          title: iframe.title || 'Embedded content'
        });
      }
    });
    
    // Scan for object/embed tags
    const objects = document.querySelectorAll('object[data], embed[src]');
    objects.forEach(obj => {
      const src = obj.data || obj.src;
      if (src && this.isPotentialDownload(src)) {
        embeddedResources.push({
          type: 'embedded',
          url: src,
          title: obj.title || 'Embedded object'
        });
      }
    });
    
    return embeddedResources;
  }

  isPotentialDownload(url) {
    const downloadableExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    return downloadableExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  extractPageMetadata() {
    return {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      lastModified: document.lastModified,
      language: document.documentElement.lang || 'unknown',
      description: this.getMetaContent('description'),
      keywords: this.getMetaContent('keywords'),
      author: this.getMetaContent('author')
    };
  }

  extractAcademicMetadata() {
    return {
      title: this.getMetaContent('citation_title') || document.title,
      authors: this.getAllMetaContent('citation_author'),
      journal: this.getMetaContent('citation_journal_title'),
      volume: this.getMetaContent('citation_volume'),
      issue: this.getMetaContent('citation_issue'),
      pages: this.getMetaContent('citation_firstpage') + '-' + this.getMetaContent('citation_lastpage'),
      year: this.getMetaContent('citation_publication_date') || this.getMetaContent('citation_year'),
      doi: this.getMetaContent('citation_doi'),
      pmid: this.getMetaContent('citation_pmid'),
      arxivId: this.getMetaContent('citation_arxiv_id'),
      pdfUrl: this.getMetaContent('citation_pdf_url'),
      abstract: this.getMetaContent('citation_abstract') || this.extractAbstractText(),
      keywords: this.getAllMetaContent('citation_keywords')
    };
  }

  getMetaContent(name) {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta ? meta.content : '';
  }

  getAllMetaContent(name) {
    const metas = document.querySelectorAll(`meta[name="${name}"], meta[property="${name}"]`);
    return Array.from(metas).map(meta => meta.content);
  }

  extractAbstractText() {
    // Try to find abstract in common containers
    const abstractSelectors = [
      '.abstract', '#abstract', '[id*="abstract"]', '[class*="abstract"]',
      '.summary', '#summary', '[id*="summary"]', '[class*="summary"]'
    ];
    
    for (const selector of abstractSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.length > 100) {
        return element.textContent.trim();
      }
    }
    
    return '';
  }

  async storePageScanResults(results) {
    // Store results in chrome storage for popup access
    const storageData = {
      lastScannedResults: results,
      lastScannedUrl: window.location.href,
      lastScannedTime: Date.now()
    };
    
    try {
      await chrome.storage.local.set(storageData);
    } catch (error) {
      console.error('Error storing scan results:', error);
    }
  }

  highlightDownloadableLinks() {
    // Remove existing highlights first
    this.removeHighlights();
    
    const links = document.querySelectorAll('a[href]');
    const downloadableExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz', '.7z'
    ];
    
    links.forEach(link => {
      const href = link.href.toLowerCase();
      const hasDownloadableExt = downloadableExtensions.some(ext => href.includes(ext));
      const hasDownloadAttr = link.hasAttribute('download');
      const isAcademicLink = this.isAcademicLink(href, link.textContent);
      
      if (hasDownloadableExt || hasDownloadAttr || isAcademicLink) {
        // Add highlight styling
        link.style.border = '2px solid #4CAF50';
        link.style.borderRadius = '3px';
        link.style.padding = '2px 4px';
        link.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        link.classList.add('downthemall-highlighted');
        
        // Add download icon
        if (!link.querySelector('.downthemall-icon')) {
          const icon = document.createElement('span');
          icon.className = 'downthemall-icon';
          icon.innerHTML = ' 📥';
          icon.style.fontSize = '12px';
          icon.style.marginLeft = '4px';
          link.appendChild(icon);
        }
      }
    });
  }

  removeHighlights() {
    const highlightedLinks = document.querySelectorAll('.downthemall-highlighted');
    
    highlightedLinks.forEach(link => {
      link.style.border = '';
      link.style.borderRadius = '';
      link.style.padding = '';
      link.style.backgroundColor = '';
      link.classList.remove('downthemall-highlighted');
      
      const icon = link.querySelector('.downthemall-icon');
      if (icon) {
        icon.remove();
      }
    });
  }

  detectAcademicContent() {
    // Auto-detect if this is an academic page and notify background script
    const academicIndicators = [
      'citation_title', 'citation_author', 'citation_doi',
      'dc.title', 'dc.creator', 'dc.identifier.doi'
    ];
    
    const hasAcademicMetadata = academicIndicators.some(indicator => {
      return document.querySelector(`meta[name="${indicator}"], meta[property="${indicator}"]`);
    });
    
    const academicDomains = [
      'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'scholar.google.com',
      'researchgate.net', 'ieee.org', 'acm.org', 'springer.com',
      'sciencedirect.com', 'jstor.org', 'wiley.com'
    ];
    
    const isAcademicDomain = academicDomains.some(domain => 
      window.location.hostname.includes(domain)
    );
    
    if (hasAcademicMetadata || isAcademicDomain) {
      // Notify background script about academic content
      chrome.runtime.sendMessage({
        action: 'academicContentDetected',
        url: window.location.href,
        metadata: this.extractAcademicMetadata()
      });
    }
  }

  setupPageAnalysis() {
    // Set up mutation observer to detect dynamic content changes
    const observer = new MutationObserver((mutations) => {
      let hasNewLinks = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const newLinks = node.querySelectorAll ? node.querySelectorAll('a[href]') : [];
              if (newLinks.length > 0) {
                hasNewLinks = true;
              }
            }
          });
        }
      });
      
      if (hasNewLinks) {
        // Debounce the scan to avoid too many calls
        clearTimeout(this.scanTimeout);
        this.scanTimeout = setTimeout(() => {
          this.scanPageForDownloads();
        }, 1000);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ResearchContentScript();
  });
} else {
  new ResearchContentScript();
}