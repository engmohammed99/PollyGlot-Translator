// Configuration
const API_BASE_URL = "http://localhost:3000"; // Your backend server URL

// DOM Elements
const translateBtn = document.getElementById("translate-button");
const inputText = document.getElementById("text-to-translate");
const translatorCard = document.querySelector(".translator-card");

// Add character counter and result section to your HTML dynamically
function initializeUI() {
  // Add character counter after textarea
  const inputSection = document.querySelector(".input-section");
  const charCounter = document.createElement("div");
  charCounter.className = "char-counter";
  charCounter.innerHTML = '<span id="charCount">0</span>/1000 characters';
  inputSection.appendChild(charCounter);

  // Add loading spinner
  const loadingSpinner = document.createElement("div");
  loadingSpinner.id = "loadingSpinner";
  loadingSpinner.className = "loading-spinner";
  loadingSpinner.style.display = "none";
  loadingSpinner.innerHTML = `
        <div class="spinner"></div>
        <p>Translating your text...</p>
    `;
  translatorCard.insertBefore(loadingSpinner, translateBtn);

  // Add result section
  const resultSection = document.createElement("div");
  resultSection.id = "resultSection";
  resultSection.className = "result-section";
  resultSection.style.display = "none";
  resultSection.innerHTML = `
        <label class="section-label">Translation 🎯</label>
        <div class="result-container">
            <div id="resultText" class="result-text"></div>
            <button id="copyBtn" class="copy-button">📋 Copy</button>
        </div>
    `;
  translatorCard.appendChild(resultSection);

  // Add status message
  const statusMessage = document.createElement("div");
  statusMessage.id = "statusMessage";
  statusMessage.className = "status-message";
  statusMessage.style.display = "none";
  translatorCard.appendChild(statusMessage);
}

// Character counter functionality
function setupCharCounter() {
  const charCount = document.getElementById("charCount");

  inputText.addEventListener("input", function () {
    const count = this.value.length;
    charCount.textContent = count;
    charCount.style.color = count > 800 ? "#e74c3c" : "#666";
  });
}

// Main translation function - connects to backend
async function translateText(text, targetLanguage) {
  try {
    console.log(`🔄 Sending translation request to backend...`);

    const response = await fetch(`${API_BASE_URL}/api/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        targetLanguage: targetLanguage,
      }),
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Translation received:", data);

    return data;
  } catch (error) {
    console.error("❌ Translation API error:", error);
    throw new Error(`Connection failed: ${error.message}`);
  }
}

// Set loading state
function setLoadingState(isLoading) {
  const loadingSpinner = document.getElementById("loadingSpinner");

  if (isLoading) {
    // Show loading
    translateBtn.textContent = "Translating...";
    translateBtn.disabled = true;
    translateBtn.style.backgroundColor = "#95a5a6";
    translateBtn.style.cursor = "not-allowed";
    loadingSpinner.style.display = "block";
    document.getElementById("resultSection").style.display = "none";
  } else {
    // Hide loading
    translateBtn.textContent = "Translate";
    translateBtn.disabled = false;
    translateBtn.style.backgroundColor = "#2980b9";
    translateBtn.style.cursor = "pointer";
    loadingSpinner.style.display = "none";
  }
}

// Display translation result
function displayTranslationResult(result) {
  const resultText = document.getElementById("resultText");

  resultText.innerHTML = `
        <div class="translation-result">
            <div class="original">
                <strong>Original:</strong><br>
                ${result.original}
            </div>
            <div class="translated">
                <strong>${result.targetLanguage}:</strong><br>
                ${result.translated}
            </div>
            <div class="timestamp">
                Translated at: ${new Date(result.timestamp).toLocaleString()}
            </div>
        </div>
    `;

  document.getElementById("resultSection").style.display = "block";

  // Smooth scroll to result
  setTimeout(() => {
    document.getElementById("resultSection").scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 100);
}

// Show status message
function showStatusMessage(message, type) {
  const statusMessage = document.getElementById("statusMessage");

  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = "block";

  setTimeout(() => {
    statusMessage.style.display = "none";
  }, 5000);
}

// Perform translation with UI updates
async function performTranslation(text, language) {
  // Update UI - Loading state
  setLoadingState(true);

  try {
    // Call backend API
    const result = await translateText(text, language);

    if (result.success) {
      // Show successful translation
      displayTranslationResult(result);
      showStatusMessage("Translation completed successfully! 🎉", "success");
    } else {
      throw new Error(result.error || "Translation failed");
    }
  } catch (error) {
    // Show error
    showStatusMessage(`Translation failed: ${error.message}`, "error");
    console.error("Translation error:", error);
  } finally {
    // Reset UI
    setLoadingState(false);
  }
}

// Translate button click handler
function setupTranslateButton() {
  translateBtn.addEventListener("click", async function () {
    const text = inputText.value.trim();
    const selectedLang = document.querySelector(
      'input[name="language"]:checked'
    );

    // Validation
    if (!text) {
      showStatusMessage("Please enter some text to translate!", "error");
      inputText.focus();
      return;
    }

    if (!selectedLang) {
      showStatusMessage("Please select a target language!", "error");
      return;
    }

    if (text.length > 1000) {
      showStatusMessage("Text too long! Maximum 1000 characters.", "error");
      return;
    }

    // Start translation
    await performTranslation(text, selectedLang.value);
  });
}

// Copy functionality
function setupCopyButton() {
  document.addEventListener("click", async function (e) {
    if (e.target.id === "copyBtn") {
      try {
        const resultText = document.getElementById("resultText");
        const translatedText = resultText
          .querySelector(".translated")
          .textContent.replace(/^[^:]+:\s*/, "");
        await navigator.clipboard.writeText(translatedText);

        e.target.textContent = "✅ Copied!";
        e.target.style.backgroundColor = "#27ae60";

        setTimeout(() => {
          e.target.textContent = "📋 Copy";
          e.target.style.backgroundColor = "#3498db";
        }, 2000);
      } catch (err) {
        showStatusMessage("Failed to copy text", "error");
      }
    }
  });
}

// Check backend health on page load
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const health = await response.json();

    if (health.status === "healthy") {
      console.log("✅ Backend connection successful");
      showStatusMessage("Connected to translation service! 🌍", "success");
    }
  } catch (error) {
    console.error("❌ Backend connection failed:", error);
    showStatusMessage(
      "⚠️ Backend connection failed. Please check if server is running.",
      "error"
    );
  }
}

// Initialize the application
function init() {
  console.log("🚀 PollyGlot Frontend Initializing...");

  // Setup UI components
  initializeUI();
  setupCharCounter();
  setupTranslateButton();
  setupCopyButton();

  // Check backend connection
  checkBackendHealth();

  console.log("✅ PollyGlot Frontend Ready!");
}

// Start the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
