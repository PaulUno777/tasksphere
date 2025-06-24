![TaskSphere CI/CD Pipeline](https://github.com/PaulUno777/tasksphere/actions/workflows/ci-cd.yml/badge.svg)

# TaskSphere - Task Management System

A full-stack, real-time collaborative task management system powered by **Go** backends, **Redis**, and a rich **Angular + NgRX + Tailwind** frontend. Designed for intelligent notifications, team-based workflows, and high performance.

---

## 🔍 Overview

**TaskSphere** provides robust tools for managing tasks across teams or individuals. Key features include:

- 🔐 JWT-based authentication (Go )
- 📡 Real-time updates via WebSocket
- 🧑‍🤝‍🧑 Role-based access control (ADMIN/EDITOR/VIEWER)
- 📌 Task assignment, status tracking, and categorization
- 💬 Board collaboration and commenting system
- ⚡ Performance: caching, async queues, batch ops

---

## 🛠️ Technology Stack

| Layer       | Technology                        |
|------------|------------------------------------|
| Backend     | Go (Fiber, MongoDB, Redis)         |
| Frontend    | Angular + Tailwind CSS             |
| Auth        | JWT (access + refresh)             |
| Realtime    | WebSocket                          |
| Queue/Caching| Redis + cache-manager             |
| Dev Tools   | Air, Docker, GitHub Actions  |

---

## 🧩 Features

- ✅ Board & Task Management  
- ✅ User Roles & Permissions  
- ✅ Intelligent Notifications  
- ✅ Real-Time Sync  
- ✅ Commenting System  
- ✅ Dashboard Analytics  
- ✅ Backend Support (Go)

---

## 📦 Installation

### 🚀 Backend: Go (Fiber) Setup
```bash
git clone https://github.com/PaulUno777/tasksphere.git
cd tasksphere/tasktphere-api

# Copy env config
cp .env.example .env

# Run locally
go mod tidy
go run ./cmd/main.go
```

or use Docker

```bash
docker compose up --build
```

### 📁 Project Structure
.
├── tasktphere-api/ # Go + MongoDB + Redis (new backend)
├── frontend/ # Angular + Tailwind
├── docker-compose.yml
├── .github/workflows/ci-cd.yml
└── README.md