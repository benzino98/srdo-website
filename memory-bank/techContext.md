# Tech Context: SRDO Website

## Technologies Used

### Frontend

- **Framework**: React.js
- **Language**: JavaScript/TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Routing**: React Router
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend

- **Framework**: Laravel (PHP)
- **Authentication**: Laravel Sanctum
- **ORM**: Eloquent
- **API**: RESTful endpoints

### Database

- **RDBMS**: MySQL
- **Schema Management**: Laravel Migrations

### Infrastructure

- **Hosting**: Shared Hosting (cPanel)
- **Deployment**: Manual deployment

## Development Setup

### Frontend Requirements

- Node.js (v14+)
- npm or yarn

### Backend Requirements

- PHP 8.0+
- Composer
- Laravel CLI

### Local Development

1. Clone repository
2. Set up backend:

   ```
   cd srdo-website-backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   php artisan serve
   ```

3. Set up frontend:
   ```
   cd srdo-website-frontend
   npm install
   npm start
   ```

## Technical Constraints

### Shared Hosting Limitations

- Limited server resources (CPU, memory)
- No SSH access in some cases
- FTP deployment method
- Potential restrictions on background processes
- Limited support for modern deployment workflows

### Performance Considerations

- Optimize bundle size for frontend
- Implement caching strategies
- Lazy loading for images and components
- Database query optimization

### Browser Compatibility

- Support modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation for older versions

## Dependencies

### Frontend Dependencies

- react
- react-dom
- react-router-dom
- axios
- tailwindcss
- framer-motion
- @headlessui/react (for UI components)

### Backend Dependencies

- laravel/framework
- laravel/sanctum
- intervention/image (for image manipulation)
- spatie/laravel-medialibrary (for media management)

## Environment Configuration

### Frontend (.env)

- API endpoint URLs
- Feature flags

### Backend (.env)

- Database credentials
- Mail server settings
- API keys
- Storage configuration

## Deployment Process

### Frontend Deployment

1. Build production bundle
   ```
   npm run build
   ```
2. Upload build directory to hosting

### Backend Deployment

1. Set production environment variables
2. Upload application files
3. Run migrations if needed
   ```
   php artisan migrate --force
   ```
4. Optimize application
   ```
   php artisan optimize
   ```

## Monitoring & Maintenance

- Laravel logging
- Error tracking
- Manual database backups
- Periodic security updates
