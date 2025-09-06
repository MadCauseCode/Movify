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

## ⚙️ Setup & Installation

Follow these steps to run **Movify -- Cinema Management System**
locally:

### 1. Clone the repository

``` bash
git clone https://github.com/MadCauseCode/Movify.git
cd Movify
```

### 2. Install dependencies

Run inside the root folder:

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

``` env
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-secret
PORT=5000
```

-   **MONGO_URI** → Connection string to your MongoDB instance (Atlas or
    local).\
    Example:

        mongodb://127.0.0.1:27017/movify

-   **JWT_SECRET** → Any random secure string, used to sign
    authentication tokens.\

-   **PORT** → Default is `5000`, but you can change it if needed.

⚠️ Make sure MongoDB is running locally or that you have access to your
Atlas cluster.

### 4. Seed initial data (optional)

If the project includes seeding scripts, run:

``` bash
npm run seed
```

This will insert sample **admin user**, **movies**, and **members**.

> 🛡 Default Admin Login:\
> Username: `admin`\
> Password: `admin1234`\
> (or check your `.env` / seeding script if customized)

### 5. Start the server

``` bash
npm start
```

The backend will run on <http://localhost:5000>.

### 6. Start the client (if separate)

If the React frontend lives in a `client/` folder:

``` bash
cd client
npm install
npm start
```

This will run the UI on <http://localhost:3000>.

------------------------------------------------------------------------

✅ At this point, you should be able to **log in with the admin
account** and explore the system.



<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 11 51" src="https://github.com/user-attachments/assets/a7a672e7-a5d3-4f2a-9a85-51ad7a138365" />
<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 12 00" src="https://github.com/user-attachments/assets/e538099d-ac9c-43fd-b66a-0e3af1102faf" />
<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 12 04" src="https://github.com/user-attachments/assets/af40b3a9-b22c-4d15-bcc6-4fbf0672d899" />
<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 12 07" src="https://github.com/user-attachments/assets/300ef700-011e-45cf-b45c-e82eca6e2610" />
<img width="1680" height="1050" alt="Screenshot 2025-09-06 at 6 12 19" src="https://github.com/user-attachments/assets/6fb1301e-e8eb-4884-8aef-68a65fbdf885" />
