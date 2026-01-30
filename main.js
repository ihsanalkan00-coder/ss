// Main JavaScript functionality with Performance Optimizations
let localGamesData = [] // Local copy of games data
let currentPage = 1
const GAMES_PER_PAGE = 50
let filteredGames = []
let currentFilter = 'all'
let currentPlatform = 'all'
let currentSearchTerm = ''
let isLoading = false

document.addEventListener("DOMContentLoaded", () => {
  // Initialize the page
  initializePage()

  // Set up event listeners
  setupEventListeners()

  // Load and display games using the data from games-data.js
  console.log("Checking for games data...", window.gamesData ? window.gamesData.length : "undefined")
  
  if (window.gamesData && window.gamesData.length > 0) {
    localGamesData = window.gamesData
    console.log("Found games data immediately:", localGamesData.length)
    initializeGameDisplay()
  } else {
    console.log("No games data found, setting up retry logic")
    // Add multiple retries with increasing delays
    let retryCount = 0
    const maxRetries = 10
    
    const retryLoadGames = () => {
      retryCount++
      console.log(`Retry ${retryCount}/${maxRetries}: Checking for games data...`)
      
      if (window.gamesData && window.gamesData.length > 0) {
        localGamesData = window.gamesData
        console.log("Found games data after retry:", localGamesData.length)
        initializeGameDisplay()
      } else if (retryCount < maxRetries) {
        setTimeout(retryLoadGames, 50 * retryCount) // Increasing delay
      } else {
        console.error("Games data not loaded after", maxRetries, "retries")
        showErrorMessage("Error: Unable to load games data")
      }
    }
    
    setTimeout(retryLoadGames, 50)
  }

  // Generate structured data after games are loaded
  setTimeout(() => {
    if (localGamesData.length > 0) {
      generateStructuredData()
    }
  }, 200)
})

function initializeGameDisplay() {
  filteredGames = localGamesData
  currentPage = 1
  displayGames()
  setupInfiniteScroll()
}

function initializePage() {
  // Mobile menu functionality
  const mobileMenuBtn = document.getElementById("mobileMenuBtn")
  const navLinks = document.querySelector(".nav-links")

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active")
    })
  }
}

function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById("searchInput")
  const searchBtn = document.getElementById("searchBtn")

  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearch, 300))
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch()
      }
    })
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch)
  }

  // Filter functionality
  const filterButtons = document.querySelectorAll(".filter-btn")
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active class from all buttons
      filterButtons.forEach((b) => b.classList.remove("active"))
      // Add active class to clicked button
      this.classList.add("active")

      const category = this.getAttribute("data-category")
      currentFilter = category
      currentPage = 1
      applyFilters()
    })
  })

  // Platform filtering functionality
  const platformButtons = document.querySelectorAll(".platform-btn")
  platformButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active class from all platform buttons
      platformButtons.forEach((b) => b.classList.remove("active"))
      // Add active class to clicked button
      this.classList.add("active")

      const platform = this.getAttribute("data-platform")
      currentPlatform = platform
      currentPage = 1
      applyFilters()
    })
  })
}

function setupInfiniteScroll() {
  const gamesGrid = document.getElementById("gamesGrid")
  if (!gamesGrid) return

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoading) {
        loadMoreGames()
      }
    })
  }, {
    rootMargin: '200px'
  })

  // Create and observe a sentinel element
  const sentinel = document.createElement('div')
  sentinel.id = 'scroll-sentinel'
  sentinel.style.height = '1px'
  gamesGrid.parentNode.appendChild(sentinel)
  observer.observe(sentinel)
}

function applyFilters() {
  let games = localGamesData

  // Apply category filter
  if (currentFilter !== 'all') {
    games = games.filter(game => game.category === currentFilter)
  }

  // Apply platform filter
  if (currentPlatform !== 'all') {
    games = games.filter(game => {
      const platform = getGamePlatform(game)
      return platform === currentPlatform || platform === 'both'
    })
  }

  // Apply search filter
  if (currentSearchTerm) {
    games = games.filter(game =>
      game.title.toLowerCase().includes(currentSearchTerm) ||
      game.description.toLowerCase().includes(currentSearchTerm) ||
      game.tags.toLowerCase().includes(currentSearchTerm) ||
      game.category.toLowerCase().includes(currentSearchTerm)
    )
  }

  filteredGames = games
  currentPage = 1
  displayGames()
}

function displayGames() {
  const gamesGrid = document.getElementById("gamesGrid")
  const noResults = document.getElementById("noResults")

  if (!gamesGrid) return

  if (filteredGames.length === 0) {
    gamesGrid.style.display = "none"
    if (noResults) noResults.style.display = "block"
    return
  }

  gamesGrid.style.display = "grid"
  if (noResults) noResults.style.display = "none"

  // Clear grid if it's the first page
  if (currentPage === 1) {
    gamesGrid.innerHTML = ''
  }

  // Get games for current page
  const startIndex = (currentPage - 1) * GAMES_PER_PAGE
  const endIndex = startIndex + GAMES_PER_PAGE
  const gamesToShow = filteredGames.slice(startIndex, endIndex)

  // Create and append game cards
  const gameCards = gamesToShow.map(game => createGameCard(game)).join('')
  gamesGrid.insertAdjacentHTML('beforeend', gameCards)

  // Update load more button visibility
  updateLoadMoreButton()
}

function loadMoreGames() {
  if (isLoading) return
  
  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE)
  if (currentPage >= totalPages) return

  isLoading = true
  showLoadingSpinner()

  // Simulate loading delay for better UX
  setTimeout(() => {
    currentPage++
    displayGames()
    hideLoadingSpinner()
    isLoading = false
  }, 300)
}

function updateLoadMoreButton() {
  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE)
  const sentinel = document.getElementById('scroll-sentinel')
  
  if (sentinel) {
    sentinel.style.display = currentPage >= totalPages ? 'none' : 'block'
  }
}

function showLoadingSpinner() {
  const gamesGrid = document.getElementById("gamesGrid")
  let spinner = document.getElementById('loading-spinner')
  
  if (!spinner) {
    spinner = document.createElement('div')
    spinner.id = 'loading-spinner'
    spinner.className = 'loading-spinner'
    spinner.innerHTML = '<div class="spinner"></div><p>Loading more games...</p>'
    gamesGrid.parentNode.appendChild(spinner)
  }
  
  spinner.style.display = 'block'
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner')
  if (spinner) {
    spinner.style.display = 'none'
  }
}

function showErrorMessage(message) {
  const gamesGrid = document.getElementById("gamesGrid")
  if (gamesGrid) {
    gamesGrid.innerHTML = `<p style="text-align: center; color: red; grid-column: 1 / -1;">${message}</p>`
  }
}

function createGameCard(game) {
  try {
    return `
      <div class="game-card" onclick="playGame('${game.id}')">
        <img src="${game.thumb || ''}" alt="${game.title || 'Game'}" class="game-thumbnail" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfjoYgTm8gSW1hZ2U8L3RleHQ+PC9zdmc+'">
        <div class="game-content">
          <h3 class="game-title">${game.title || 'Untitled Game'}</h3>
        </div>
      </div>
    `
  } catch (error) {
    console.error("Error creating game card for game:", game, error)
    return `
      <div class="game-card">
        <div class="game-content">
          <h3 class="game-title">Error loading game</h3>
        </div>
      </div>
    `
  }
}

function handleSearch() {
  const searchInput = document.getElementById("searchInput")
  currentSearchTerm = searchInput.value.toLowerCase().trim()
  currentPage = 1
  applyFilters()
}

// Debounce function for search input
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function filterGames(category) {
  currentFilter = category
  currentPage = 1
  applyFilters()
}

function filterByPlatform(platform) {
  currentPlatform = platform
  currentPage = 1
  applyFilters()
}

function isMobileOptimized(game) {
  if (!game) return false
  
  const mobileKeywords = ['touch', 'tap', 'swipe', 'mobile', 'casual', 'simple', 'easy']
  const title = (game.title || '').toLowerCase()
  const description = (game.description || '').toLowerCase()
  const tags = (game.tags || '').toLowerCase()
  
  // Check for mobile keywords
  const hasMobileKeywords = mobileKeywords.some(keyword => 
    title.includes(keyword) || description.includes(keyword) || tags.includes(keyword)
  )
  
  // Check dimensions (portrait or square games are often mobile-friendly)
  const width = parseInt(game.width) || 800
  const height = parseInt(game.height) || 600
  const isPortraitOrSquare = height >= width || Math.abs(width - height) < 100
  
  // Check category (hypercasual games are typically mobile-friendly)
  const isMobileCategory = game.category === 'Hypercasual'
  
  return hasMobileKeywords || isPortraitOrSquare || isMobileCategory
}

function isDesktopOptimized(game) {
  if (!game) return false
  
  const desktopKeywords = ['keyboard', 'mouse', 'click', 'strategy', 'complex', 'wasd', 'arrow keys']
  const title = (game.title || '').toLowerCase()
  const description = (game.description || '').toLowerCase()
  const tags = (game.tags || '').toLowerCase()
  
  // Check for desktop keywords
  const hasDesktopKeywords = desktopKeywords.some(keyword => 
    title.includes(keyword) || description.includes(keyword) || tags.includes(keyword)
  )
  
  // Check dimensions (wide games are often desktop-optimized)
  const width = parseInt(game.width) || 800
  const height = parseInt(game.height) || 600
  const isWidescreen = width >= 800 && width > height * 1.3
  
  // Check category (action and sports games often work better on desktop)
  const isDesktopCategory = ['Action', 'Sports', 'Strategy'].includes(game.category)
  
  return hasDesktopKeywords || isWidescreen || isDesktopCategory
}

function getGamePlatform(game) {
  const mobile = isMobileOptimized(game)
  const desktop = isDesktopOptimized(game)
  
  if (mobile && desktop) return 'both'
  if (mobile) return 'mobile'
  if (desktop) return 'desktop'
  return 'both' // Default to both if unclear
}

function playGame(gameId) {
  const game = getGameById(gameId)
  if (game) {
    // Use the gameIdToFilename mapping to get the filename
    if (window.gameIdToFilename && window.gameIdToFilename[gameId]) {
      window.location.href = `games/${window.gameIdToFilename[gameId]}`
    } else {
      // Fallback to the old method if the mapping doesn't exist
      window.location.href = `game.html?id=${gameId}`
    }
  }
}

function getGameById(id) {
  return localGamesData.find(game => game.id === id)
}

function getGamesByCategory(category) {
  return localGamesData.filter(game => game.category === category)
}

function getRandomGames(count = 12, excludeId = null) {
  const availableGames = excludeId 
    ? localGamesData.filter(game => game.id !== excludeId)
    : localGamesData
  
  const shuffled = availableGames.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function getPlatformLabel(platform) {
  switch (platform) {
    case 'mobile':
      return '📱 Mobile'
    case 'desktop':
      return '💻 Desktop'
    case 'both':
      return '📱💻 All'
    default:
      return '🎮 Game'
  }
}

function generateStructuredData() {
  if (localGamesData.length === 0) return

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Free Online Games",
    "description": "Collection of 10,000+ free HTML5 games",
    "numberOfItems": localGamesData.length,
    "itemListElement": localGamesData.slice(0, 100).map((game, index) => ({
      "@type": "Game",
      "position": index + 1,
      "name": game.title,
      "description": game.description,
      "genre": game.category,
      "url": `https://unb-games.github.io/game.html?id=${game.id}`,
      "image": game.thumb,
      "applicationCategory": "Game"
    }))
  }

  const script = document.getElementById('games-structured-data')
  if (script) {
    script.textContent = JSON.stringify(structuredData)
  }
}

// Make functions available globally
window.getGameById = getGameById
window.getGamesByCategory = getGamesByCategory
window.getRandomGames = getRandomGames
