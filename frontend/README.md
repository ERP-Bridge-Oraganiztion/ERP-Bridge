# ERP Bridge Frontend

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Axios, and Zustand dashboard for the ERP Bridge migration platform.

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

The dashboard runs on `http://localhost:5173` and uses
`VITE_API_BASE_URL=http://localhost:8080/api/v1` by default.

## Main Workflow

`Login -> Projects -> New Project -> Connector -> Schema -> Mapping -> Validation -> Migration -> Export`

New projects support Manual Upload or Live Connection. Manual projects keep the
selected format, so a CSV project only accepts CSV files and an Excel project only
accepts Excel files.

## Organization Accounts

Sign in with organization name, email, and password. Administrators can open
Settings to create team members, view member IDs and roles, reset passwords, or
delete member accounts. Passwords are never displayed.

## Build

```bash
npm run build
```
