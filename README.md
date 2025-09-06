# 🎬 Movify – Cinema Management System

A **full-stack web application** for managing **movies, members, and their subscriptions**.  
Built with **React (frontend)**, **Node.js/Express (backend)**, and **MongoDB (database)**.  

This project was created as my **Technion Full-Stack Development final project**.  
I implemented the backend (Express/MongoDB), the frontend (React/Router), authentication (JWT), and data modeling myself.

---

## ✨ Project Highlights
- Role-based JWT authentication  
- Full CRUD with MongoDB & Mongoose  
- Protected routes in React Router  
- Seed scripts for initial data  

---

## 🚀 Features

### 🔐 Authentication
- Secure login with **username & password**
- JWT-based authentication
- Error handling for failed login attempts
- Persistent display of the logged-in user’s name across pages

### 🎬 Movies Management
- **All Movies**: list movies with name, genres, premiere date, and poster
- **Search** by name
- **Create/Edit/Delete** movies  
  (deleting a movie also removes related subscriptions)

### 🎟️ Subscriptions Management
- **All Members**: list members with name, email, and city
- See movies watched by each member
- **Create Member** and **Sync Members from API** (JSONPlaceholder integration)
- Subscribe a member to a movie with a chosen date

---

## 🗂️ Data Model

**Users**
- `id`
- `fullName`
- `username`
- `password`

**Movies**
- `id`
- `name`
- `yearPremiered`
- `genres` (array of strings)
- `imageUrl`

**Members**
- `id`
- `email`
- `city`

**Subscriptions**
- `id`
- `movieId`
- `memberId`
- `date` (date watched)

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/MadCauseCode/Movify.git
cd Movify
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root:
```env
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-secret
PORT=5000
```

- `MONGO_URI` → MongoDB connection string (Atlas or local)  
- `JWT_SECRET` → random secure string  
- `PORT` → default: `5000`

### 4. Seed initial data (optional)
If seeding scripts are available:
```bash
npm run seed
```
This will insert:
- Default **admin user**
- Example movies
- Example members

> 🛡 Default Admin Login  
> Username: `admin`  
> Password: `admin1234`  
> (unless customized in `.env` or seed file)

### 5. Run the backend
```bash
npm start
```
Runs on <http://localhost:5000>

### 6. Run the frontend
If React is in a `client/` folder:
```bash
cd client
npm install
npm start
```
Runs on <http://localhost:3000>

---

## 📡 API Documentation

### Auth
- `POST /api/auth/login` → login with username & password

### Users
- `GET /api/users` → list users (admin only)  
- `POST /api/users` → create user (admin only)  

### Movies
- `GET /api/movies` → list all movies  
- `POST /api/movies` → create a movie  
- `PUT /api/movies/:id` → edit a movie  
- `DELETE /api/movies/:id` → delete a movie  

### Members
- `GET /api/members` → list members  
- `POST /api/members` → create member  
- `PUT /api/members/:id` → edit member  
- `DELETE /api/members/:id` → delete member  

### Subscriptions
- `GET /api/subscriptions` → list subscriptions  
- `POST /api/subscriptions` → add movie to member  
- `DELETE /api/subscriptions/:id` → remove subscription  

---

## 🖼️ Screenshots

### Login
<img src="https://github.com/user-attachments/assets/a7a672e7-a5d3-4f2a-9a85-51ad7a138365" width="600">

### Movies
<img src="https://github.com/user-attachments/assets/e538099d-ac9c-43fd-b66a-0e3af1102faf" width="600">

### Edit Movie
<img src="https://github.com/user-attachments/assets/6fb1301e-e8eb-4884-8aef-68a65fbdf885" width="600">

### Members
<img src="https://github.com/user-attachments/assets/af40b3a9-b22c-4d15-bcc6-4fbf0672d899" width="600">

### Subscriptions
<img src="https://github.com/user-attachments/assets/300ef700-011e-45cf-b45c-e82eca6e2610" width="600">

---

## 📚 Lessons Learned
- Implementing **role-based access** with JWTs taught me secure authentication basics.  
- Designing **relational data in MongoDB** (members ↔ subscriptions ↔ movies) gave me experience modeling real-world relationships in NoSQL.  
- Building **protected routes** in React with React Router strengthened my understanding of client-side auth.  
- I improved my workflow with **Postman API testing** and debugging backend errors quickly.  

---

## 🛠️ Tech Stack
- **Frontend**: React, React Router, CSS Modules / Styled Components
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Authentication**: JWT
- **Other**: Axios, JSONPlaceholder API (for seeding members)

---

## 🌐 Hosting
The project will soon be deployed (backend planned on Render, frontend on Vercel, and database on MongoDB Atlas).  
A live demo link will be added here once available. 🚀

---

## 👤 Contributors
- **[Oran Gal](https://github.com/MadCauseCode)** – Developer

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

