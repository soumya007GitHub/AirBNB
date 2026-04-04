# Project documentation — architecture and code notes

This file explains **why** the repo is laid out in folders (instead of one file), and gives **short notes** on backend and server-side template logic. **Plain HTML/CSS** in `.ejs` files and `public/css/styles.css` are not described line-by-line; only **EJS behavior** (layouts, data, forms, routes) is covered.

---

## 1. Backend vs frontend in this project

| Layer | What it is | Where it lives |
|--------|------------|----------------|
| **Backend** | Node.js process: HTTP server, MongoDB access, routing, form handling | `app.js`, `models/`, `init/` |
| **Server-rendered UI** | HTML produced on the server via EJS (not a separate SPA) | `views/` |
| **Static assets** | Files sent as-is (CSS, future images/JS) | `public/` |
| **Tooling / metadata** | Dependencies and lockfile | `package.json`, `package-lock.json` |

**Why not one file?**

- **Routes + DB + HTML in one file** becomes impossible to navigate and risky to change (one typo breaks everything).
- **Models** define data shape once; both the web app and the seed script reuse them.
- **Views** let you edit pages without rereading all route code.
- **`init/`** is destructive (wipes listings); it must not run every time the server starts.
- **`public/`** is separate so styles and CDN links stay cacheable and paths stay predictable (`/css/...`).

---

## 2. Folder and file roles (summary)

| Path | Role |
|------|------|
| `app.js` | Express app: middleware, Mongo connection, all HTTP routes. |
| `models/listing.js` | Mongoose schema and `Listing` model. |
| `init/data.js` | Array of sample listing objects; exported as `{ data }`. |
| `init/index.js` | Standalone script: connect, `deleteMany`, `insertMany` seed data. |
| `views/layouts/boilerplate.ejs` | ejs-mate layout: shared shell, `<%- body %>`, includes navbar/footer. |
| `views/includes/navbar.ejs` / `footer.ejs` | Reusable partials included from the layout. |
| `views/listings/*.ejs` | Page bodies for list / new / show / edit; use `layout(...)` and server variables. |
| `public/css/styles.css` | Site styles (not documented here). |

---

## 3. `package.json` (short notes)

| Field / entry | Note |
|---------------|------|
| `"type": "commonjs"` | Uses `require` / `module.exports`, not ESM `import` by default. |
| `"main": "index.js"` | npm default; the app you actually run is **`app.js`** (see `README.md` scripts). |
| `dependencies` | **express** — HTTP framework; **mongoose** — MongoDB ODM; **ejs** — templates; **ejs-mate** — layouts/blocks; **method-override** — treat POST as PATCH for HTML forms; **nodemon** — dev auto-restart (often installed as devDependency; here it is a dependency). |

---

## 4. `app.js` — line-by-line notes

| Lines | What it does |
|-------|----------------|
| 1–2 | Load Express and create the `app` instance. |
| 3 | Mongoose for MongoDB connection and models. |
| 4 | `Listing` model from `./models/listing.js`. |
| 5 | Node `path` for cross-platform file paths to the `views` and `public` folders. |
| 6 | `method-override` so forms can send PATCH via `?_method=PATCH`. |
| 7 | `ejs-mate` enables `layout()` in `.ejs` files. |
| 8 | MongoDB connection string: local DB **`airbnb`** on default port. |
| 10 | Register ejs-mate as the engine for files with extension **`ejs`**. |
| 11–12 | Use EJS as view engine; set views directory to **`./views`**. |
| 13 | Parse URL-encoded form bodies into **`req.body`** (`extended: true` allows rich objects; you mostly use flat fields). |
| 14 | Look for **`_method`** in query (used by the edit form) to override HTTP method. |
| 15 | Serve **`public/`** at site root (e.g. `/css/styles.css`). |
| 17–19 | `dbConnection` async function: **`mongoose.connect(URL)`**. |
| 21–25 | Run connection; log success or failure (errors are only logged, not sent to client). |
| 28–30 | **`GET /`** — simple text response (smoke test). |
| 32–43 | **`GET /testListing`** — builds one `Listing` in code, **`save()`**, responds with text (dev/demo helper). |
| 46–49 | **`GET /listings`** — **`find({})`**, render index with **`allListings`**. |
| 51–53 | **`GET /listings/new`** — render empty create form. |
| 55–70 | **`POST /listings/new`** — destructure **`req.body`**, map **`image`** string to **`{ url }`**, **`save()`**, redirect to index. |
| 72–76 | **`GET /listings/:id`** — **`findById`**, render show page with **`listing`**. |
| 79–83 | **`GET /listings/:id/edit`** — **`findById`**, render update form with current values. |
| 85–92 | **`PATCH /listings/:id`** — **`findByIdAndUpdate`** with body fields; default image URL if missing; redirect to list. |
| 94–98 | **`GET /listings/:id/delete`** — **`findByIdAndDelete`**, redirect (note: DELETE via GET is convenient but not ideal for production). |
| 101–103 | Listen on port **8080**. |

**Robustness note (optional improvement):** Invalid `:id` values (e.g. `styles.css` if a static URL is mistaken for a route) cause Mongoose **CastError**. Validating with **`mongoose.isValidObjectId(id)`** before `findById` avoids that; checking **`if (!listing)`** avoids null dereference in templates.

---

## 5. `models/listing.js` — line-by-line notes

| Lines | What it does |
|-------|----------------|
| 1–2 | Import mongoose and **`Schema`**. |
| 4–23 | **`listingSchema`**: **`title`** required string; **`description`**; nested **`image.filename`** / **`image.url`** with defaults; **`price`**, **`location`**, **`country`**. |
| 25 | Compile schema to model named **`Listing`** (Mongo collection typically **`listings`**). |
| 27 | Export model for **`app.js`** and **`init/index.js`**. |

---

## 6. `init/index.js` — line-by-line notes

| Lines | What it does |
|-------|----------------|
| 1–4 | Mongoose, seed array module, model, same **`URL`** as **`app.js`**. |
| 6–8 | Connect helper (duplicated from app; keeps script self-contained). |
| 10–14 | Connect and log. |
| 17–21 | **`feedDB`**: **`deleteMany({})`** on all listings, then **`insertMany(initialData.data)`**. |
| 23 | Run **`feedDB()`** when script executes. |

**Caution:** This **empties** the listings collection every run.

---

## 7. `init/data.js` — short notes

| Part | Note |
|------|------|
| Main body | Large **`sampleListings`** array: objects aligned with **`listingSchema`** (title, description, image, price, location, country). |
| Last line | **`module.exports = { data: sampleListings }`** so **`init/index.js`** can **`require("./data.js")`** and use **`initialData.data`**. |

---

## 8. EJS templates — behavior only (no HTML/CSS)

### Layout and partials

| File | Server-side behavior |
|------|----------------------|
| **`layouts/boilerplate.ejs`** | Defines the outer page; **`include`** navbar and footer; **` <%- body -%>`** is where ejs-mate injects each page’s content. |
| **`includes/navbar.ejs`** | Static links to `/`, `/listings`, `/listings/new` (labels are presentation). |
| **`includes/footer.ejs`** | Uses **`<%= new Date().getFullYear() %>`** for dynamic copyright year. |

### Listing pages

| File | Layout | Data / actions |
|------|--------|----------------|
| **`listings/index.ejs`** | `layout("/layouts/boilerplate")` | Expects **`allListings`**; loops with **`for`**; outputs **`listing._id`**, **`image.url`**, text fields; links to **`/listings/:id`**. |
| **`listings/new.ejs`** | Same | Form **`POST`** to **`/listings/new`**; field **`name`s** match **`req.body`** destructuring in **`app.js`**. |
| **`listings/show.ejs`** | Same | Expects **`listing`**; shows fields and links to **`edit`** / **`delete`** routes. |
| **`listings/update.ejs`** | Same | Form **`POST`** to **`/listings/<%= listing._id %>?_method=PATCH`**; inputs prefilled from **`listing`**. |

**Convention:** With ejs-mate, page files should normally be **fragments** (no second `<html>` / `<body>`). Some listing views still wrap content in `<body>`; the layout already provides `<body>`. Removing extra `<body>` tags avoids invalid nested markup (optional cleanup).

---

## 9. `public/` folder

| Path | Role |
|------|------|
| **`public/css/styles.css`** | Styles for navbar, listing cards, footer, etc. Served at **`/css/styles.css`** because of **`express.static(..., "public")`**. |

Use **root-absolute** asset URLs in the layout (e.g. **`/css/styles.css`**) so requests are not interpreted as **`/listings/:id`** when you are on a listing URL.

---

## 10. How requests flow (CRUD)

1. Browser **`GET /listings`** → **`find`** → **`index.ejs`**.
2. **`GET /listings/new`** → form → **`POST /listings/new`** → **`save`** → redirect **`GET /listings`**.
3. **`GET /listings/:id`** → **`findById`** → **`show.ejs`**.
4. **`GET /listings/:id/edit`** → **`update.ejs`** → **`POST` + `_method=PATCH`** → **`findByIdAndUpdate`** → redirect.
5. **`GET /listings/:id/delete`** → **`findByIdAndDelete`** → redirect.

---

## 11. Related file

- **`README.md`** — Quick start, scripts, and GitHub-oriented overview for new contributors.
