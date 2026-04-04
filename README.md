# Air BNB (Listings) — Express + MongoDB

A small **server-rendered** web app for browsing and managing property-style **listings**. Built with **Node.js**, **Express**, **MongoDB** (via **Mongoose**), and **EJS** templates with **ejs-mate** layouts.

---

## Features

- List all listings in a responsive grid
- View a single listing
- Create a listing (form POST)
- Edit a listing (HTML form + **PATCH** via **method-override**)
- Delete a listing (currently **`GET`** — simple but not ideal for production)
- Optional **seed script** to reset the database with sample data

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Runtime | Node.js (CommonJS) |
| HTTP | Express 5 |
| Database | MongoDB |
| ODM | Mongoose |
| Views | EJS + ejs-mate |
| UI | Bootstrap 5 & Font Awesome (CDN) + custom CSS in `public/css/` |

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (or change the connection string in `app.js` / `init/index.js`)

Default connection string in code:

`mongodb://127.0.0.1:27017/airbnb`

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/soumya007GitHub/AirBNB.git
cd "Air BNB"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start MongoDB

Ensure the MongoDB service is running and accepts connections on **`27017`**.

### 4. (Optional) Seed sample data

Wipes existing listings in the **`airbnb`** database, then inserts samples:

```bash
node init/index.js
```

### 5. Run the application

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
├── app.js                 # Express app, middleware, routes
├── package.json
├── package-lock.json
├── README.md
├── PROJECT_STRUCTURE.md   # Detailed architecture & code notes
├── models/
│   └── listing.js         # Mongoose Listing schema
├── init/
│   ├── data.js            # Sample listings array
│   └── index.js           # Seed script (destructive)
├── views/
│   ├── layouts/           # ejs-mate layout shell
│   ├── includes/          # Navbar, footer partials
│   └── listings/          # List, new, show, edit pages
└── public/
    └── css/               # Static styles (served from /css/...)
```

---

## HTTP routes (overview)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Simple text home / test |
| GET | `/testListing` | Inserts one hard-coded listing (dev helper) |
| GET | `/listings` | All listings |
| GET | `/listings/new` | New listing form |
| POST | `/listings/new` | Create listing |
| GET | `/listings/:id` | Show one listing |
| GET | `/listings/:id/edit` | Edit form |
| PATCH | `/listings/:id` | Update listing (form uses `_method=PATCH`) |
| GET | `/listings/:id/delete` | Delete listing |

---

## Documentation

For **line-by-line backend notes**, **why folders exist**, and **EJS data flow** (without HTML/CSS walkthroughs), see **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**.

---

## License

ISC
