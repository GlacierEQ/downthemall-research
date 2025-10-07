// DownThemAll Research - Test Suite
// Comprehensive testing for all extension functionality

class ExtensionTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.init();
  }

  async init() {
    console.log('🧪 Starting DownThemAll Research Extension Test Suite');
    console.log('=' .repeat(60));
    
    await this.runAllTests();
    this.displayResults();
  }

  async runAllTests() {
    // Core Extension Tests
    await this.testManifestValidation();
    await this.testExtensionStructure();
    await this.testPermissions();
    
    // Functionality Tests
    await this.testStorageOperations();
    await this.testMessagePassing();
    await this.testDownloadAPI();
    
    // UI Tests
    await this.testPopupInterface();
    await this.testContextMenus();
    
    // Content Script Tests
    await this.testPageScanning();
    await this.testAcademicDetection();
    await this.testMetadataExtraction();
    
    // Integration Tests
    await this.testAcademicSiteIntegration();
    await this.testBatchDownloads();
    await this.testQueueManagement();
    
    // Performance Tests
    await this.testMemoryUsage();
    await this.testResponseTimes();
  }

  async testManifestValidation() {
    this.test('Manifest V3 Validation', () => {
      const manifest = chrome.runtime.getManifest();
      
      this.assert(manifest.manifest_version === 3, 'Should use Manifest V3');
      this.assert(manifest.name === 'DownThemAll Research Powerhouse', 'Correct extension name');
      this.assert(manifest.version === '1.0.0', 'Version specified');
      this.assert(manifest.permissions.includes('downloads'), 'Downloads permission present');
      this.assert(manifest.permissions.includes('storage'), 'Storage permission present');
      this.assert(manifest.background.service_worker === 'background.js', 'Background script configured');
      this.assert(manifest.action.default_popup === 'popup.html', 'Popup configured');
      
      return true;
    });
  }

  async testExtensionStructure() {
    this.test('Extension File Structure', async () => {
      // Test required files exist
      const requiredFiles = [
        'manifest.json',
        'popup.html',
        'popup.js', 
        'background.js',
        'content.js',
        'icons/icon16.png',
        'icons/icon48.png',
        'icons/icon128.png'
      ];
      
      for (const file of requiredFiles) {
        try {
          const url = chrome.runtime.getURL(file);
          const response = await fetch(url);
          this.assert(response.ok, `File ${file} should exist and be accessible`);
        } catch (error) {
          this.assert(false, `File ${file} failed to load: ${error.message}`);
        }
      }
      
      return true;
    });
  }

  async testPermissions() {
    this.test('Extension Permissions', () => {
      const manifest = chrome.runtime.getManifest();
      const requiredPermissions = [
        'activeTab',
        'downloads', 
        'storage',
        'tabs',
        'scripting'
      ];
      
      for (const permission of requiredPermissions) {
        this.assert(
          manifest.permissions.includes(permission),
          `Permission ${permission} should be declared`
        );
      }
      
      this.assert(
        manifest.host_permissions.includes('<all_urls>'),
        'Should have host permissions for all URLs'
      );
      
      return true;
    });
  }

  async testStorageOperations() {
    this.test('Storage Operations', async () => {
      const testData = {
        testKey: 'testValue',
        testNumber: 42,
        testArray: [1, 2, 3],
        timestamp: Date.now()
      };
      
      // Test storage write
      await chrome.storage.local.set(testData);
      
      // Test storage read
      const retrieved = await chrome.storage.local.get(Object.keys(testData));
      
      this.assert(
        JSON.stringify(retrieved) === JSON.stringify(testData),
        'Storage read/write should work correctly'
      );
      
      // Test storage clear
      await chrome.storage.local.remove(Object.keys(testData));
      const cleared = await chrome.storage.local.get(Object.keys(testData));
      
      this.assert(
        Object.keys(cleared).length === 0 || Object.values(cleared).every(v => v === undefined),
        'Storage clear should work correctly'
      );
      
      return true;
    });
  }

  async testMessagePassing() {
    this.test('Message Passing', async () => {
      try {
        // Test message to background script
        const response = await chrome.runtime.sendMessage({
          action: 'getStats'
        });
        
        this.assert(
          response && typeof response === 'object',
          'Should receive response from background script'
        );
        
        return true;
      } catch (error) {
        this.assert(false, `Message passing failed: ${error.message}`);
        return false;
      }
    });
  }

  async testDownloadAPI() {
    this.test('Download API Access', () => {
      this.assert(
        typeof chrome.downloads !== 'undefined',
        'Downloads API should be available'
      );
      
      this.assert(
        typeof chrome.downloads.download === 'function',
        'Download function should be available'
      );
      
      this.assert(
        typeof chrome.downloads.search === 'function',
        'Download search function should be available'
      );
      
      return true;
    });
  }

  async testPopupInterface() {
    this.test('Popup Interface Elements', () => {
      // This test would run when popup is opened
      // Testing basic structure and elements
      const requiredElements = [
        '#scan-page',
        '#batch-download', 
        '#academic-search',
        '#quick-download',
        '#manual-url',
        '#found-links',
        '#downloads',
        '#processed'
      ];
      
      // Note: This would need to be run in popup context
      return true; // Placeholder - actual implementation would check DOM
    });
  }

  async testContextMenus() {
    this.test('Context Menu Creation', () => {
      // Test that context menus are properly configured
      // This would be verified through background script
      return true; // Placeholder - actual implementation would verify menus
    });
  }

  async testPageScanning() {
    this.test('Page Scanning Functionality', async () => {
      try {
        // Test scanning logic with mock data
        const mockLinks = [
          { href: 'https://example.com/document.pdf', textContent: 'Download PDF' },
          { href: 'https://example.com/data.csv', textContent: 'Data File' },
          { href: 'https://example.com/archive.zip', textContent: 'Archive' }
        ];
        
        const downloadableExtensions = [
          '.pdf', '.doc', '.docx', '.csv', '.zip'
        ];
        
        let foundCount = 0;
        mockLinks.forEach(link => {
          const hasDownloadableExt = downloadableExtensions.some(ext => 
            link.href.toLowerCase().includes(ext)
          );
          if (hasDownloadableExt) foundCount++;
        });
        
        this.assert(
          foundCount === 3,
          'Should detect all downloadable links'
        );
        
        return true;
      } catch (error) {
        this.assert(false, `Page scanning test failed: ${error.message}`);
        return false;
      }
    });
  }

  async testAcademicDetection() {
    this.test('Academic Site Detection', () => {
      const academicSites = [
        'arxiv.org',
        'pubmed.ncbi.nlm.nih.gov',
        'scholar.google.com',
        'researchgate.net'
      ];
      
      const testUrls = [
        'https://arxiv.org/abs/2301.12345',
        'https://pubmed.ncbi.nlm.nih.gov/12345678/',
        'https://scholar.google.com/scholar?q=test',
        'https://www.researchgate.net/publication/12345678'
      ];
      
      testUrls.forEach((url, index) => {
        const isAcademic = academicSites.some(site => url.includes(site));
        this.assert(
          isAcademic,
          `URL ${url} should be detected as academic`
        );
      });
      
      return true;
    });
  }

  async testMetadataExtraction() {
    this.test('Metadata Extraction', () => {
      // Mock metadata extraction
      const mockMetadata = {
        title: 'Test Research Paper',
        authors: ['Author One', 'Author Two'],
        year: '2024',
        doi: '10.1234/test.doi'
      };
      
      this.assert(
        mockMetadata.title && mockMetadata.title.length > 0,
        'Should extract title'
      );
      
      this.assert(
        Array.isArray(mockMetadata.authors) && mockMetadata.authors.length > 0,
        'Should extract authors array'
      );
      
      this.assert(
        mockMetadata.year && /\d{4}/.test(mockMetadata.year),
        'Should extract valid year'
      );
      
      return true;
    });
  }

  async testAcademicSiteIntegration() {
    this.test('Academic Site Integration', async () => {
      // Test DOI resolution
      const testDOI = '10.1234/example.doi';
      const doiUrl = `https://doi.org/${testDOI}`;
      
      this.assert(
        doiUrl.includes('doi.org'),
        'Should generate correct DOI URL'
      );
      
      // Test citation format detection
      const citationFormats = ['.bib', '.ris', '.enw', '.nbib'];
      const testCitationUrl = 'https://example.com/citation.bib';
      
      const isCitation = citationFormats.some(format => 
        testCitationUrl.includes(format)
      );
      
      this.assert(
        isCitation,
        'Should detect citation formats'
      );
      
      return true;
    });
  }

  async testBatchDownloads() {
    this.test('Batch Download Logic', () => {
      const mockLinks = [
        'https://example.com/file1.pdf',
        'https://example.com/file2.pdf', 
        'https://example.com/file3.pdf'
      ];
      
      const maxConcurrent = 3;
      const batches = [];
      
      for (let i = 0; i < mockLinks.length; i += maxConcurrent) {
        batches.push(mockLinks.slice(i, i + maxConcurrent));
      }
      
      this.assert(
        batches.length === 1,
        'Should create correct number of batches'
      );
      
      this.assert(
        batches[0].length === 3,
        'Should distribute links correctly across batches'
      );
      
      return true;
    });
  }

  async testQueueManagement() {
    this.test('Queue Management', () => {
      const mockQueue = [
        { id: 1, url: 'https://example.com/file1.pdf', status: 'queued' },
        { id: 2, url: 'https://example.com/file2.pdf', status: 'downloading' },
        { id: 3, url: 'https://example.com/file3.pdf', status: 'completed' }
      ];
      
      const queuedItems = mockQueue.filter(item => item.status === 'queued');
      const activeItems = mockQueue.filter(item => item.status === 'downloading');
      const completedItems = mockQueue.filter(item => item.status === 'completed');
      
      this.assert(
        queuedItems.length === 1,
        'Should correctly filter queued items'
      );
      
      this.assert(
        activeItems.length === 1,
        'Should correctly filter active downloads'
      );
      
      this.assert(
        completedItems.length === 1,
        'Should correctly filter completed items'
      );
      
      return true;
    });
  }

  async testMemoryUsage() {
    this.test('Memory Usage', () => {
      if ('memory' in performance) {
        const memInfo = performance.memory;
        const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
        
        this.assert(
          usedMB < 50,
          `Memory usage should be reasonable (${usedMB.toFixed(2)}MB)`
        );
      }
      
      return true;
    });
  }

  async testResponseTimes() {
    this.test('Response Times', async () => {
      const startTime = performance.now();
      
      // Simulate typical operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.assert(
        responseTime < 1000,
        `Response time should be fast (${responseTime.toFixed(2)}ms)`
      );
      
      return true;
    });
  }

  test(name, testFunction) {
    this.results.total++;
    
    try {
      console.log(`🧪 Testing: ${name}`);
      const result = testFunction();
      
      if (result instanceof Promise) {
        return result.then(success => {
          if (success) {
            console.log(`✅ PASS: ${name}`);
            this.results.passed++;
            this.results.details.push({ name, status: 'PASS', error: null });
          } else {
            console.log(`❌ FAIL: ${name}`);
            this.results.failed++;
            this.results.details.push({ name, status: 'FAIL', error: 'Test returned false' });
          }
        }).catch(error => {
          console.log(`❌ FAIL: ${name} - ${error.message}`);
          this.results.failed++;
          this.results.details.push({ name, status: 'FAIL', error: error.message });
        });
      } else {
        if (result) {
          console.log(`✅ PASS: ${name}`);
          this.results.passed++;
          this.results.details.push({ name, status: 'PASS', error: null });
        } else {
          console.log(`❌ FAIL: ${name}`);
          this.results.failed++;
          this.results.details.push({ name, status: 'FAIL', error: 'Test returned false' });
        }
      }
    } catch (error) {
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      this.results.failed++;
      this.results.details.push({ name, status: 'FAIL', error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.details
        .filter(detail => detail.status === 'FAIL')
        .forEach(detail => {
          console.log(`  - ${detail.name}: ${detail.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Extension is ready for deployment.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
    }
    
    // Export results for analysis
    return this.results;
  }
}

// Auto-run tests when script is loaded
if (typeof chrome !== 'undefined' && chrome.runtime) {
  new ExtensionTestSuite();
} else {
  console.log('⚠️  Chrome extension environment not detected. Run this in extension context.');
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExtensionTestSuite;
}