# MyZambia - Tourism & Attractions Platform

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

- **Node.js** (v14.x or higher) - [Download here](https://nodejs.org/)
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
- cors
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

1. Open the file `db.js` in the project root
2. Update the database configuration with your MySQL credentials:

```javascript
const config = {
  host: "localhost",
  user: "root", // Your MySQL username
  password: "your_password", // Your MySQL password
  database: "myzambia",
};
```

⚠️ **Important**: Replace `'your_password'` with your actual MySQL password.

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

## Demo Login Credentials

The database comes pre-populated with test user accounts. You can use any of the following credentials to login:

| Name     | Email              | Password |
| -------- | ------------------ | -------- |
| Peter    | peter@gmail.com    | peter    |
| Jonathan | jonathan@gmail.com | Jonathan |
| Njavwa   | Njavwa@gmail.com   | Njavwa   |
| Mubelesi | mubelesi@gmail.com | mubelesi |
| Leo      | leo@gmail.com      | leo      |
| James    | james@gmail.com    | james    |

**Example Login:**

- **Email**: `peter@gmail.com`
- **Password**: `peter`

⚠️ **Note**: These are demo accounts for testing purposes. In production, passwords should be hashed and secured properly.

## Admin Dashboard Access

The application includes an admin dashboard for managing content (attractions, chill spots, and news).

### Accessing the Dashboard

1. Navigate to the dashboard directory:

   ```
   http://localhost:3000/dashboard/
   ```

   Or open the file directly in your browser:

   ```
   file:///C:/Users/BIG/Documents/chileshe/myzambia/dashboard/index.html
   ```

2. **No login required** - The dashboard connects directly to the database API

### Dashboard Features

- **Manage Chill Spots**: Add, edit, and delete restaurants, bars, and lodges
- **Manage Attractions**: Add, edit, and delete tourist attractions
- **Manage News**: Edit news articles

### Dashboard Configuration

The dashboard connects to the API at `http://localhost:3000/database/action`. If you change the application port, update the URL in `dashboard/scripts.js`:

```javascript
const url = "http://localhost:YOUR_PORT/database/action";
```

⚠️ **Security Note**: The current dashboard has no authentication. For production use, implement proper admin authentication and authorization.

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

```
myzambia/
├── app.js                 # Main application file
├── db.js                  # Database configuration
├── myzambia.sql          # Database schema and initial data
├── package.json          # Project dependencies
├── bin/
│   └── www               # Server startup script
├── routes/
│   ├── index.js          # Main routes (login, signup, pages)
│   └── database.js       # Database API routes
├── views/                # EJS templates
│   ├── index.ejs         # Home page
│   ├── attractions.ejs   # Attractions page
│   ├── chill.ejs         # Chill spots listing
│   ├── chillDetails.ejs  # Detailed view of locations
│   ├── login.ejs         # Login page
│   └── signup.ejs        # Signup page
├── public/               # Static files
│   ├── images/           # Images for attractions, sites, news
│   ├── javascripts/      # Client-side JavaScript
│   └── stylesheets/      # CSS files
└── dashboard/            # Admin dashboard (if applicable)
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

- **Solution**: Check that MySQL is running and credentials in `db.js` are correct

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
- **livereload**: Auto-refresh browser on changes (optional)

## Environment Variables

You can configure the following environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## Security Notes

⚠️ **Important for Production**:

- Change the session secret in `app.js` from `'54321'` to a strong random string
- Implement password hashing (bcrypt is already installed)
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
