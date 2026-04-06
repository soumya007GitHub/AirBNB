# Project documentation — architecture and code notes

This file explains **why** the repo is laid out in folders (instead of one file), and gives **short notes** on backend and server-side template logic. **Plain HTML/CSS** in `.ejs` files and `public/css/styles.css` are not described line-by-line; only **EJS behavior** (layouts, data, forms, routes) is covered. **Client-side JavaScript** in `public/js/` is summarized because it is application logic, not presentation markup.

---

## 1. Backend vs frontend in this project

| Layer | What it is | Where it lives |
|--------|------------|----------------|
| **Backend** | Node.js process: HTTP server, MongoDB access, routing, form handling, sessions + Passport | `app.js`, `routes/`, `controllers/`, `models/`, `init/` |
| **Config / uploads** | Cloudinary client + Multer storage; env vars | `cloudConfig.js` (loaded via `routes/listingRoutes.js`) |
| **Server-rendered UI** | HTML produced on the server via EJS (not a separate SPA) | `views/` |
| **Static assets** | Files sent as-is (CSS, client JS, future images) | `public/` |
| **Shared route helpers** | Wrap async handlers, HTTP errors, listing **category enum** + labels/icons | `utils/` |
| **Auth / authorization middleware** | Reusable **`isLoggedIn`**, **`isOwner`**, **`isReviewOwner`** checks | `middleware.js` |
| **Tooling / metadata** | Dependencies and lockfile | `package.json`, `package-lock.json` |

**Why not one file?**

- **Routes + DB + HTML in one file** becomes impossible to navigate and risky to change (one typo breaks everything).
- **Models** define data shape once; both the web app and the seed script reuse them. **Reviews** live in their own model so listing documents stay a reasonable size and review CRUD stays clear.
- **`routes/`** declare paths and middleware order (**`isLoggedIn`**, **`isOwner`**, Multer) and call **`controllers/`** so HTTP wiring stays separate from DB/render logic.
- **`controllers/`** holds async handlers (**listings**, **users**, **reviews**): easier to test and keeps **`routes/*.js`** short.
- **`cloudConfig.js`** configures **Cloudinary** and **Multer**’s **`CloudinaryStorage`** so listing images are not stored on disk in the repo; **`dotenv`** runs at the top of **`app.js`** and again in **`cloudConfig.js`** so env vars exist before Cloudinary initializes.
- **`utils/`** keeps **`wrapAsync`**, **`ExpressError`**, and **`listingCategories.js`** (one list of allowed **`category`** values plus UI labels/icons) in one place so the **Mongoose enum**, **seed script**, **controllers**, and **index filters** never drift apart.
- **`middleware.js`** centralizes “must be logged in” and “must own this listing/review” rules so **`routes/*.js`** stay thin and you do not duplicate **`req.isAuthenticated()`** and owner checks on every protected path.
- **Views** let you edit pages without rereading all route code. **Dedicated error templates** (`views/error/`) separate “normal” pages from 404 and error responses.
- **`init/`** is destructive (wipes listings); it must not run every time the server starts.
- **`public/`** is separate so styles, scripts, and CDN links stay cacheable and paths stay predictable (`/css/...`, `/js/...`).
- **`express-session` + `connect-flash`** keep short-lived messages across redirects (e.g. “listing added”) without putting that state in the URL; flash is read once, then cleared. **`passport`** + **`passport-local`** use the same session to log users in after **`passport-local-mongoose`** adds hash/salt fields and helpers on **`User`**.

---

## 2. Folder and file roles (summary)

| Path | Role |
|------|------|
| `app.js` | First line **`require("dotenv").config()`** so **`.env`** loads before routers (Cloudinary keys). Express: session + flash + **Passport**; **`res.locals`** flash + **`currentLoggedInUser`**; Mongo connect; mount routers; dev routes; 404 + error middleware. |
| `cloudConfig.js` | **`cloudinary.v2.config`** from **`process.env`** (`CLOUD_NAME` / `CLOUDINARY_CLOUD_NAME`, API key/secret aliases); exports **`CloudinaryStorage`** (**`airbnb_DEV`** folder, image formats). |
| `middleware.js` | **`isLoggedIn`**, **`isOwner`**, **`isReviewOwner`** (see §5). |
| `controllers/listings.js` | **Listing** CRUD + render: **`index`** builds Mongo **`filter`** from **`?search=`** and **`?category=`** (see §19); create/update validate **`category`** + **`gstPercentage`**; Multer image fields as before; **`$set`** on patch. |
| `controllers/users.js` | Signup (**`User.register`**, **`req.login`**), login page, post-login flash/redirect, **`req.logout`**. |
| `controllers/reviews.js` | Add review (**`owner`**), delete review + **`$pull`** on listing. |
| `routes/listingRoutes.js` | Wires **`ListingController`** + **`multer({ storage })`**; **`uploadListingImage`** / **`uploadListingImageOptional`** wrap **`upload.single("image")`** and redirect with flash on upload errors. |
| `routes/reviewRoutes.js` | **`ReviewController.addReview`** / **`deleteReview`** with **`isLoggedIn`** / **`isReviewOwner`**. |
| `routes/userRoutes.js` | **`UserController`** methods; **`passport.authenticate`** on **`POST /login`**. |
| `models/user.js` | Mongoose **`User`** schema (**`email`** required) + **`passport-local-mongoose`** plugin (adds **`username`**, password hash/salt, **`authenticate`**, **`register`**, **`serializeUser`**, etc.). Resolves **`.default`** export for plugin v9 + CommonJS. |
| `models/listing.js` | **`Listing`**: **`category`** (**`String`**, enum from **`LISTING_CATEGORY_VALUES`**), **`gstPercentage`** (0–100); **`reviews`**, **`owner`**; post-delete hook; imports **`listingCategories`** for enum. |
| `models/review.js` | **`Review`**: **`comment`**, **`rating`**, **`createdAt`**, **`owner`** ref **`User`**. |
| `utils/listingCategories.js` | **`LISTING_CATEGORY_OPTIONS`** (value, label, Font Awesome icon) and **`LISTING_CATEGORY_VALUES`** for schema enum + **`GET /listings`** filters (e.g. **`camping`**, **`boats`**). |
| `utils/wrapAsync.js` | Higher-order function: wraps async route handlers and forwards rejections to Express `next` (enables central error middleware). |
| `utils/ExpressError.js` | Custom error class with `statusCode` and `message` for validation and client errors. |
| `init/data.js` | Array of sample listing objects; exported as `{ data }`. |
| `init/index.js` | Seed script: **`deleteMany`**, map each **`data.js`** row with default **`owner`**, **`category`** (round-robin enum), **`gstPercentage`** (5/12/18 rotation), **`insertMany`**. |
| `views/layouts/boilerplate.ejs` | ejs-mate layout: shared shell; includes navbar, **`flash`**, then **`<%- body -%>`**, footer; loads **`/js/script.js`**. |
| `views/includes/navbar.ejs` / `footer.ejs` | Reusable partials included from the layout. |
| `views/includes/flash.ejs` | Renders Bootstrap alerts when **`success`**, **`updated`**, **`deleted`**, or **`error`** locals are set (fed from **`connect-flash`** via **`app.js`**). |
| `views/listings/*.ejs` | Page bodies for list / new / show / edit; use `layout(...)` and server variables. |
| `views/users/signup.ejs` / `login.ejs` | Auth forms posting to **`/user/signup`** and **`/user/login`**; use boilerplate + **`needs-validation`**. |
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
| `dependencies` | **express**, **mongoose**, **ejs**, **ejs-mate**, **method-override**, **express-session**, **connect-flash**, **passport**, **passport-local**, **passport-local-mongoose**, **dotenv** — env file; **cloudinary**, **multer**, **multer-storage-cloudinary** — listing images to Cloudinary; **nodemon** — dev restart. |

---

## 4. `app.js` — structured notes

| Lines / area | What it does |
|--------------|----------------|
| 1 | **`dotenv.config()`** — load **`.env`** before **`listingRoutes`** (which pulls in **`cloudConfig`**). |
| 3–17 | Express, mongoose, **`path`**, **`method-override`**, **`ejs-mate`**, **`Listing`**, **`listingRoutes`**, **`reviewRoutes`**, **`userRoutes`**, session, flash, passport, **`LocalStrategy`**, **`User`**; Mongo URL **`airbnb`**. |
| 20–29 | **`sessionOptions`**. |
| 31–38 | ejs-mate, views, **`urlencoded`**, **`method-override`**, **`static`**, **`session`**, **`flash()`**. |
| 40–44 | Passport **`initialize`**, **`session`**, **`LocalStrategy`**, serialize/deserialize. |
| 47–55 | **`dbConnection`**. |
| 57–65 | Flash → **`res.locals`** + **`currentLoggedInUser`**. |
| 67–70 | **`GET /`**. |
| 72–84 | **`GET /testListing`**. |
| 86–94 | **`GET /demouser`**. |
| 96–103 | Mount **`/listings`**, **`/listings/:id/reviews`**, **`/user`**. |
| 105–108 | **404**. |
| 110–114 | Error middleware. |
| 116–118 | Listen **8080**. |

**Robustness / security notes (optional):** Move **`sessionOptions.secret`** to an environment variable for production. Invalid `:id` values can cause Mongoose **CastError**; validate **`ObjectId`** or check **`listing`** before render. **`isOwner`** / **`isReviewOwner`** assume **`listing.owner`** / **`review.owner`** exist; seed or legacy documents without **`owner`** can throw—normalize data or guard in middleware.

---

## 5. `middleware.js` — structured notes

| Export | Note |
|--------|------|
| **`isLoggedIn`** | If **`!req.isAuthenticated()`**, **`flash("error", "Please login to continue")`** and redirect **`/listings`**; else **`next()`**. |
| **`isOwner`** | **`Listing.findById(id)`** from **`req.params`**; if missing listing → flash + redirect **`/listings`**; if **`!listing.owner.equals(res.locals.currentLoggedInUser._id)`** → flash “not owner” + redirect **`/listings/:id`**; else **`next()`**. |
| **`isReviewOwner`** | **`Review.findById(reviewId)`**; if missing → flash + **`/listings`**; if **`!review.owner.equals(res.locals.currentLoggedInUser._id)`** → flash + redirect show listing; else **`next()`**. |

Imports **`Listing`** and **`Review`** for DB lookups. Used as Express middleware **before** **`wrapAsync`** handlers on protected routes.

---

## 6. `cloudConfig.js` — structured notes

| Part | Note |
|------|------|
| **`dotenv.config()`** | Ensures env vars exist when this module is loaded (e.g. if required before **`app.js`** finishes). |
| **Cloudinary** | Reads **`CLOUD_NAME`** (or **`CLOUDINARY_CLOUD_NAME`**) and matching API key/secret aliases; warns if missing. |
| **`CloudinaryStorage`** | Multer storage: uploads to folder **`airbnb_DEV`**; **`allowed_formats`** png/jpg/jpeg/webp. Uploaded file info exposed on **`req.file.path`** (secure URL) and **`req.file.filename`** (**`public_id`**). |

---

## 7. `controllers/` — structured notes

| File | Exports / role |
|------|----------------|
| **`listings.js`** | **`index`**: reads **`req.query.search`**, **`req.query.category`**; **`escapeRegex`** + **`$or`** on **title / location / country**; **`category`** must be in **`LISTING_CATEGORY_VALUES`** when set; passes **`allListings`**, **`search`**, **`activeCategory`**, **`listingCategoryOptions`** to **`index.ejs`**. **`newListingAdd` / `updateListingDetails`**: validate **`category`**, **`gstPercentage`**. Other actions unchanged (Multer, populate, etc.). |
| **`users.js`** | **`index`** (signup view), **`register`**, **`loginPage`**, **`login`** (post-auth flash/redirect), **`logout`**. |
| **`reviews.js`** | **`addReview`**, **`deleteReview`**. |

Controllers use **`req.flash`** and **`res.redirect`** / **`res.render`**; they do not register routes—**`routes/*.js`** does.

---

## 8. `routes/listingRoutes.js` — structured notes

| Part | Note |
|------|------|
| **`express.Router({ mergeParams: true })`** | Consistent with the review router. |
| **`multer({ storage })`** | **`storage`** from **`cloudConfig.js`**. |
| **`uploadListingImage`** | Runs **`upload.single("image")`** for **`POST /new`**; on error, flash + redirect **`/listings/new`**. |
| **`uploadListingImageOptional`** | Same for **`PATCH /:id`**; on error, redirect **`/listings/:id/edit`**. |
| **`GET /`** | **`ListingController.index`**. |
| **`GET /new`** | **`isLoggedIn`**, **`newListingView`**. |
| **`POST /new`** | **`isLoggedIn`**, **`uploadListingImage`**, **`newListingAdd`**. |
| **`GET /:id`** | **`showListingDetails`** (nested populate). **After** **`/new`**. |
| **`GET /:id/edit`** | **`isLoggedIn`**, **`isOwner`**, **`showListingEditPage`**. |
| **`PATCH /:id`** | **`isLoggedIn`**, **`isOwner`**, **`uploadListingImageOptional`**, **`updateListingDetails`**. |
| **`GET /:id/delete`** | **`isLoggedIn`**, **`isOwner`**, **`deleteListing`**. |

Imports **`wrapAsync`**, **`isLoggedIn`**, **`isOwner`**, **`ListingController`**, **`multer`**, **`storage`** from **`cloudConfig`**.

---

## 9. `routes/reviewRoutes.js` — structured notes

| Part | Note |
|------|------|
| **`mergeParams: true`** | **`req.params.id`** is the listing id. |
| **`POST /`** | **`isLoggedIn`**, **`ReviewController.addReview`**. |
| **`GET /:reviewId`** | **`isLoggedIn`**, **`isReviewOwner`**, **`ReviewController.deleteReview`**. |

Imports **`wrapAsync`**, **`isLoggedIn`**, **`isReviewOwner`**, **`ReviewController`**.

---

## 10. `routes/userRoutes.js` — structured notes

| Part | Note |
|------|------|
| Router | Mounted at **`/user`**. |
| **`GET /signup`** | **`UserController.index`**. |
| **`POST /signup`** | **`wrapAsync(UserController.register)`**. |
| **`GET /login`** | **`UserController.loginPage`**. |
| **`POST /login`** | **`passport.authenticate("local", ...)`**, then **`wrapAsync(UserController.login)`**. |
| **`GET /logout`** | **`UserController.logout`**. |

Imports **`wrapAsync`**, **`passport`**, **`UserController`**.

---

## 11. `models/listing.js` — structured notes

| Lines / area | What it does |
|--------------|----------------|
| 1–5 | Import **`Schema`**, **`Review`**, **`User`**, **`LISTING_CATEGORY_VALUES`**. |
| 7–47 | **`listingSchema`**: **`title`** … **`country`**; **`category`** (**`String`**, **`enum`**: **`LISTING_CATEGORY_VALUES`**, default **`rooms`**); **`gstPercentage`** (**`Number`**, 0–100, default 0); **`reviews`**; **`owner`**. |
| 49–55 | **`post("findOneAndDelete")`** — **`Review.deleteMany`** for ids in **`listing.reviews`**. |
| 57–59 | **`mongoose.model`** + **`module.exports`**. |

---

## 12. `models/review.js` — structured notes

| Part | Note |
|------|------|
| Schema | **`comment`**, **`rating`** (1–5), **`createdAt`**, **`owner`** ref **`User`**. |
| Model | Collection typically **`reviews`**. |
| Why **`owner`** | Lets **`isReviewOwner`** and the UI restrict delete to the author (aligned with **`middleware.js`**). |

---

## 13. `models/user.js` — structured notes

| Part | Note |
|------|------|
| Schema | **`email`** (required **`String`**). **`passport-local-mongoose`** adds **`username`**, password hash/salt fields, and methods such as **`authenticate`**, **`register`**, **`serializeUser`**, **`deserializeUser`**. |
| Plugin require | Package v9 exposes the plugin as **`exports.default`**; code uses **`pkg.default`** when **`require(...)`** returns an object so **`schema.plugin(...)`** receives a **function**. |
| Why separate file | User credentials and Passport integration stay isolated from listing/review domain models. |

---

## 14. `utils/listingCategories.js`

| Export | Note |
|--------|------|
| **`LISTING_CATEGORY_OPTIONS`** | Array of **`{ value, label, icon }`**: **trending**, **rooms**, **iconic-cities**, **mountains**, **castles**, **amazing-pools**, **camping**, **farms**, **arctic**, **domes**, **boats**. **`value`** is stored in MongoDB and used in **`?category=`** URLs; **`icon`** is a Font Awesome class for **`index.ejs`**. |
| **`LISTING_CATEGORY_VALUES`** | **`value`** strings only — used by **`mongoose`** **`enum`** and **`ListingController.index`** to validate query params. |

**Why a separate file:** Adding a category in one place updates the schema, seed rotation, create/edit forms, and filter bar together.

---

## 15. `utils/wrapAsync.js`

| Part | Note |
|------|------|
| Export | A function that takes an async route handler **`fn`** and returns **`(req, res, next) => fn(...).catch(next)`**. |
| Why | Express does not catch rejected promises from `async` handlers; **`catch(next)`** forwards errors to the error-handling middleware. |

---

## 16. `utils/ExpressError.js`

| Part | Note |
|------|------|
| Class | Extends **`Error`**; constructor **`(statusCode, message)`**; sets **`this.statusCode`** and **`this.message`**, calls **`super(message)`**. |
| Why | Distinguishes intentional HTTP errors (e.g. 400 validation) from unexpected 500s; the error middleware reads **`statusCode`** and **`message`**. |

---

## 17. `init/index.js` — line-by-line notes

| Lines | What it does |
|-------|----------------|
| 1–5 | Mongoose, **`./data.js`**, **`Listing`**, **`LISTING_CATEGORY_VALUES`**, **`URL`**. |
| 7–15 | **`dbConnection`**; connect and log. |
| 18–33 | **`feedDB`**: **`Listing.deleteMany({})`**; map each seed object with **`owner`** (default **`ObjectId`** string if missing), **`category`** (from row or round-robin over **`LISTING_CATEGORY_VALUES`**), **`gstPercentage`** (from row or rotate 5 / 12 / 18); **`insertMany(rows)`**; log. |
| 35 | Invoke **`feedDB()`**. |

**Caution:** This **empties** the listings collection every run. It does **not** clear the **`reviews`** collection; orphaned review documents are possible if you seed after deleting listings only via this script. (Deleting listings through the app runs the listing schema hook and `$pull` paths avoid leaving refs on the listing.)

---

## 18. `init/data.js` — short notes

| Part | Note |
|------|------|
| Main body | **`sampleListings`**: **`title`**, **`description`**, **`image`**, **`price`**, **`location`**, **`country`**. Optional **`owner`**, **`category`**, **`gstPercentage`** if present; otherwise **`init/index.js`** fills **`category`** / **`gst`** and default **`owner`**. |
| Last line | **`module.exports = { data: sampleListings }`**. |

---

## 19. EJS templates — behavior only (no HTML/CSS)

### Layout and partials

| File | Server-side behavior |
|------|----------------------|
| **`layouts/boilerplate.ejs`** | Outer page; navbar; **`include`** **`flash.ejs`** (alerts from session flash); **`<%- body -%>`**; footer; Bootstrap bundle + **`/js/script.js`**. |
| **`includes/navbar.ejs`** | Links to `/`, `/listings`, `/listings/new` (labels are presentation). |
| **`includes/footer.ejs`** | Uses **`<%= new Date().getFullYear() %>`** for dynamic copyright year. |
| **`includes/flash.ejs`** | If **`success`**, **`updated`**, **`deleted`**, or **`error`** locals are set (arrays from **`connect-flash`**), renders matching Bootstrap alerts (errors use danger styling). |

### Listing pages

Any view rendered through **`boilerplate`** receives **`success`**, **`updated`**, **`deleted`**, and **`error`** on **`res.locals`** (populated in **`app.js`** from **`req.flash`**), so templates do not pass those explicitly unless you override locals.

| File | Layout | Data / actions |
|------|--------|----------------|
| **`listings/index.ejs`** | See **§19.1** below (search, category filters, tax toggle, query string helpers). |
| **`listings/new.ejs`** | Same | **`multipart/form-data`**; **`category`** `<select>` from **`listingCategoryOptions`**; **`gstPercentage`**; file **`name="image"`**; **`POST /listings/new`**. |
| **`listings/show.ejs`** | Same | Expects **`listing`** with **`owner`** and **`reviews`** populated (reviews include **`owner`**). Uses **`currentLoggedInUser`** for UI toggles; compare user id to **`listing.owner`** / **`review.owner`** with **`String(...)`** (not **`===`** on **`ObjectId`**). Review **`POST`** and listing edit/delete are also guarded by **`middleware.js`** on the server. |
| **`listings/update.ejs`** | Same | **`category`**, **`gstPercentage`**; **`multipart`**, **`?_method=PATCH`**; optional **`image`**; current image preview. |

### 19.1 Listings index — search, filters, and matching listings (behavior)

| Mechanism | How it works |
|-----------|----------------|
| **Search** | **`GET`** form **`action="/listings"`**, **`method="get"`**, input **`name="search"`**. Submitting sends **`?search=...`**. If a **category** is already selected, a **hidden** **`category`** field keeps it so search + category **AND** together. |
| **Backend** | **`ListingController.index`** (see §7): builds **`filter.$or`** with one **case-insensitive regex** (special chars escaped) on **`title`**, **`location`**, and **`country`**. If **`?category=`** is a valid enum value, adds **`filter.category`**. **`Listing.find(filter)`** returns only matching documents. |
| **Category chips** | Links to **`/listings?category=<value>`** (e.g. **`camping`**, **`boats`**). **`qsCat`** / **`qsAll`** in the template preserve **`search`** when building URLs. **“All”** clears category (**`/listings`** or **`?search=`** only). Active chip uses CSS class **`category-filter-btn--active`** (no HTML/CSS detail here). |
| **Icons / labels** | Rendered from **`listingCategoryOptions`** passed by the controller — same data as **`utils/listingCategories.js`**. |
| **Tax toggle** | Inline **`<script>`**: reads **`data-base-price`** and **`data-gst-pct`** on each card; **“Display total after taxes”** switch toggles between base **`price`** and **`price + price × GST/100`**. Purely client-side; does not change the database. |
| **Empty state** | If **`allListings.length === 0`**, show a short “no matches” message. |

### User (auth) pages

| File | Layout | Data / actions |
|------|--------|----------------|
| **`users/signup.ejs`** | `layout("/layouts/boilerplate")` | Form **`POST`** to **`/user/signup`**; fields **`username`**, **`email`**, **`password`**; **`needs-validation`**. |
| **`users/login.ejs`** | Same | Form **`POST`** to **`/user/login`**; **`username`**, **`password`**. |

### Error pages

| File | Behavior |
|------|----------|
| **`error/404.ejs`** | Shown for unknown URLs; no extra locals required beyond what the template defines. |
| **`error/error.ejs`** | Expects **`statusCode`** and **`message`** from the error middleware. |

**Convention:** With ejs-mate, page files should normally be **fragments** (no second `<html>` / `<body>`). The layout already provides `<body>`. Avoid nested `<body>` tags (optional cleanup).

---

## 20. `public/` folder

| Path | Role |
|------|------|
| **`public/css/styles.css`** | Site styles. Served at **`/css/styles.css`** via **`express.static(..., "public")`**. |
| **`public/js/script.js`** | Attaches submit listeners to **`.needs-validation`** forms: prevents submit if invalid and adds Bootstrap’s **`was-validated`** class. |

Use **root-absolute** asset URLs in the layout (e.g. **`/css/styles.css`**, **`/js/script.js`**) so requests are not interpreted as **`/listings/:id`** when you are on a nested URL.

---

## 21. How requests flow (CRUD + reviews + auth + uploads + browse filters)

**`routes/`** + **`controllers/`** + **`middleware.js`**; **`app.js`** mounts stack; **`cloudConfig`** for image uploads.

1. **`GET /listings`** → **`ListingController.index`**. Optional **`?search=`** (title / location / country) and **`?category=`** (enum). Renders **`index.ejs`** with filtered **`allListings`**.
2. **`POST /listings/new`** → **`isLoggedIn`** → Multer → Cloudinary → **`newListingAdd`** (**`owner`**, **`category`**, **`gstPercentage`**, **`image`**) → flash.
3. **`GET /listings/:id`** → nested populate → **`show.ejs`**.
4. Reviews → **`ReviewController`** + auth middleware.
5. **`PATCH /listings/:id`** → **`isOwner`** → optional image → **`$set`** including **`category`** / **`gstPercentage`**.
6. Unmatched → **404**; **`ExpressError`** / async errors → **`error.ejs`**.

**Auth:** **`UserController`** + Passport on user routes (see §10).

---

## 22. Related file

- **`README.md`** — Quick start, scripts, and GitHub-oriented overview for new contributors.
