This `README.md` is designed to be your project’s "Source of Truth." It provides the architectural context your AI needs to write code that won't crash on a 1GB RAM device.

---

# 📦 Kasirpuintar POS & Inventory

### *Local-First. Performance-Obsessed. Owner-Focused.*

Kasirpuintar is a professional-grade Point of Sale and Inventory management system built for **low-resource Android tablets (1–2GB RAM)**. It uses a local-first architecture to ensure the checkout line never stops, even if the internet does.

---

## 🛠 Tech Stack (The "Low-RAM" Combo)

* **Framework:** [Expo](https://expo.dev/) (React Native) + Expo Router.
* **Styling:** [NativeWind v4+](https://www.nativewind.dev/) (Tailwind CSS) - *Zero runtime overhead.*
* **Local Database:** [WatermelonDB](https://nozbe.github.io/WatermelonDB/) - *Reactive SQLite that only loads what it needs.*
* **Cloud Sync/Auth:** [Supabase](https://supabase.com/).
* **List Rendering:** [@shopify/flash-list](https://shopify.github.io/flash-list/) - *10x faster than FlatList for long inventories.*
* **Icons:** Lucide React Native.

---

## 📂 System Architecture & Folder Structure

```text
/app
  ├── index.tsx              # Entry Point: Auth & Role Redirect logic
  ├── (auth)                 # Auth Group: login.tsx
  ├── (employee)             # Employee Group (Tabs)
  │   ├── _layout.tsx        # Tab Config
  │   ├── dashboard.tsx      # Shift Timer & Status
  │   ├── pos.tsx            # High-Performance Checkout
  │   ├── inventory.tsx      # Read-only stock view
  │   └── history.tsx        # Personal shift reports
  └── (admin)                # Owner Group (Drawer/Tabs)
      ├── _layout.tsx        # Admin Navigation
      ├── analytics.tsx      # Sales Graphs (Daily/Monthly)
      ├── employees.tsx      # Employee CRUD & Shift tracking
      ├── products.tsx       # Full Inventory & COGS management
      └── settings.tsx       # Printer Config & Sync Control
/components
  ├── /ui                    # Atomic components (Themed Buttons, Cards, Inputs)
  ├── /pos                   # Cart items, Quantity pickers, Menu Grid
  └── /charts                # Lightweight wrappers for sales data
/db
  ├── schema.ts              # WatermelonDB Schema
  ├── migrations.ts          # Database versioning
  └── models.ts              # Product, Transaction, Shift, User models
/hooks                       # usePrinter(), useCart(), useShiftTimer()
/services                    # Supabase Client & Watermelon Sync Logic
/utils                       # Currency formatters, Receipt generator

```

---

## 📋 Core Functionalities

### 👷 Employee Module

* **Shift Management:** Automatic "Clock-in" upon login. Real-time timer showing shift duration.
* **Smart POS:** Searchable grid, category filters, and a "Quick-Add" cart.
* **Printer Settings:** Bluetooth/LAN discovery for thermal receipt printers.
* **Shift History:** View total income, expenses, and net profit before "Clocking out."

### 👩‍💼 Owner (Admin) Module

* **Deep Analytics:** Visualized sales data, peak hour identification, and profit margins.
* **Full Inventory:** SKU tracking, Cost of Goods Sold (COGS), and stock alerts.
* **Staff Control:** Manage roles, view individual shift performance, and audit expenses.
* **Data Export:** CSV/PDF export for tax and accounting purposes.
* **Sync Logic:** Toggle between manual sync or scheduled hourly background sync.

---

## 🚀 Performance Rules (The 1GB RAM Survival Guide)

To ensure the app doesn't lag on the target hardware, all code must follow these rules:

1. **FlashList Only:** Never use `ScrollView` or `FlatList` for dynamic data.
2. **Image Optimization:** Product images must be tiny thumbnails (max 150px). Use `expo-image` for caching.
3. **No Heavy Math on Main Thread:** Use `useMemo` for cart calculations and `reanimated` for all UI movements.
4. **Lazy Loading:** Use WatermelonDB's `@observe` to only re-render the specific UI row that changed, not the whole list.

---

## 🏗 Setup & Installation

1. **Initialize Expo:**
```bash
npx create-expo-app@latest -t tabs

```


2. **Install Performance Packages:**

```bash
    npx expo install nativewind tailwindcss react-native-reanimated @shopify/flash-list @nozbe/watermelondb @nozbe/with-observables @supabase/supabase-js lucide-react-native
    ```
3.  **Tailwind Config:**
    Initialize `tailwind.config.js` and add `nativewind/babel` to `babel.config.js`.

---

## 🛠 AI Prompting Roadmap

### Phase 1: The Shell
> "Setup the Expo Router structure defined in the README. Create the (auth), (employee), and (admin) groups. Implement a clean, minimalist Tailwind theme using Slate-50 and a Primary Green (#16a34a)."

### Phase 2: The POS UI (Demo Ready)
> "Create the POS screen in `(employee)/pos.tsx`. Use `@shopify/flash-list` for a 3-column product grid on the left and a scrollable Cart on the right. Add a 'Total' footer with a large 'Process Payment' button."

### Phase 3: Local Database (WatermelonDB)
> "Define the WatermelonDB schema for Products, Shifts, and Transactions. Create a hook `useCart` that persists items to the local database to prevent data loss if the app crashes."

### Phase 4: Admin Analytics
> "Build the Admin Analytics dashboard. Create 3 cards for 'Today's Revenue', 'Active Shifts', and 'Low Stock'. Add a Bar Chart showing sales trends for the week."

---

## 📝 Future Notes
*   Integration for **ESC/POS** thermal printing commands.
*   Offline-first conflict resolution logic for Supabase sync.
*   Barcode scanner integration via `expo-camera`.

---

**Pro-Tip for Development:** Since you are building for your mom, focus on **"Single-Tap" actions**. In a busy store, every extra click is a pain. If you can make an action happen in one tap instead of two, do it!

```

