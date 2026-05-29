# Copilot Instructions for LeetCode-like Platform

## Architecture Overview
This is a Node.js/Express backend for a coding problem platform (similar to LeetCode). Key components:
- **Routes**: `/user` (auth), `/problem` (CRUD operations)
- **Controllers**: Handle business logic (user auth, problem management, submissions)
- **Models**: Mongoose schemas for User, Problem, Submission
- **Middlewares**: JWT auth (admin/user roles), token validation via Redis blacklist
- **Utils**: Problem utilities for code judging via Judge0 API
- **Config**: MongoDB connection, Redis client

Data flows: Client → Middleware (auth) → Controller → Model → DB/Redis. Submissions route to Judge0 for execution.

## Critical Workflows
- **Setup**: `npm install`, configure `.env` (PORT, MONGODB_URI, JWT_SECRET, REDIS_URL, JUDGE0 credentials)
- **Run**: `node src/index.js` (connects DB/Redis first)
- **Test**: Use Postman for endpoints; no unit tests exist
- **Debug**: Check console for connection logs; verify JWT tokens and Redis blacklist

## Project Conventions
- **Auth**: JWT in cookies; admin role required for problem creation
- **Error Handling**: Try/catch in async functions; send status/error messages
- **Problem Structure**: Includes visible/hidden test cases, multi-language start/reference code
- **Judging**: Batch submissions to Judge0 API; use `getLanguageById` for language mapping
- **DB**: Mongoose for schemas; Redis for token management

## Integration Points
- **Judge0 API**: External code execution service (utils/problemUtility.js)
- **MongoDB**: Persistent storage for users/problems/submissions
- **Redis**: Token blacklisting and caching

## Key Files
- `src/index.js`: App setup, middleware, routes
- `src/controllers/userProblem.js`: Problem CRUD (admin-only creation)
- `src/models/problem.js`: Problem schema with test cases and code
- `src/utils/problemUtility.js`: Judge0 integration for submissions
- `src/middleware/adminMiddleware.js`: Role-based access control