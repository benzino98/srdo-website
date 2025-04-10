# SRDO Website Development

## Tech Stack

- **Backend**: Laravel (PHP)
- **Frontend**: React.js
- **Styling**: Tailwind CSS
- **Database**: MySQL
- **Hosting**: Shared Hosting
- **Animations**: Framer Motion

## Pages & Features

### 1. Home Page

- Modern UI with smooth animations
- Hero section with SRDO’s mission & vision
- Call-to-action buttons
- Featured projects/news section
- Testimonials (if applicable)

**Example Components:**

- `HeroSection.js`
- `FeatureCards.js`
- `Testimonials.js`

### 2. Contact Us Page

- Contact form (Laravel API endpoint for submissions)
- Map integration (Google Maps API)
- Address and social media links

**Example Components:**

- `ContactForm.js`
- `Map.js`

### 3. News Page

- Fetch news articles from the database
- Search & filter functionality
- Pagination for long lists

**Example Components:**

- `NewsList.js`
- `NewsDetail.js`

### 4. Projects Page

- List of ongoing/completed projects
- Project details page
- Image gallery

**Example Components:**

- `ProjectList.js`
- `ProjectDetail.js`

### 5. Resources Page

- Downloadable PDFs or documents
- Categorized by type
- Search and filter options

**Example Components:**

- `ResourceList.js`

## Database Schema (MySQL)

### Tables

1. **Users** (Admin/Editor roles)
2. **News** (title, content, images, published status, created_at, updated_at)
3. **Projects** (title, description, status, images, start_date, end_date)
4. **Resources** (title, file_url, category, created_at)
5. **Contacts** (name, email, message, created_at)

## Development Steps

1. **Set up Laravel Backend**
   - Install Laravel & configure database
   - Create API routes for news, projects, resources, and contact submissions
   - Implement authentication & authorization
2. **Build React Frontend**
   - Set up React with Tailwind CSS
   - Fetch data from Laravel API
   - Implement Framer Motion for animations
3. **Deploy on Shared Hosting**
   - Configure Laravel on shared hosting (cPanel)
   - Use Vite for React build deployment
   - Optimize performance

## Notes

- Ensure smooth user experience with lazy loading for images
- Use SEO-friendly URL structures
- Optimize performance for shared hosting constraints

## Coding Pattern Preferences

- **Naming Convention**:

  - Use `camelCase` for variables and functions with a descriptive and meaningful names
  - Use `PascalCase` for classes and components
  - Use `UPPER_SNAKE_CASE` for constants

- **Modularity**:

  - Favor small, composable, and single-responsibility functions or components

- **Error Handling**:

  - Use `try/catch` blocks for async operations
  - Centralize error logging and handling when possible

- **Comments**:

  - Write concise, meaningful comments only when logic isn't self-explanatory
  - Prefer self-documenting code over excessive commenting

- **Code Structure**:

  - Group code by feature/domain
  - Avoid deeply nested control structures

- **Coding Style**
  - Always prefer simple solutions
  - Avoid using console logs for dev and prod codes only when necessary for dev
  - Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
  - Write code that takes into account the different environments: dev, test, and prod
  - You are careful to only make changes that are requested or you are confident are well understood an related to the change being requested
  - When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implememntations afterwards so we don't have duplicate logic.
  - Keep the codebase very clean and organized
  - Avoid writing scripts in files if possible, especially if the script is likely only to be run once
  - mocking data is only needed for test, never mock data for dev or prod
  - Never add stubbing or fake data patterns to code that affects the dev or prod environments
  - Never overwrite my .env file without first asking and confirming
  - Always use ; and not && to combine powershell commands
  - Never restart the server when changes are made only when necessary
  - Make sure to be in the correct directory when creating files
  - Focus on the areas of code relevant to the task
  - Do not touch code that is unrelated to the task
  - Avoid making major changes to the patterns and architecture of how a feature works, after it has shown to work well, unless explicitly structured
  - Always think about what other methods and areas of the code might be affected by code changes
