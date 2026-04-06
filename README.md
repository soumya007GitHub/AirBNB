# Air BNB (Listings) — Express + MongoDB

A small **server-rendered** web app for browsing and managing property-style **listings**. Built with **Node.js**, **Express**, **MongoDB** (via **Mongoose**), and **EJS** templates with **ejs-mate** layouts. Listings and reviews store an **`owner`** (**`User`** ref). **Passport** handles signup/login; **`middleware.js`** guards routes. **Listing photos** upload to **Cloudinary** (**Multer** + **`multer-storage-cloudinary`**); URLs and **`public_id`** are stored on each listing. Route files under **`routes/`** delegate to **`controllers/`**; **`app.js`** loads **`.env`** first for Cloudinary credentials.

---

## Features

- List all listings in a responsive grid
- View a single listing and its reviews (listing and review authors populated for display)
- **Create a listing** (login required) with **image upload to Cloudinary**; **`owner`** set to the logged-in user
- Edit / delete **your own** listings; **optional** new image on edit
- Add reviews when logged in; delete **your own** reviews
- Client-side validation on forms (Bootstrap + `public/js/script.js`)
- **User registration**, **login**, **logout** — Passport sessions
- Central **404** and **error** pages (`views/error/`)
- **Flash messages** via **express-session** + **connect-flash** + `views/includes/flash.ejs`
- Optional **seed script** for sample listings (`init/index.js`)

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
| Config | dotenv (`.env` for `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`) |
| Sessions / UX | express-session + connect-flash |
| UI | Bootstrap 5 & Font Awesome (CDN) + custom CSS in `public/css/` + small JS in `public/js/` |

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (or change the connection string in `app.js` / `init/index.js`)
- [Cloudinary](https://cloudinary.com/) account (for listing images)

Default MongoDB connection string in code:

`mongodb://127.0.0.1:27017/airbnb`

Create a **`.env`** file in the project root (see **`cloudConfig.js`** for variable names):

- `CLOUD_NAME` (or `CLOUDINARY_CLOUD_NAME`)
- `CLOUD_API_KEY` (or `CLOUDINARY_API_KEY`)
- `CLOUD_API_SECRET` (or `CLOUDINARY_API_SECRET`)

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

Add **`.env`** with Cloudinary keys (required for **Add listing** with image).

### 5. (Optional) Seed sample data

Wipes existing listings in the **`airbnb`** database, then inserts samples:

```bash
node init/index.js
```

> **Note:** The seed script clears **listings** only, not **reviews** or **users**. Seeded rows may omit **`owner`** until you create listings through the app.

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
├── app.js                 # dotenv first; Express, session, Passport, mount routers
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

## HTTP routes (overview)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Simple text home / test |
| GET | `/testListing` | Inserts one hard-coded listing (dev helper) |
| GET | `/demouser` | Demo **`User.register`** (dev helper) |
| GET | `/listings` | All listings |
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
