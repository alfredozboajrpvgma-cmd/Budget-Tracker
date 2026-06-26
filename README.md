# Pink Cloud

Pink Cloud is a highly interactive, Progressive Web Application (PWA) client designed to transform personal finance and budget tracking through gamification. By merging robust expense monitoring with engaging progression mechanics, the Pink Cloud interface encourages users to establish, maintain, and enjoy healthy financial habits.

## Comprehensive Feature Breakdown

### Financial Tracking & Budget Management
At its core, the client provides a seamless interface for a reliable financial ledger. 
- **Expense Logging:** Intuitive forms for logging daily expenses with categorical tagging.
- **Budget Monitoring:** Real-time data visualization of spending velocity versus the allocated budget limit.
- **Savings Goals:** Interactive dashboards to establish customized savings targets and visually track incremental progress over time.

### The "Sunshine Score" Interface
To provide immediate, actionable feedback on financial health, the client visualizes a proprietary metric known as the Sunshine Score. 
- **Dynamic Calculation:** The interface mathematically weights the user's spending intensity against their saving streak to produce a continuous, gamified health metric.
- **Visual Feedback:** The score directly influences the application's UI, providing immediate visual reinforcement for healthy financial decisions.

### Gamification & Quest System
To combat the fatigue typically associated with long-term financial tracking, the application incorporates RPG-style UI progression.
- **Dynamic Quests:** Users are presented with tailored financial challenges on their dashboard.
- **Milestone Rewards:** Completing quests triggers micro-animations and unlocks visual rewards and progression markers within the application interface.

### Progressive Web App (PWA) & Offline Resilience
The Pink Cloud client is built with an offline-first philosophy, ensuring the UI remains responsive and usable regardless of network conditions.
- **Installability:** The application can be installed natively on iOS, Android, and Desktop environments directly from the browser.
- **Service Workers:** Leveraging Workbox, the application aggressively caches static assets and essential application shells for instant loading.
- **Background Synchronization:** Utilizing IndexedDB for local state management, users can interact with the app and log expenses while entirely offline. The client seamlessly handles data reconciliation once network connectivity is restored.

## Technology Stack

- **Framework:** React 19 with TypeScript for robust, type-safe UI components.
- **Build Tool:** Vite for rapid compilation, Hot Module Replacement (HMR), and optimized production bundling.
- **Component Library:** Material UI (MUI) serves as the foundational design system, augmented by custom CSS.
- **Animation:** Framer Motion is utilized for fluid, micro-interaction animations that enhance the gamified feel.
- **Icons:** Lucide React and MUI Icons.
- **Service Workers:** Workbox for offline caching and PWA functionality.

## Local Development Setup

To run the Pink Cloud client locally, ensure you have Node.js (v18+) and npm installed.

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory and add the necessary environment configurations required by the Vite client.
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the Development Server**
   ```bash
   # Starts the Vite frontend development server
   npm run dev
   ```

4. **Production Build**
   ```bash
   # Compiles TypeScript and builds the optimized PWA bundle for deployment
   npm run build
   ```
