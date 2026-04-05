# Project documentation — architecture and code notes

This file explains **why** the repo is laid out in folders (instead of one file), and gives **short notes** on backend and server-side template logic. **Plain HTML/CSS** in `.ejs` files and `public/css/styles.css` are not described line-by-line; only **EJS behavior** (layouts, data, forms, routes) is covered. **Client-side JavaScript** in `public/js/` is summarized because it is application logic, not presentation markup.

---

## 1. Backend vs frontend in this project

| Layer | What it is | Where it lives |
|--------|------------|----------------|
| **Backend** | Node.js process: HTTP server, MongoDB access, routing, form handling | `app.js`, `models/`, `init/` |
| **Server-rendered UI** | HTML produced on the server via EJS (not a separate SPA) | `views/` |
| **Static assets** | Files sent as-is (CSS, client JS, future images) | `public/` |
| **Shared route helpers** | Wrap async handlers and carry HTTP status for errors | `utils/` |
| **Tooling / metadata** | Dependencies and lockfile | `package.json`, `package-lock.json` |

**Why not one file?**

- **Routes + DB + HTML in one file** becomes impossible to navigate and risky to change (one typo breaks everything).
- **Models** define data shape once; both the web app and the seed script reuse them. **Reviews** live in their own model so listing documents stay a reasonable size and review CRUD stays clear.
- **`utils/`** keeps error-handling patterns (`wrapAsync`, `ExpressError`) out of `app.js` so routes stay readable and the same helpers can be reused on new routes.
- **Views** let you edit pages without rereading all route code. **Dedicated error templates** (`views/error/`) separate “normal” pages from 404 and error responses.
- **`init/`** is destructive (wipes listings); it must not run every time the server starts.
- **`public/`** is separate so styles, scripts, and CDN links stay cacheable and paths stay predictable (`/css/...`, `/js/...`).

---

## 2. Folder and file roles (summary)

| Path | Role |
|------|------|
| `app.js` | Express app: middleware, Mongo connection, HTTP routes (listings + reviews), 404 and error middleware. |
| `models/listing.js` | Mongoose `Listing` schema; `reviews` refs; post-hook to delete related reviews when a listing is removed. |
| `models/review.js` | Mongoose `Review` schema (`comment`, `rating`, `createdAt`). |
| `utils/wrapAsync.js` | Higher-order function: wraps async route handlers and forwards rejections to Express `next` (enables central error middleware). |
| `utils/ExpressError.js` | Custom error class with `statusCode` and `message` for validation and client errors. |
| `init/data.js` | Array of sample listing objects; exported as `{ data }`. |
| `init/index.js` | Standalone script: connect, `deleteMany`, `insertMany` seed data. |
| `views/layouts/boilerplate.ejs` | ejs-mate layout: shared shell, `<%- body %>`, includes navbar/footer, loads `/js/script.js`. |
| `views/includes/navbar.ejs` / `footer.ejs` | Reusable partials included from the layout. |
| `views/listings/*.ejs` | Page bodies for list / new / show / edit; use `layout(...)` and server variables. |
| `views/error/404.ejs` | Rendered for unknown routes (after all other handlers). |
| `views/error/error.ejs` | Rendered by Express error middleware; expects `statusCode` and `message`. |
| `public/css/styles.css` | Site styles (not documented here). |
| `public/js/script.js` | Client-side Bootstrap form validation (`.needs-validation` / `was-validated`). |

---

## 3. `package.json` (short notes)

| Field / entry | Note |
|---------------|------|
| `"type": "commonjs"` | Uses `require` / `module.exports`, not ESM `import` by default. |
| `"main": "app.js"` | Entry used conceptually; **`npm start`** runs **`node app.js`** (see `README.md` scripts). |
| `dependencies` | **express** — HTTP framework; **mongoose** — MongoDB ODM; **ejs** — templates; **ejs-mate** — layouts/blocks; **method-override** — treat POST as PATCH for HTML forms; **nodemon** — dev auto-restart (listed as a dependency). |

---

## 4. `app.js` — structured notes

| Lines / area | What it does |
|--------------|----------------|
| 1–11 | Load Express, mongoose, `Listing` / `Review`, `path`, `method-override`, `ejs-mate`, `wrapAsync`, `ExpressError`; Mongo URL for DB **`airbnb`**. |
| 13–18 | Register ejs-mate; EJS views under **`./views`**; URL-encoded bodies; **`_method`** override; static files from **`public/`**. |
| 20–28 | `dbConnection`: `mongoose.connect`; log success/failure. |
| 31–33 | **`GET /`** — text smoke test. |
| 35–46 | **`GET /testListing`** — create one hard-coded listing, save, respond (dev helper; not wrapped in `wrapAsync`). |
| 48–52 | **`GET /listings`** — `find({})`, render index with **`allListings`**. |
| 54–56 | **`GET /listings/new`** — new listing form. |
| 58–76 | **`POST /listings/new`** — validate required body fields or **`throw new ExpressError(400, ...)`**; map **`image`** to **`{ url }`**; save; redirect to index. |
| 78–82 | **`GET /listings/:id`** — **`findById`** with **`populate("reviews")`**; render show. |
| 85–89 | **`GET /listings/:id/edit`** — **`findById`**; render update form. |
| 91–98 | **`PATCH /listings/:id`** — **`findByIdAndUpdate`**; default image URL if missing; redirect. |
| 100–104 | **`GET /listings/:id/delete`** — **`findByIdAndDelete`**; redirect (GET delete is simple but not ideal for production). |
| 106–120 | **`POST /listings/:id/reviews`** — create **`Review`**, push id onto **`listing.reviews`**, save listing, redirect to show. |
| 122–133 | **`GET /listings/:id/reviews/:reviewId`** — delete review document and **`$pull`** its id from the listing; redirect to show. |
| 135–138 | **404 middleware** — no `next` arg: catches unmatched routes; **`res.status(404).render("error/404.ejs")`**. |
| 140–144 | **Error middleware** — four arguments; reads **`err.statusCode`** / **`err.message`**; renders **`error/error.ejs`**. |
| 147–149 | Listen on port **8080**. |

**Robustness note (optional improvement):** Invalid `:id` values can cause Mongoose **CastError**. Checking **`mongoose.isValidObjectId(id)`** before `findById` avoids that; checking **`if (!listing)`** avoids null dereference in templates.

---

## 5. `models/listing.js` — structured notes

| Lines / area | What it does |
|--------------|----------------|
| 1–4 | Import mongoose **`Schema`**, and **`Review`** (for the post-delete hook). |
| 5–30 | **`listingSchema`**: required **`title`**; **`description`**; nested **`image.filename`** / **`image.url`** with defaults; **`price`**, **`location`**, **`country`**; **`reviews`** array of **`ObjectId`** refs to **`Review`**. |
| 32–38 | **`post("findOneAndDelete", ...)`** — after a listing is removed via **`findOneAndDelete`** / **`findByIdAndDelete`**, **`Review.deleteMany`** removes all reviews whose **`_id`** is in **`listing.reviews`**. |
| 40–42 | Export **`Listing`** model. |

---

## 6. `models/review.js` — structured notes

| Part | Note |
|------|------|
| Schema | **`comment`** (required string), **`rating`** (number 1–5, required), **`createdAt`** (Date, default **`Date.now()`**). |
| Model | Compiled as **`Review`** (collection typically **`reviews`**). |
| Why separate file | Keeps review fields and validation in one place; **`listing.js`** only references the model for refs and cascade delete. |

---

## 7. `utils/wrapAsync.js`

| Part | Note |
|------|------|
| Export | A function that takes an async route handler **`fn`** and returns **`(req, res, next) => fn(...).catch(next)`**. |
| Why | Express does not catch rejected promises from `async` handlers; **`catch(next)`** forwards errors to the error-handling middleware. |

---

## 8. `utils/ExpressError.js`

| Part | Note |
|------|------|
| Class | Extends **`Error`**; constructor **`(statusCode, message)`**; sets **`this.statusCode`** and **`this.message`**, calls **`super(message)`**. |
| Why | Distinguishes intentional HTTP errors (e.g. 400 validation) from unexpected 500s; the error middleware reads **`statusCode`** and **`message`**. |

---

## 9. `init/index.js` — line-by-line notes

| Lines | What it does |
|-------|----------------|
| 1–4 | Mongoose, seed array module, model, same **`URL`** as **`app.js`**. |
| 6–8 | Connect helper (duplicated from app; keeps script self-contained). |
| 10–14 | Connect and log. |
| 17–21 | **`feedDB`**: **`deleteMany({})`** on all listings, then **`insertMany(initialData.data)`**. |
| 23 | Run **`feedDB()`** when script executes. |

**Caution:** This **empties** the listings collection every run. It does **not** clear the **`reviews`** collection; orphaned review documents are possible if you seed after deleting listings only via this script. (Deleting listings through the app runs the listing schema hook and `$pull` paths avoid leaving refs on the listing.)

---

## 10. `init/data.js` — short notes

| Part | Note |
|------|------|
| Main body | Large **`sampleListings`** array: objects aligned with **`listingSchema`** (title, description, image, price, location, country). |
| Last line | **`module.exports = { data: sampleListings }`** so **`init/index.js`** can **`require("./data.js")`** and use **`initialData.data`**. |

---

## 11. EJS templates — behavior only (no HTML/CSS)

### Layout and partials

| File | Server-side behavior |
|------|----------------------|
| **`layouts/boilerplate.ejs`** | Outer page; **`include`** navbar and footer; **` <%- body -%>`** injects each page’s content; script tag for **`/js/script.js`**. |
| **`includes/navbar.ejs`** | Links to `/`, `/listings`, `/listings/new` (labels are presentation). |
| **`includes/footer.ejs`** | Uses **`<%= new Date().getFullYear() %>`** for dynamic copyright year. |

### Listing pages

| File | Layout | Data / actions |
|------|--------|----------------|
| **`listings/index.ejs`** | `layout("/layouts/boilerplate")` | Expects **`allListings`**; loops; links to **`/listings/:id`**. |
| **`listings/new.ejs`** | Same | Form **`POST`** to **`/listings/new`**; **`needs-validation`** for client-side checks. |
| **`listings/show.ejs`** | Same | Expects **`listing`** (with populated **`reviews`**); review form **`POST`** to **`/listings/:id/reviews`**; links to edit/delete listing and delete individual reviews. |
| **`listings/update.ejs`** | Same | Form **`POST`** with **`?_method=PATCH`**; inputs prefilled from **`listing`**. |

### Error pages

| File | Behavior |
|------|----------|
| **`error/404.ejs`** | Shown for unknown URLs; no extra locals required beyond what the template defines. |
| **`error/error.ejs`** | Expects **`statusCode`** and **`message`** from the error middleware. |

**Convention:** With ejs-mate, page files should normally be **fragments** (no second `<html>` / `<body>`). The layout already provides `<body>`. Avoid nested `<body>` tags (optional cleanup).

---

## 12. `public/` folder

| Path | Role |
|------|------|
| **`public/css/styles.css`** | Site styles. Served at **`/css/styles.css`** via **`express.static(..., "public")`**. |
| **`public/js/script.js`** | Attaches submit listeners to **`.needs-validation`** forms: prevents submit if invalid and adds Bootstrap’s **`was-validated`** class. |

Use **root-absolute** asset URLs in the layout (e.g. **`/css/styles.css`**, **`/js/script.js`**) so requests are not interpreted as **`/listings/:id`** when you are on a nested URL.

---

## 13. How requests flow (CRUD + reviews)

1. Browser **`GET /listings`** → **`find`** → **`index.ejs`**.
2. **`GET /listings/new`** → form → **`POST /listings/new`** → validate / **`save`** → redirect **`GET /listings`**.
3. **`GET /listings/:id`** → **`findById`** + **`populate("reviews")`** → **`show.ejs`**.
4. **`POST /listings/:id/reviews`** → save **`Review`**, push on listing → redirect **`GET /listings/:id`**.
5. **`GET /listings/:id/reviews/:reviewId`** → delete review + **`$pull`** → redirect to show.
6. **`GET /listings/:id/edit`** → **`update.ejs`** → **`POST` + `_method=PATCH`** → **`findByIdAndUpdate`** → redirect.
7. **`GET /listings/:id/delete`** → **`findByIdAndDelete`** (hook cleans reviews) → redirect.
8. Unmatched path → **404** template; thrown **`ExpressError`** or async failures → **error** template.

---

## 14. Related file

- **`README.md`** — Quick start, scripts, and GitHub-oriented overview for new contributors.
