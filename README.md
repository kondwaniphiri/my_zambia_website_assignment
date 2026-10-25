# MyZambia - Tourism & Attractions Platform

**Author:** Kondwani Phiri

MyZambia is a web application showcasing Zambia's tourist attractions, chill spots (restaurants, lodges, bars), and tourism news. The platform allows users to explore various locations across Zambia's provinces, view detailed information, and share reviews.

## Features

- **Tourist Attractions**: Explore Zambia's national parks, waterfalls, museums, and natural wonders
- **Chill Spots**: Discover restaurants, bars, lodges, and entertainment venues across all provinces
- **News Section**: Stay updated with tourism-related news in Zambia
- **User Reviews**: Rate and review locations (requires login)
- **Guest Access**: Browse as a guest without creating an account
- **Province-based Navigation**: Filter locations by Zambian provinces

## Prerequisites

Before installing, ensure you have the following installed:

- **Node.js** (v22.x or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.x or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
- **Git** (optional, for cloning) - [Download here](https://git-scm.com/)

## Installation Guide

### Step 1: Clone or Download the Project

```bash
# Using Git
git clone <repository-url>
cd myzambia

# OR download and extract the ZIP file, then navigate to the folder
```

### Step 2: Install Dependencies

Open a terminal/command prompt in the project directory and run:

```bash
npm install
```

This will install all required dependencies listed in `package.json`:

- express
- ejs
- mysql2
- bcrypt
- express-session
- cookie-parser
- and other dependencies

### Step 3: Setup MySQL Database

1. **Start MySQL Server**

   - Ensure your MySQL server is running on your machine

2. **Create Database**

   - Open MySQL command line or MySQL Workbench
   - Run the following command:

   ```sql
   CREATE DATABASE myzambia;
   ```

3. **Import Database Schema**

   - Import the `myzambia.sql` file located in the project root

   **Using MySQL Command Line:**

   ```bash
   mysql -u root -p myzambia < myzambia.sql
   ```

   **Using MySQL Workbench:**

   - Open MySQL Workbench
   - Connect to your database
   - Go to Server → Data Import
   - Select "Import from Self-Contained File"
   - Browse and select `myzambia.sql`
   - Click "Start Import"

### Step 4: Configure Database Connection

Set database credentials in the same PowerShell session used to start the application:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_USER = "your_database_user"
$env:DB_PASSWORD = "your_database_password"
$env:DB_NAME = "myzambia"
```

`DB_USER` and `DB_PASSWORD` are required; no credentials are embedded in the source.
`.env.example` lists the settings. The application automatically loads the ignored `.env` file; shell and hosting environment variables take precedence. Never commit real credentials.

### Step 5: Run the Application

#### Development Mode (with auto-restart):

```bash
npm run dev
```

#### Production Mode:

```bash
npm start
```

The application will start on **http://localhost:3000**

### Step 6: Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the login page. You can either:

- **Sign up** for a new account
- **Login** with existing credentials
- Click **"Continue as Guest"** to browse without an account

## Sample accounts

The SQL seed contains sample reviewers with random, discarded password hashes.
These accounts cannot be used to log in. Create an account through Sign up, or
continue as a guest. Your existing local database is unaffected by this seed cleanup.

## Admin Dashboard Access

The application includes an admin dashboard for managing content (attractions, chill spots, and news).

### Accessing the Dashboard

1. Navigate to the dashboard directory:

   ```
   http://localhost:3000/dashboard/
   ```

   Use the served dashboard URL above; opening the HTML file directly is no longer supported. Previous example:

   ```
   file:///C:/Users/BIG/Documents/chileshe/myzambia/dashboard/index.html
   ```

2. **Administrator login required** - Set `ADMIN_USER_IDS` to a comma-separated list of existing user IDs, log in with one of those accounts, then open `/dashboard/`. No administrator accounts are enabled by default.

### Dashboard Features

- **Manage Chill Spots**: Add, edit, and delete restaurants, bars, and lodges
- **Manage Attractions**: Add, edit, and delete tourist attractions
- **Manage News**: Edit news articles

### Dashboard Configuration

The dashboard uses the same-origin `/database/action` API. Changing `PORT` requires
no frontend URL changes. Dashboard pages and write APIs require an account listed
in `ADMIN_USER_IDS`.

## Default Port Configuration

The application runs on port **3000** by default. To change the port:

1. Set the `PORT` environment variable:

   ```bash
   # Windows (PowerShell)
   $env:PORT=8080; npm start

   # Windows (CMD)
   set PORT=8080 && npm start

   # Linux/Mac
   PORT=8080 npm start
   ```

## Project Structure

```text
app.js, bin/www       Express application and startup
config/, db.js        Environment loading and database connection
routes/, middleware/  Routes, security and session handling
services/             Email delivery and newsletter worker
views/, public/       Page templates, styles, scripts and images
dashboard/            Administrator interface
scripts/              Database migration and screenshot capture
screenshots/          Desktop and mobile project screenshots
verify-*.cjs          Application and integration checks
myzambia.sql          Sanitized assignment seed
```

## Database Tables

The application uses the following main tables:

- **users**: User accounts (id, name, email, password)
- **attractions**: Tourist attractions (id, name, description, location, activities, images)
- **chillspots**: Restaurants, lodges, bars (id, name, location, details, images, contact)
- **news**: Tourism news articles (id, headline, news, img)
- **review**: User reviews (userId, locationId, rating, comment)

## Usage

### Creating an Account

1. Click **"Sign Up"** on the login page
2. Enter your name, email, and password
3. Click **"Create Account"**
4. Login with your new credentials

### Browsing Attractions

1. After logging in, navigate to the **Attractions** section
2. Browse through Zambia's national parks, waterfalls, and landmarks
3. Click on any attraction to view detailed information

### Finding Chill Spots

1. Go to the **Chill Spots** section
2. Filter by province (Lusaka, Copperbelt, Southern, etc.)
3. View restaurants, bars, and lodges
4. Click on any location for details, map, and contact information

### Adding Reviews

1. Navigate to a location's detail page
2. Rate the location (1-5 stars)
3. Write your review
4. Submit (requires login)

## Troubleshooting

### Database Connection Errors

**Error**: `Error connecting to database`

- **Solution**: Check that MySQL is running and credentials in `.env` are correct

### Port Already in Use

**Error**: `Port 3000 is already in use`

- **Solution**: Either stop the application using that port or change the port:
  ```bash
  $env:PORT=3001; npm start
  ```

### Module Not Found

**Error**: `Cannot find module 'express'`

- **Solution**: Run `npm install` again to ensure all dependencies are installed

### Images Not Loading

**Issue**: Images don't appear on the website

- **Solution**: Ensure the `public/images/` directory structure matches the database image paths

## Development Tools

For development, the project includes:

- **nodemon**: Auto-restart server on file changes

## Environment Variables

You can configure the following environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## Security Notes

⚠️ **Important for Production**:

- Set `SESSION_SECRET` to a strong persistent random value; otherwise a new secret is generated each server start, invalidating previous sessions
- Run `node scripts/hash-passwords.js` after importing legacy account data
- Use environment variables for sensitive data (database password, session secret)
- Enable HTTPS in production
- Implement input validation and sanitization

## Support

For issues or questions:

- Check the troubleshooting section above
- Review the code comments in the source files
- Ensure all prerequisites are properly installed

## License

This project is for educational/demonstration purposes.

---

**Developed for showcasing Zambia's tourism destinations**

## Authentication fixes and verification

The existing Express routes, EJS templates and jQuery dashboard are retained.
Set these variables in PowerShell before starting the server (replace the examples):

```powershell
$env:ADMIN_USER_IDS = "1,2"
$env:SESSION_SECRET = "replace-with-a-long-random-secret"
npm start
```

Administrator IDs must belong to accounts you trust; ordinary signups cannot grant administrator access.
The dashboard is served at http://localhost:3000/dashboard/ and requires login on the same host.
Review writes use the logged-in user ID, ignoring IDs supplied by the browser.

Run `node scripts/hash-passwords.js` to hash all legacy database passwords.
This command updates the configured MySQL database. Already hashed passwords are skipped.
Legacy accounts also migrate automatically upon successful login. The seed SQL remains demo data.

Run `node verify-fixes.cjs` for HTTP regression checks with a simulated database.
These checks do not connect to or modify MySQL.

## Request protection

All POST requests require a session CSRF token, supplied by hidden fields in login,
signup and guest forms and by a header for same-origin jQuery requests. Logout uses
POST. Tokens rotate after login; reload old tabs if a form expires. Dashboard HTML
must be served by Express so its token is rendered.

Login accepts at most 10 attempts per IP in 15 minutes, including successful logins.
Blocked attempts return HTTP 429 with Retry-After. Sessions and login limits are stored in MySQL by default and shared between app processes. Session cookies expire after 24 hours. Expired store rows are cleaned at startup and every 10 minutes. `SESSION_STORE=memory` is available for isolated tests and development only and is rejected in production.
Express does not trust forwarded IP headers by default; configure trusted proxies
for your actual hosting setup before using it behind a reverse proxy.

Run `node verify-frontend.cjs` for review text rendering, event handler and CSRF header checks.

## Database migration and local startup

Run `npm run migrate` before `npm start`. On a new database the migration imports
`myzambia.sql`; populated databases keep their data. It writes a private schema/data
snapshot to ignored `.local/backups/` before changing structure. Duplicate emails,
duplicate user/location reviews, orphaned reviews or invalid ratings stop migration
for manual resolution. No duplicate rows are silently removed. Keep the app stopped
while migrating: MySQL schema changes are not one atomic transaction.

Migration adds unique keys, generated attraction/chill-spot IDs, review foreign keys
with cascading cleanup, a 1-5 rating constraint, session/login-limit tables and a
migration record. Existing plaintext passwords are hashed. Bare domain website
values from the seed are normalized to HTTPS. Backups may contain legacy password
data; keep them private. Re-running the migration is supported.

The server binds to `127.0.0.1:3000` by default; `HOST` and `PORT` can override it.
For production use HTTPS, set `NODE_ENV=production` and a persistent `SESSION_SECRET`.
Session cookies are secure in production. If HTTPS terminates at a proxy, set
`TRUST_PROXY` to the actual trusted proxy IP addresses/CIDRs, never arbitrary clients.

URL fields accept HTTP(S) websites, local `images/` paths or HTTP(S) image URLs,
and HTTPS Google Maps URLs for maps. Unsafe stored URLs render as empty values;
unsafe URLs submitted to content APIs are rejected. Text fields remain plain text.

Run `npm run test:database` after migration to check MySQL-backed sessions,
concurrent login limits and database constraints. Its temporary session/limit rows
are removed; review constraint checks run in a transaction and roll back.
On Windows PowerShell with script execution disabled, use `npm.cmd` in place of `npm`.

## Public-page UI

Login and signup share the sunset photography, burgundy, cream and gold theme.
Public pages load `site-ui.css` and the shared image viewer. Attraction photos,
homepage highlights/news and location galleries show an eye icon for viewing photos.
The dialog supports previous/next buttons, arrow keys, Escape, backdrop closing,
image-load errors and focus restoration. AJAX-loaded photos are enhanced automatically.
Carousel thumbnails retain their existing location-selection behavior.
Run `node verify-image-viewer.cjs` for isolated viewer interaction checks.

## Directory filters and cards

Chill Spots and Physical Attractions provide province,
activity and text filters, result counts, a reset action and an empty state. Cards
show contact links, opening hours when recorded and ratings from existing Chill
Spot reviews. Physical Attractions currently have no review system and display
Not rated yet. Unknown hours and contacts are explicitly labelled, never guessed.

Migration 002 adds optional opening_hours/activities fields to Chill Spots and
province/opening_hours/phone/site fields to attractions. Initial attraction province
labels are derived only from the existing location text; activity labels for Chill
Spots are derived from their existing category text. These labels should be checked
against verified venue information. The admin forms can maintain the new fields.
All public pages share the accessible desktop/mobile navigation partial.

The Attractions page uses the original alternating photo/text rows and hero image.
Chill Spots uses province backgrounds with selectable thumbnail strips. Both
layouts retain filters, ratings and practical information. Thumbnail buttons support
keyboard selection and avoid layout shifts. The photo dialog uses plain controls
and eye icons without visible instruction captions.

## Contact email and newsletters

The footer subscription form now uses the database instead of showing a fake success alert.
Visitors can send messages through /contact. Administrators can read these in the
dashboard's Email & newsletter section, save plain-text newsletter drafts, review
them and explicitly queue them for confirmed subscribers. Each recipient receives
a separate email with an unsubscribe link. A confirmation link expires after 24
hours; opening a link alone does not subscribe or unsubscribe someone.

Run `npm run migrate` for migration 003. The email fields in the ignored `.env`
file and `.env.example` are deliberately blank:

- `SMTP_HOST` and `SMTP_PORT`: your provider's SMTP server and port.
- `SMTP_SECURE`: `true` for implicit TLS (usually port 465); `false` for STARTTLS
  (usually port 587). If blank, the code infers this from the port. TLS is required.
- `SMTP_USER` and `SMTP_PASS`: credentials issued by your email provider.
- `SMTP_FROM`: the sender email address authorized by your provider.
- `CONTACT_TO`: the inbox that should receive new contact notifications.
- `PUBLIC_BASE_URL`: the website URL that recipients can open, such as your
  HTTPS domain, used to build confirmation and unsubscribe links.

Set `ADMIN_USER_IDS` to trusted existing application user IDs for dashboard access.
Restart the app after changing environment settings. Existing database credentials
and the session secret remain configured separately. The app does not run a mailbox
server; contact messages are stored in MySQL and, when configured, forwarded to
your provider-hosted inbox. Its Reply-To address is the visitor's address.

Until mail is configured, contact messages still save in the dashboard. Newsletter
sign-up and sending are disabled and show an honest unavailable message. Drafts
can still be saved. No subscriber is added to a campaign without confirming first.

The built-in worker checks the durable outbox every 30 seconds when SMTP is enabled.
Failed messages retry with backoff up to five attempts. Restarting the server keeps
queued jobs; row locks coordinate workers across processes. SMTP acceptance is
recorded as sent, which does not guarantee inbox placement. A process crash after
SMTP acceptance and before recording success can cause a duplicate on retry.
Queued newsletters are skipped after the recipient unsubscribes; a message already
handed to the SMTP server cannot be recalled.

Run `npm run test:email` after migration. It creates and removes an isolated test
database, uses a simulated mail transport and never sends real email. The database
account needs permission to create that temporary database. Nodemailer setup follows
its [SMTP documentation](https://nodemailer.com/smtp) and
[message configuration](https://nodemailer.com/message).

Eye icons are small and white with no badge. Scrollbar tracks are hidden while
wheel, touch and keyboard scrolling remain enabled. Scroll reveals, image selection
fades and thumbnail hover effects respect reduced-motion preferences.

## Local administrator account

A local administrator account has been created. Its login details are saved in
ignored `.local/admin-account.txt`; they are not committed to the repository.
The account ID is included in the ignored `.env` setting `ADMIN_USER_IDS`.
Log in through `/login`, then select Dashboard or open `/dashboard/`. The dashboard
includes a Your administrator access panel listing the enabled actions.
Regular accounts and guests cannot access these administration pages or write APIs.
Newsletter delivery remains disabled until the blank email settings are filled in.

## Project screenshots

See [the screenshot index](screenshots/README.md) for 26 desktop and mobile captures,
including public pages, the image viewer, filters and administrator sections.
With the app running at `http://127.0.0.1:3001`, run `npm run screenshots` to
refresh them. The script uses installed Google Chrome in a separate headless
session and reads the local administrator credentials from `.local/admin-account.txt`.
It does not submit messages, reviews or newsletters. External embeds are excluded.

## Repository housekeeping

`myzambia.sql` includes the current migrated schema and public location, news and
review content. Accounts are anonymized with random, discarded password hashes.
Private email data, sessions and login limits are excluded. Refresh this shareable
export with `npm run db:export`. Import it into an empty database, then run
`npm run migrate` for any future schema changes. Existing local accounts are not
changed by exporting; create your own account on a new installation.

Installed dependencies (`node_modules`), `.env`, private backups and local account
details (`.local`) are ignored. Install dependencies with `npm ci` after cloning.
Only the CSS, webfonts and licence needed from Font Awesome are included.
The assignment report and project screenshots are retained.
