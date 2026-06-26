// This script injects a premium maintenance overlay without touching your React code.
// You can add this script via Netlify Snippet Injection (Settings > Site configuration > Build & deploy > Snippet injection)
// Or simply link it in your index.html: <script src="/maintenance-inject.js"></script>

(function () {
  // Check if we want to enable maintenance mode. 
  // You can toggle this boolean or fetch it from an external config.
  const MAINTENANCE_MODE_ENABLED = true;

  if (!MAINTENANCE_MODE_ENABLED) return;

  // Wait for the DOM to be ready
  document.addEventListener("DOMContentLoaded", () => {
    // Create the overlay container
    const overlay = document.createElement("div");
    overlay.id = "pink-cloud-maintenance-overlay";
    
    // Premium Styling
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "#121212";
    overlay.style.color = "#ffffff";
    overlay.style.zIndex = "999999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.fontFamily = "'Inter', 'Roboto', sans-serif";
    overlay.style.textAlign = "center";
    overlay.style.padding = "20px";
    overlay.style.boxSizing = "border-box";
    overlay.style.overflow = "hidden";

    // Add a subtle animated background gradient
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
      
      #pink-cloud-maintenance-overlay {
        background: radial-gradient(circle at center, #2a081a 0%, #121212 100%);
        animation: pulseBg 6s infinite alternate;
      }
      
      @keyframes pulseBg {
        0% { background: radial-gradient(circle at center, #2a081a 0%, #121212 100%); }
        100% { background: radial-gradient(circle at center, #3d0c26 0%, #121212 100%); }
      }

      .maintenance-content {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 95, 162, 0.2);
        padding: 40px 30px;
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(255, 95, 162, 0.1);
        max-width: 500px;
        animation: floatUp 0.8s ease-out forwards;
        transform: translateY(20px);
        opacity: 0;
      }

      @keyframes floatUp {
        to { transform: translateY(0); opacity: 1; }
      }

      .maintenance-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 24px;
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }

      .maintenance-title {
        font-size: 28px;
        font-weight: 800;
        margin: 0 0 16px 0;
        background: linear-gradient(135deg, #FF5FA2, #FF8DBE);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.5px;
      }

      .maintenance-text {
        font-size: 16px;
        line-height: 1.6;
        color: #A0A0A0;
        margin: 0 0 32px 0;
        font-weight: 400;
      }

      .maintenance-badge {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 999px;
        background: rgba(255, 95, 162, 0.1);
        color: #FF5FA2;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid rgba(255, 95, 162, 0.3);
      }
    `;
    document.head.appendChild(styleSheet);

    // SVG Icon (Sparkles / Cloud / Wrench)
    const iconSvg = `
      <svg class="maintenance-icon" viewBox="0 0 24 24" fill="none" stroke="#FF5FA2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
    `;

    // Overlay HTML Structure
    overlay.innerHTML = `
      <div class="maintenance-content">
        ${iconSvg}
        <h1 class="maintenance-title">We're Tuning Up</h1>
        <p class="maintenance-text">
          Pink Cloud is currently undergoing scheduled maintenance to bring you an even better budgeting experience. We'll be back online shortly!
        </p>
        <div class="maintenance-badge">Be right back 🚀</div>
      </div>
    `;

    // Inject into the body, overriding the root app
    document.body.appendChild(overlay);
    
    // Optional: Hide the main React root to prevent scrolling or interaction
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.style.display = "none";
    }
  });
})();
