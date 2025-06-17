![TaskSphere CI/CD Pipeline](https://github.com/PaulUno777/tasksphere/actions/workflows/ci-cd.yml/badge.svg)

# TaskSphere - Task Management System

A comprehensive task management system designed for real-time collaboration, intelligent notifications, and efficient team-based workflows. Built using Node.js, Express, TypeORM, WebSocket, tailwind and Angular.

---

## 🔍 Overview

**TaskSphere** provides robust tools for managing tasks across teams or individuals. Key features include:

- JWT-based authentication
- Real-time notifications via WebSocket
- Role-based access control (ADMIN/EDITOR/VIEWER)
- Task assignment, status tracking, and categorization
- Collaborative boards and commenting system
- Performance optimizations like caching and batch operations

---

## 🛠️ Technology Stack

| Layer       | Technology            |
|------------|------------------------|
| Backend    | Node.js + Express      |
| Database   | SQLite + TypeORM       |
| Realtime   | WebSocket              |
| Caching    | cache-manager          |
| Frontend   | Angular + Tailwind CSS |
| Cron Jobs  | node-cron              |
| Auth       | JWT                    |

---

## 🧩 Features

1. **Board & Task Management**
2. **User Roles & Permissions**
3. **Intelligent Notifications**
4. **Commenting & Assignment System**
5. **Real-Time Updates**
6. **Dashboard Analytics**

---

## 📦 Installation

### Prerequisites

- Node.js (v18+)
- Yarn
- SQLite installed (for development)

### Setup

```bash
# Clone the repository
git clone https://github.com/PaulUno777/tasksphere.git
cd tasksphere

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env

# Run migrations
yarn typeorm:run-migrations

# Start the server
yarn dev
```

---

## 🚀 Deployment

This project supports CI/CD via GitHub Actions. See `.github/workflows/ci-cd.yml`.

---

## 🧪 Testing

```bash
# Run unit tests
yarn test

# Run end-to-end tests
yarn test:e2e
```

---

## 📈 Scripts

| Script               | Description                            |
|----------------------|----------------------------------------|
| `yarn dev`           | Start development server                |
| `yarn build`         | Build production bundle                 |
| `yarn start`         | Start built application                 |
| `yarn lint`          | Lint codebase                           |
| `yarn format`        | Format code                             |
| `yarn lint:fix`      | Lint codebase  and fix                  |
| `yarn format:check`  | Check code format                       |

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## 🧵 CI/CD Pipeline

GitHub Actions pipeline that runs on every push to the main branch and pull requests from forks.

### ✅ What It Does

- Installs dependencies using **Yarn**
- Builds the project
- Runs tests (unit + e2e)
- Deploys to staging/production if needed (configurable)

---
