// Search Functionality for Bezart Website
(function() {
  'use strict';

  let searchIndex = null;
  let searchInput = null;
  let searchResults = null;

  // Load search index
  async function loadSearchIndex() {
    const basePath = getBasePath();
    try {
      const response = await fetch(`${basePath}search-index.json`);
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.status}`);
      }
      searchIndex = await response.json();
    } catch (error) {
      console.error('Error loading search index:', error);
      searchIndex = { pages: [] };
    }
  }

  // Calculate base path
  function getBasePath() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment.length > 0);
    
    const bezartIndex = segments.indexOf('Bezart');
    const relevantSegments = bezartIndex !== -1 ? segments.slice(bezartIndex + 1) : segments;
    
    const depth = relevantSegments.length;
    return '../'.repeat(Math.max(0, depth));
  }

  // Initialize search functionality
  function initializeSearch() {
    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');

    if (!searchInput || !searchResults) {
      console.log('Search elements not found, skipping search initialization');
      return;
    }

    // Load search index
    loadSearchIndex();

    // Add search input event listener
    searchInput.addEventListener('input', debounce(performSearch, 300));

    // Add keyboard navigation
    searchInput.addEventListener('keydown', handleKeyboardNavigation);
  }

  // Perform search
  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!searchIndex || query.length === 0) {
      searchResults.innerHTML = '';
      return;
    }

    const results = searchIndex.pages.filter(page => {
      const title = page.title.toLowerCase();
      const description = page.description.toLowerCase();
      const keywords = page.keywords ? page.keywords.join(' ').toLowerCase() : '';
      
      return title.includes(query) || 
             description.includes(query) || 
             keywords.includes(query);
    });

    displayResults(results, query);
  }

  // Display search results
  function displayResults(results, query) {
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-no-results">
          "${escapeHtml(query)}" に一致する結果が見つかりませんでした
        </div>
      `;
      return;
    }

    const resultsHTML = results.map((page, index) => `
      <a href="${page.url}" class="search-result-item" data-index="${index}">
        <div class="search-result-title">${highlightMatch(page.title, query)}</div>
        <div class="search-result-description">${highlightMatch(page.description, query)}</div>
      </a>
    `).join('');

    searchResults.innerHTML = resultsHTML;
  }

  // Highlight matching text
  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<strong>$1</strong>');
  }

  // Handle keyboard navigation
  function handleKeyboardNavigation(e) {
    const resultItems = searchResults.querySelectorAll('.search-result-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = getCurrentIndex(resultItems);
      const nextIndex = Math.min(currentIndex + 1, resultItems.length - 1);
      highlightResult(resultItems, nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = getCurrentIndex(resultItems);
      const prevIndex = Math.max(currentIndex - 1, 0);
      highlightResult(resultItems, prevIndex);
    } else if (e.key === 'Enter') {
      const currentIndex = getCurrentIndex(resultItems);
      if (currentIndex >= 0 && resultItems[currentIndex]) {
        resultItems[currentIndex].click();
      }
    } else if (e.key === 'Escape') {
      const searchBox = document.getElementById('search-box');
      if (searchBox) {
        searchBox.classList.remove('active');
      }
    }
  }

  // Get current highlighted result index
  function getCurrentIndex(resultItems) {
    for (let i = 0; i < resultItems.length; i++) {
      if (resultItems[i].style.background === 'rgba(255, 255, 255, 0.1)' || 
          resultItems[i].style.backgroundColor === 'rgba(255, 255, 255, 0.1)') {
        return i;
      }
    }
    return -1;
  }

  // Highlight specific result
  function highlightResult(resultItems, index) {
    resultItems.forEach((item, i) => {
      if (i === index) {
        item.style.background = 'rgba(255, 255, 255, 0.1)';
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.style.background = '';
      }
    });
  }

  // Utility functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize when DOM is ready and navbar is loaded
  function initWhenReady() {
    if (document.getElementById('search-input')) {
      initializeSearch();
    } else {
      // Wait for navbar to load
      setTimeout(initWhenReady, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenReady);
  } else {
    initWhenReady();
  }
})();