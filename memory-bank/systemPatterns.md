# System Patterns: SRDO Website

## Architecture Overview

The SRDO website follows a decoupled architecture with separate frontend and backend components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────►│   Laravel API   │────►│  MySQL Database │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Key Technical Decisions

### 1. Decoupled Architecture

- **Decision**: Separate frontend and backend codebases
- **Rationale**: Allows independent development and deployment of each component
- **Implementation**: React.js frontend consuming Laravel API endpoints

### 2. RESTful API Design

- **Decision**: Use RESTful principles for API design
- **Rationale**: Provides a clear, standardized interface between frontend and backend
- **Implementation**: Laravel resource controllers and API routes

### 3. State Management

- **Decision**: React context API for state management
- **Rationale**: Sufficient for the application's complexity level without Redux overhead
- **Implementation**: Context providers for authentication, notifications, etc.

### 4. Database Design

- **Decision**: Relational database with well-defined schema
- **Rationale**: Data has clear relationships and structured format
- **Implementation**: MySQL with Laravel migrations and Eloquent ORM

## Component Relationships

### Frontend

```
App
├── Layouts
│   ├── MainLayout
│   └── AdminLayout
├── Pages
│   ├── Home
│   ├── Projects
│   ├── ProjectDetail
│   ├── News
│   ├── NewsDetail
│   ├── Resources
│   └── Contact
├── Components
│   ├── UI (shared UI elements)
│   ├── Forms
│   └── Sections (page sections)
└── Services
    ├── API
    └── Auth
```

### Backend

```
Laravel
├── Controllers
│   ├── API
│   │   ├── ProjectController
│   │   ├── NewsController
│   │   ├── ResourceController
│   │   └── ContactController
│   └── Admin
├── Models
│   ├── Project
│   ├── News
│   ├── Resource
│   └── Contact
├── Migrations
└── Routes
    ├── api.php
    └── web.php
```

## Design Patterns in Use

### 1. Repository Pattern (Backend)

- Separates data access logic from business logic
- Implemented for each model type (Projects, News, etc.)

### 2. Component Composition (Frontend)

- Building complex UIs from smaller, reusable components
- Enables consistency and maintainability

### 3. Container/Presenter Pattern (Frontend)

- Separation of data fetching logic from presentation components
- Improves component reusability and testing

### 4. Service Classes (Both)

- Encapsulating complex logic in dedicated service classes
- Examples: AuthService, MediaService

## Data Flow

1. User interacts with React frontend
2. Frontend calls appropriate API endpoint
3. Laravel controller processes request
4. Controller uses models/repositories to interact with database
5. Response returned to frontend
6. Frontend updates UI based on response

## Security Considerations

- API authentication via Laravel Sanctum
- CSRF protection for form submissions
- Input validation on both frontend and backend
- Proper error handling and logging
- Safe storage of sensitive information (.env files)
