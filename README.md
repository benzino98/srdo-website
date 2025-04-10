# SRDO Website

This repository contains the code for the SRDO website, a modern web application for a the strategy and results delivery office of the governor of Plateau State

## Project Structure

The project is organized into two main parts:

1. **Backend** (Laravel PHP): `srdo-website-backend/`
2. **Frontend** (React.js): `srdo-website-frontend/`

## Tech Stack

- **Backend**: Laravel (PHP)
- **Frontend**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL
- **Hosting**: Shared Hosting
- **Animations**: Framer Motion

## Features

- Modern UI with smooth animations
- Responsive design for all devices
- Interactive components
- Contact form with backend integration
- Project showcase with detailed pages
- News section
- Resources section

## Pages

- **Home**: Organization overview, mission, and featured projects
- **Projects**: List of ongoing and completed projects
- **Project Detail**: Detailed information about specific projects
- **News**: Articles and updates
- **Resources**: Downloadable materials
- **Contact**: Contact form and location information

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd srdo-website-frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm start
   ```

4. The application will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd srdo-website-backend
   ```

2. Install PHP dependencies:

   ```
   composer install
   ```

3. Copy the environment file:

   ```
   cp .env.example .env
   ```

4. Generate application key:

   ```
   php artisan key:generate
   ```

5. Configure your database in the `.env` file

6. Run migrations:

   ```
   php artisan migrate
   ```

7. Start the development server:

   ```
   php artisan serve
   ```

8. The API will be available at `http://localhost:8000`

## Development

- Frontend code is in `srdo-website-frontend/src/`
- Backend code is in `srdo-website-backend/app/`
- Database migrations are in `srdo-website-backend/database/migrations/`

## Deployment

### Frontend

1. Build the production version:

   ```
   cd srdo-website-frontend
   npm run build
   ```

2. Upload the contents of the `build` folder to your hosting provider

### Backend

1. Configure your production environment variables
2. Upload the Laravel application to your hosting provider
3. Set up the web server to point to the `public` directory

## License

This project is licensed under the MIT License.
