// Navbar Component Loader with Dynamic Path Resolution
(function() {
  'use strict';

  // Calculate base path based on current directory depth
  function getBasePath() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment.length > 0);
    
    // GitHub Pages typically serves from /Bezart/ or root
    // Remove 'Bezart' from segments if present for accurate depth calculation
    const bezartIndex = segments.indexOf('Bezart');
    const relevantSegments = bezartIndex !== -1 ? segments.slice(bezartIndex + 1) : segments;
    
    const depth = relevantSegments.length;
    // For local development, we need to adjust the path
    const basePath = '../'.repeat(Math.max(0, depth));
    return basePath;
  }

  // Load navbar component
  async function loadNavbar() {
    const basePath = getBasePath();
    const navbarContainer = document.getElementById('navbar-container');
    
    if (!navbarContainer) {
      console.error('Navbar container not found');
      return;
    }

    try {
      const response = await fetch(`${basePath}components/navbar.html`);
      if (!response.ok) {
        throw new Error(`Failed to load navbar: ${response.status}`);
      }
      
      const navbarHTML = await response.text();
      navbarContainer.innerHTML = navbarHTML;
      
      // Initialize navbar functionality
      initializeNavbar(basePath);
    } catch (error) {
      console.error('Error loading navbar:', error);
      // Fallback: create basic navbar
      navbarContainer.innerHTML = `
        <nav class="navbar">
          <div class="navbar-container">
            <a href="/Bezart/" class="navbar-logo">
              <img src="/Bezart/assets/Bezart.png" alt="Bezart" style="height: 28px;">
            </a>
          </div>
        </nav>
      `;
    }
  }

  // Initialize navbar interactivity
  function initializeNavbar(basePath) {
    // Load navbar CSS
    loadCSS(`${basePath}css/navbar.css`);
    
    // Fix logo path based on current directory depth
    const logoImage = document.querySelector('.logo-image');
    if (logoImage) {
      logoImage.src = `${basePath}assets/Bezart.png`;
    }
    
    // Check login status and update navbar
    checkLoginStatus(basePath);

    // Search toggle functionality
    const searchToggle = document.getElementById('search-toggle');
    const searchBox = document.getElementById('search-box');
    
    if (searchToggle && searchBox) {
      searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        searchBox.classList.toggle('active');
        if (searchBox.classList.contains('active')) {
          document.getElementById('search-input')?.focus();
        }
      });

      // Close search box when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
          searchBox.classList.remove('active');
        }
      });

      // Prevent search box from closing when clicking inside
      searchBox.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (mobileMenuToggle && navbarMenu) {
      mobileMenuToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('mobile-active');
        mobileMenuToggle.classList.toggle('active');
        
        // We no longer need to clone user-info since it's already inside navbar-menu
        // and correctly visible when the mobile menu is active.
      });

      // Close mobile menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navbarMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
          navbarMenu.classList.remove('mobile-active');
          mobileMenuToggle.classList.remove('active');
        }
      });
    }

    // Highlight current page in navbar
    highlightCurrentPage();
  }

  // Load CSS dynamically
  function loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  // Highlight current page in navigation
  function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-link');
    
    navLinks.forEach(link => {
      const linkPath = new URL(link.href, window.location.origin).pathname;
      
      // Exact match or parent directory match
      if (currentPath === linkPath || currentPath.startsWith(linkPath + '/')) {
        link.style.color = '#0071e3';
        link.style.fontWeight = '500';
      }
    });
  }
  
  // Check login status and update navbar
  async function checkLoginStatus(basePath) {
    const ticket = localStorage.getItem('bezart_ticket');
    const loginLink = document.querySelector('a[href="/login/"]');
    
    if (!ticket || !loginLink) return;
    
    try {
      const res = await fetch('https://bezart-auth.noppo5319.workers.dev/auth/v1/user?ticket=' + ticket);
      const data = await res.json();
      
      if (res.ok && !data.error) {
        // User is logged in - replace login link with user info
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        const avatarImg = document.createElement('img');
        avatarImg.src = data.avatar;
        avatarImg.alt = data.userId;
        avatar.appendChild(avatarImg);
        
        const userDetails = document.createElement('div');
        userDetails.className = 'user-details';
        
        const userName = document.createElement('span');
        userName.className = 'user-name';
        userName.textContent = data.userId;
        userDetails.appendChild(userName);
        
        const logoutButton = document.createElement('button');
        logoutButton.className = 'logout-button';
        logoutButton.textContent = 'ログアウト';
        logoutButton.addEventListener('click', () => {
          const currentTicket = localStorage.getItem('bezart_ticket');
          localStorage.removeItem('bezart_ticket');
          window.location.href = `https://bezart-auth.noppo5319.workers.dev/logout?ticket=${currentTicket}&redirect=${encodeURIComponent(window.location.href)}`;
        });
        userDetails.appendChild(logoutButton);
        
        userInfo.appendChild(avatar);
        userInfo.appendChild(userDetails);
        
        loginLink.parentNode.replaceChild(userInfo, loginLink);
      }
    } catch (e) {
      console.error('Login status check failed:', e);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
  } else {
    loadNavbar();
  }
})();