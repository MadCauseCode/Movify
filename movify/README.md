# 🎬 Cinema Management System


A full-stack web application for managing **movies, members, and their subscriptions**. 
Built as a **final project** using **React** for the front end, **Node.js/Express** for the back end, and **MongoDB** as the database. 


The platform allows authenticated users to browse and manage movies, maintain member records, track watched movies, and create or update subscriptions — all from a clean, responsive interface. 


---


## 🚀 Features


### 🔐 Authentication
- Secure login with **username & password**
- Error handling for failed login attempts
- Persistent display of the logged-in user’s name across all pages


### 🎬 Movies Management
- **All Movies page**: list all movies with name, year, poster image, genres, and members who watched them 
- **Search movies** by name 
- **Edit / Delete movies** (deletion also removes related subscription entries) 
- **Add Movie page**: create new movies with name, year, genres, and image URL 
- **Edit Movie page**: update movie details and save changes 


### 🎟️ Subscriptions Management
- **All Members page**: view all members, their email, city, and movies watched 
- View movies watched by each member (clickable links filter the Movies page) 
- **Add Member page** (restricted to authorized users) 
- Subscribe a member to a new movie with a selected date 


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


## 🛠️ Tech Stack
- **Frontend**: React, React Router, CSS Modules / Styled Components 
- **Backend**: Node.js, Express.js 
- **Database**: MongoDB with Mongoose ORM (or SQL Server alternative) 
- **Authentication**: JWT-based login system 


---


## 👤 Default Admin Login:
- details hashed, check env

<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 11 51" src="https://github.com/user-attachments/assets/a7a672e7-a5d3-4f2a-9a85-51ad7a138365" />
<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 12 00" src="https://github.com/user-attachments/assets/e538099d-ac9c-43fd-b66a-0e3af1102faf" />
<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 12 04" src="https://github.com/user-attachments/assets/af40b3a9-b22c-4d15-bcc6-4fbf0672d899" />
<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 12 07" src="https://github.com/user-attachments/assets/300ef700-011e-45cf-b45c-e82eca6e2610" />
<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 12 19" src="https://github.com/user-attachments/assets/6fb1301e-e8eb-4884-8aef-68a65fbdf885" />
