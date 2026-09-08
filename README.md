# HR Analytics & Employee Management Dashboard

A modern, data-driven frontend for managing employees and turning HR data into actionable insights. The application connects to a REST API and brings employee operations, attendance, vacations, reporting, authentication, and attrition insights into one interface.

## Highlights

- Secure sign-in, email verification, password recovery, and token-based session handling
- Protected routes and role-aware navigation for authenticated users and administrators
- Employee listing, search, filtering, pagination, creation, editing, and deletion workflows
- Dashboard summaries, performance visualizations, alerts, and top-employee views
- Attendance tracking and employee attendance history
- Vacation request submission, review, approval, and rejection flows
- Grouped HR reports and interactive charts
- Employee attrition prediction integration
- Typed API modules with consistent loading, error, and cache handling
- Responsive interface built with reusable components

## Tech stack

| Area | Technologies |
|---|---|
| UI | React 19, TypeScript, Ant Design, Tailwind CSS |
| Routing | React Router 7 |
| Server state | TanStack React Query 5 |
| Client state | Zustand 5 |
| Data visualization | Recharts 3 |
| API integration | Axios, Fetch API |
| Tooling | Vite, ESLint, TypeScript |

## Application areas

- **Dashboard:** summaries, employee performance, charts, and operational alerts
- **Employees:** records, filters, pagination, details, and CRUD operations
- **Reports:** grouped analytics for departments, roles, and attrition-related data
- **Attendance:** current presence and historical attendance records
- **Vacations:** employee requests and administrative decisions
- **Users:** account management for authorized roles
- **Authentication:** sign-in, account verification, password recovery, and session renewal

## Related backend

The dashboard is designed to work with the [HR Analytics & Employee Management API](https://github.com/malaz22mm/hr-back), built with NestJS, Prisma, PostgreSQL, JWT authentication, RBAC, and Swagger/OpenAPI.

## Getting started

### Prerequisites

- Node.js 20 or later
- npm
- A running instance of the HR backend API

### Installation

```bash
git clone https://github.com/malaz22mm/hr-ai-dashboard.git
cd hr-ai-dashboard
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set the backend API URL:

```env
VITE_API_URL=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

Then open the local URL printed by Vite.

## Available commands

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

## Project structure

```text
src/
├── api/          # Typed HTTP clients and API resource modules
├── app/          # Route-level application screens
├── auth/         # Session state, token handling, and auth helpers
├── components/   # Shared interface components
├── features/     # Domain hooks and mutations
├── lib/          # Types, mapping, utilities, and legacy API layer
└── query/        # Query keys and React Query configuration
```

## Architecture notes

- TanStack React Query manages remote data, caching, mutations, and invalidation.
- Zustand holds the client-side authentication session without prop drilling.
- Axios interceptors and a typed Fetch wrapper support the current API integration layers.
- Route guards improve client-side navigation, while authorization is enforced by the backend.

## Status

This project is under active development. Planned improvements include broader automated test coverage, consolidated HTTP infrastructure, and deployment documentation.

## Author

Developed by [Malaz Solieman](https://github.com/malaz22mm).


