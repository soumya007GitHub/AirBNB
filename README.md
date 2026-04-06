# Air BNB (Listings) — Express + MongoDB

A small **server-rendered** web app for browsing and managing property-style **listings**. Built with **Node.js**, **Express**, **MongoDB** (via **Mongoose**), and **EJS** templates with **ejs-mate** layouts. Listings and reviews store an **`owner`** (**`User`** ref). **Passport** handles signup/login; **`middleware.js`** guards routes. **Sessions** are stored in MongoDB via **`connect-mongo`** (same cluster as **`ATLAS_DB_URL`**), with **`SESSION_SECRET`** encrypting session data in the store. **Listing photos** upload to **Cloudinary** (**Multer** + **`multer-storage-cloudinary`**). Route files under **`routes/`** delegate to **`controllers/`**; **`app.js`** loads **`.env`** first.

---

## Features

- List all listings in a responsive grid
- **Browse filters on the index page**: **`GET /listings?search=...&category=...`**
  - **Search** matches **title**, **location**, or **country** (case-insensitive; regex special characters escaped).
  - **Category** chips filter by the listing’s **`category`** field (values such as **`camping`**, **`boats`**, **`rooms`**, **`trending`**, etc.—defined in **`utils/listingCategories.js`**). Search and category combine with **AND** (both apply when present).
  - **“Display total after taxes”** uses each listing’s **`gstPercentage`** on the card (client-side only; stored per listing).
- View a single listing and its reviews (listing and review authors populated for display)
- **Create a listing** (login required) with **image upload to Cloudinary**; **`owner`** set to the logged-in user; choose **category** and **GST %**
- Edit / delete **your own** listings; **optional** new image on edit; update **category** / **GST %**
- Add reviews when logged in; delete **your own** reviews
- Client-side validation on forms (Bootstrap + `public/js/script.js`)
- **User registration**, **login**, **logout** — Passport sessions
- Central **404** and **error** pages (`views/error/`)
- **Flash messages** via **express-session** + **connect-flash** + `views/includes/flash.ejs`
- Optional **seed script** for sample listings (`init/index.js`) — assigns default **`owner`**, round-robin **`category`**, and rotating **`gstPercentage`** (5 / 12 / 18) when not set in **`init/data.js`**

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Runtime | Node.js (CommonJS) |
| HTTP | Express 5 |
| Database | MongoDB |
| ODM | Mongoose |
| Views | EJS + ejs-mate |
| Auth | Passport + passport-local + passport-local-mongoose |
| Images | Cloudinary + Multer + multer-storage-cloudinary |
| Config | dotenv (`.env`: Cloudinary vars, **`ATLAS_DB_URL`**, **`SESSION_SECRET`**) |
| Sessions / UX | express-session + **connect-mongo** (Mongo session store) + connect-flash |
| UI | Bootstrap 5 & Font Awesome (CDN) + custom CSS in `public/css/` + small JS in `public/js/` |

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) or **MongoDB Atlas** — the app uses **`ATLAS_DB_URL`** in **`.env`** (see **`app.js`**). The **seed** script **`init/index.js`** still uses a **local** URI by default; change it there if you seed Atlas.
- [Cloudinary](https://cloudinary.com/) account (for listing images)

The **running app** reads the DB from **`ATLAS_DB_URL`** in **`.env`**. The **seed** script uses a fixed local URI unless you edit **`init/index.js`**:

`mongodb://127.0.0.1:27017/airbnb`

Create a **`.env`** file in the project root:

- **`ATLAS_DB_URL`** — MongoDB connection string for the app (**required** for **`mongoose`** + session store)
- **`SESSION_SECRET`** — long random string for **express-session** and **connect-mongo** encryption (**use a strong value in production**)
- Cloudinary (see **`cloudConfig.js`** for aliases): `CLOUD_NAME` (or `CLOUDINARY_CLOUD_NAME`), `CLOUD_API_KEY`, `CLOUD_API_SECRET`

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/soumya007GitHub/AirBNB.git
cd AirBNB
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start MongoDB

Ensure the MongoDB service is running and accepts connections on **`27017`**.

### 4. Configure environment

Add **`.env`** with **`ATLAS_DB_URL`**, **`SESSION_SECRET`**, and Cloudinary keys (Cloudinary required for **Add listing** with image).

### 5. (Optional) Seed sample data

Wipes existing listings in the **`airbnb`** database, then inserts samples:

```bash
node init/index.js
```

> **Note:** The seed script clears **listings** only, not **reviews** or **users**. It fills **`owner`** (default id), **`category`**, and **`gstPercentage`** on each row when missing—see **`PROJECT_STRUCTURE.md`** §17.

### 6. Run the application

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

Open **http://localhost:8080**

---

## npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **`start`** | `node app.js` | Run the server |
| **`dev`** | `nodemon app.js` | Run with file-watch restart |
| **`test`** | placeholder | No tests configured yet |

---

## Project structure

```
├── app.js                 # dotenv; MongoStore (connect-mongo); session + Passport; mount routers
├── cloudConfig.js         # Cloudinary + Multer CloudinaryStorage
├── middleware.js          # isLoggedIn, isOwner, isReviewOwner
├── package.json
├── package-lock.json
├── README.md
├── PROJECT_STRUCTURE.md   # Detailed architecture & code notes
├── controllers/
│   ├── listings.js        # Listing CRUD + render (uses req.file for images)
│   ├── users.js           # Signup, login, logout
│   └── reviews.js         # Add/delete reviews
├── routes/
│   ├── listingRoutes.js   # /listings + Multer wrappers
│   ├── reviewRoutes.js    # /listings/:id/reviews
│   └── userRoutes.js      # /user
├── models/
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── utils/
│   ├── listingCategories.js # Category enum + labels/icons (schema, index filters, forms, seed)
│   ├── wrapAsync.js
│   └── ExpressError.js
├── init/
│   ├── data.js
│   └── index.js
├── views/
│   ├── layouts/
│   ├── includes/
│   ├── listings/
│   ├── users/
│   └── error/
└── public/
    ├── css/
    └── js/
```

---

## Listings index: search and category filters

The browse page is **`GET /listings`** (see **`views/listings/index.ejs`** and **`controllers/listings.js`**).

| Query | Effect |
|--------|--------|
| **`search`** | Case-insensitive match on **title**, **location**, or **country** (regex; special characters escaped). Omit or leave empty to not filter by text. |
| **`category`** | Exact match on the listing’s **`category`** field. Must be one of the values below (same strings as in **`utils/listingCategories.js`**). Invalid values are ignored. |

**Search + category together:** Both apply: MongoDB query is **(title ∨ location ∨ country)** **and** **category** when both are present.

| Use in `?category=` | Label on UI |
|---------------------|-------------|
| `trending` | Trending |
| `rooms` | Rooms |
| `iconic-cities` | Iconic Cities |
| `mountains` | Mountains |
| `castles` | Castles |
| `amazing-pools` | Amazing Pools |
| `camping` | Camping |
| `farms` | Farms |
| `arctic` | Arctic |
| `domes` | Domes |
| `boats` | Boats |

**Examples:** `/listings?category=boats` — only listings saved with **`category: "boats"`**. `/listings?search=india&category=camping` — camping listings whose title, location, or country matches “india”. **“Display total after taxes”** on the index is **client-side** only (uses each listing’s **`gstPercentage`**).

---

## HTTP routes (overview)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | No active handler in **`app.js`** (commented) → **404** page |
| GET | `/testListing` | Inserts one hard-coded listing (dev helper) |
| GET | `/demouser` | Demo **`User.register`** (dev helper) |
| GET | `/listings` | Listings (optional **`?search=`** on title/location/country; **`?category=`** = enum value from **`listingCategories.js`**) |
| GET | `/listings/new` | New listing form |
| POST | `/listings/new` | Create listing (**multipart** + Cloudinary image) |
| GET | `/listings/:id` | Show one listing |
| GET | `/listings/:id/edit` | Edit form |
| PATCH | `/listings/:id` | Update listing (optional new image) |
| GET | `/listings/:id/delete` | Delete listing |
| POST | `/listings/:id/reviews` | Create a review |
| GET | `/listings/:id/reviews/:reviewId` | Delete a review |
| GET | `/user/signup` | Sign-up form |
| POST | `/user/signup` | Register user |
| GET | `/user/login` | Login form |
| POST | `/user/login` | Log in |
| GET | `/user/logout` | Log out |

*(Controllers live in **`controllers/`**; route wiring in **`routes/`**.)*

---

## Documentation

For **structured backend notes**, **why folders exist**, and **EJS data flow** (without HTML/CSS walkthroughs), see **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**.

---

## License

ISC
