# Professional Invoice Generator System

A full-stack, institutional-grade invoice management system built with React and Node.js. Designed for high precision, export-ready documentation, and seamless data persistence.

## 🚀 Key Features
- **Dynamic Calculation Engine**: Handles decimals with high precision (no rounding errors).
- **Export Ready**: Specialized fields for Export Currency, Conversion Rates, PO Numbers, and Software Export Types.
- **Client Management**: Integrated client database with registration and editing capabilities.
- **PDF Generation**: High-quality PDF exports with professional institutional layouts.
- **Database Persistence**: Robust storage using PostgreSQL and Sequelize ORM.
- **Responsive UI**: Modern, clean dashboard with real-time preview and glassmorphism elements.

## 🛠 Tech Stack
- **Frontend**: React.js, Tailwind CSS, Lucide Icons, React Datepicker.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL with Sequelize ORM.
- **Authentication**: JWT-based secure login.

---

## 📥 Getting Started (Installation)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (installed and running)

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd "Invoice Generator Project"
```

### 3. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add your credentials:
   ```env
   PORT=5000
   DB_NAME=invoice_generator
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   JWT_SECRET=your_secret_key
   ```
4. Run the backend server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend application:
   ```bash
   npm run dev
   ```

---

## 🔄 Updating the Project
To get the latest changes from the repository:
```bash
git pull origin main
```

## 🛠 Troubleshooting
- **Database Connection Error**: Ensure PostgreSQL is running and the database `invoice_generator` exists. You can create it with `CREATE DATABASE invoice_generator;` in your SQL shell.
- **Node Modules Issues**: If you see missing module errors, run `npm install` again in both `frontend` and `backend` folders.

## 📄 License
This project is licensed under the MIT License.
