# Local Setup Instructions for SRDO Website

This document provides instructions for setting up and running the SRDO website locally for development purposes.

## Prerequisites

- PHP 8.1 or higher
- Composer
- Node.js (v16 or higher)
- npm or yarn
- MySQL

## Backend Setup (Laravel)

1. Navigate to the backend directory:

   ```
   cd srdo-website-backend
   ```

2. Install PHP dependencies:

   ```
   composer install
   ```

3. Copy the local environment file:

   ```
   copy .env.local .env
   ```

   (Use `cp .env.local .env` for Unix/Mac)

4. Create a local database:

   ```
   mysql -u root -p
   CREATE DATABASE srdo_local;
   exit
   ```

5. Modify the database credentials in the `.env` file if needed.

6. Generate application key (if not already set):

   ```
   php artisan key:generate
   ```

7. Run database migrations:

   ```
   php artisan migrate
   ```

8. Seed the database with initial data (optional):

   ```
   php artisan db:seed
   ```

9. Start the Laravel development server:
   ```
   php artisan serve
   ```
   This will start the backend at http://localhost:8000

## Frontend Setup (React)

1. Navigate to the frontend directory:

   ```
   cd srdo-website-frontend
   ```

2. Install Node.js dependencies:

   ```
   npm install
   ```

   or

   ```
   yarn install
   ```

3. Copy the local environment file:

   ```
   copy .env.local .env
   ```

   (Use `cp .env.local .env` for Unix/Mac)

4. Start the React development server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```
   This will start the frontend at http://localhost:3000

## Environment Files

### Backend Environment Files

- `.env.local`: Local development environment
- `.env`: Production environment (do not modify)

### Frontend Environment Files

- `.env.local`: Local development environment
- `.env.development`: Development environment
- `.env`: Production environment (do not modify)

## Notes

- The frontend is configured to connect to the backend API at http://localhost:8000/api/v1
- Make sure both frontend and backend servers are running simultaneously during development
- Avoid committing the `.env` files to version control
- Any changes to the database schema should be made via migrations

## Troubleshooting

- If you encounter CORS issues, make sure the backend's `CORS_ALLOWED_ORIGINS` and `SANCTUM_STATEFUL_DOMAINS` environment variables are correctly set
- For database connection issues, verify your MySQL credentials and make sure the database exists
- For storage issues, run `php artisan storage:link` to create the symbolic link
