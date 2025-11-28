# 🏟️ Arenalink API

> Backend API for **Arenalink**, a facility discovery and reservation platform.

Arenalink provides a backend for discovering facilities, managing schedules and availability, creating reservations, processing payments, handling authentication, and sending notifications.

The API is built with **NestJS**, **TypeScript**, **PostgreSQL**, and **TypeORM**, with integrations for **Stripe**, **Google OAuth**, **SMTP email**, **SMS OTP**, and **Firebase Cloud Messaging**.

## ✨ Features

### 🔐 Authentication & Authorization

- Email/password authentication
- JWT-based authentication
- Personal access tokens
- Google OAuth
- Google mobile ID-token verification
- Email verification
- Password reset with OTP
- Phone verification with SMS OTP
- Role-based access control
- Owner approval workflow

### 🏟️ Facility Management

- Facility creation and management
- Facility categories
- Dynamic facility attributes
- Facility availability
- Scheduling and time slots
- Owner management
- Facility approval workflow
- Favorites

### 📅 Reservations

- Reservation creation
- Availability checks
- Slot management
- Reservation status management
- Capacity validation
- Overlapping reservation protection
- Reservation-related notifications

### 💳 Payments

- Stripe PaymentIntents
- Stripe customer creation
- Payment tracking
- Payment webhooks
- Payment status management
- Refund support
- Reservation payment validation

### 🔔 Notifications

- Firebase Cloud Messaging
- Per-user FCM tokens
- Push notifications
- Notification history
- Read/unread notifications
- Reservation reminders
- Owner/admin notifications

### 🌍 Internationalization

The API supports localized responses and content using:

- English
- Arabic

Language can be resolved from query parameters or request headers.

### 📄 API Documentation

Swagger/OpenAPI documentation is available through the application.

Once the API is running:

```text
http://localhost:3000/api-docs
```

## 🛠️ Tech Stack

| Technology       | Purpose                   |
| ---------------- | ------------------------- |
| NestJS           | Backend framework         |
| TypeScript       | Application language      |
| PostgreSQL       | Relational database       |
| TypeORM          | ORM and database access   |
| JWT              | Authentication            |
| Passport         | Authentication strategies |
| Google OAuth     | Social authentication     |
| Stripe           | Payments                  |
| Firebase Admin   | Push notifications        |
| Nodemailer       | Email delivery            |
| SMS Gateway      | Phone OTP                 |
| Swagger          | API documentation         |
| Jest             | Testing                   |
| Pug              | Email templates           |
| PDFKit / PDFMake | Invoice generation        |

The dependency list also includes scheduled jobs, validation, internationalization, uploads, and database seeding tooling.

## 🏗️ Architecture

The project is organized into domain-oriented NestJS modules.

```text
src/
├── auth/
├── users/
├── phones/
├── categories/
├── facilities/
├── schedules/
├── reservations/
├── payment/
├── notifications/
├── mail/
├── sms/
├── favorites/
├── yc-i18n/
├── db/
├── seeding/
└── shared/
```

The application wires these modules together through the root `AppModule`.

## 🔐 Authentication Flow

A typical email/password authentication flow looks like:

```text
Client
  │
  ▼
Register / Login
  │
  ▼
NestJS Auth Module
  │
  ├── Validate credentials
  ├── Hash / verify password
  ├── Issue JWT
  └── Create personal access token
          │
          ▼
       Protected API
```

The API uses Passport/JWT guards to protect authenticated routes.

## 🔑 Google Authentication

The API supports Google authentication for web and mobile clients.

The configuration supports:

```text
WEB_CLIENT_ID
WEB_CLIENT_SECRET
WEB_CALLBACK_URL
ANDROID_CLIENT_ID
IOS_CLIENT_ID
```

Google ID tokens are verified against the configured OAuth client IDs before the user is authenticated.

## 💳 Stripe Payments

Payments are handled through Stripe PaymentIntents.

The payment flow includes:

```text
Reservation
    │
    ▼
Create PaymentIntent
    │
    ▼
Stripe
    │
    ▼
Client completes payment
    │
    ▼
Stripe Webhook
    │
    ▼
Verify Payment
    │
    ▼
Update Reservation / Payment
```

The backend also performs capacity checks and uses database transaction logic to protect reservation availability.

## 📧 Email

The application uses SMTP for transactional email.

Email functionality includes:

- Email verification
- Password-reset OTP
- Localized email templates
- Invoice-related communication

SMTP configuration is provided through environment variables.

## 📱 SMS OTP

Phone verification uses an external SMS gateway.

The API generates OTP codes, stores hashed OTP values, sends them through the configured gateway, and validates their expiration before accepting the code.

## 🔔 Firebase Notifications

Firebase Cloud Messaging is used for push notifications.

The application supports:

- Registering FCM tokens
- Sending notifications to individual users
- Sending notifications to multiple users
- Removing stale FCM tokens
- Storing notification history
- Reservation reminders

Firebase Admin is initialized from a service-account JSON file. The location can be configured with:

```env
FIREBASE_ADMIN_SDK_PATH=/path/to/firebase-admin-sdk.json
```

If it is not provided, the application falls back to:

```text
./firebase-admin-sdk.json
```

The service-account file must remain private and should not be committed to the repository.

## 🗄️ Database

The project uses **PostgreSQL + TypeORM**.

Database configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
DB_NAME=arenalink
```

The project also includes database migrations and seeders.

## 🚀 Getting Started

### Prerequisites

Install:

- Node.js
- npm
- PostgreSQL

External services are required for some features:

- Google OAuth
- Stripe
- SMTP
- SMS gateway
- Firebase

You can still run the core API without configuring every external integration, but functionality depending on those services will not work.

### 1. Clone the Repository

```bash
git clone https://github.com/Muhammad-S-Gh/Arenalink_API.git
cd Arenalink_API
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create the Environment File

Copy the example:

```bash
cp .env.example .env
```

Then fill in the values for your local environment.

### 4. Create the Database

Create a PostgreSQL database named:

```text
arenalink
```

Then configure the database credentials in `.env`.

### 5. Run Database Migrations

```bash
npm run migration:run
```

### 6. Seed the Database

The project contains seeding utilities.

For the default admin seed:

```bash
npm run seed:admin
```

The project also includes a general seed command:

```bash
npm run seed
```

### 7. Start the Application

Development:

```bash
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

## 📚 Useful Commands

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Run migrations
npm run migration:run

# Revert latest migration
npm run migration:revert

# Show migration status
npm run migration:show

# Generate migration
npm run migration:generate

# Create migration
npm run migration:create

# Seed database
npm run seed

# Seed admin
npm run seed:admin

# Unit tests
npm run test

# Watch tests
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Lint
npm run lint

# Format
npm run format
```

These scripts are defined in the project's `package.json`.

## 🗂️ Database Migrations

Database changes are versioned through TypeORM migrations.

The repository contains migrations covering areas such as:

- Users
- Categories
- Owners
- Personal access tokens
- Password-reset OTPs
- Phone records
- FCM tokens
- Facilities
- Facility attributes
- Availability
- Days off
- Slots
- Reservations
- Payments
- Refunds

Keeping migrations in the repository allows a fresh installation to reproduce the database schema without relying on an existing production database.

## 📁 Project Structure

```text
Arenalink_API/
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   └── data-source.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── phones/
│   │   ├── categories/
│   │   ├── facilities/
│   │   ├── schedules/
│   │   ├── reservations/
│   │   ├── payment/
│   │   ├── notifications/
│   │   ├── mail/
│   │   ├── sms/
│   │   └── favorites/
│   │
│   ├── shared/
│   ├── seeding/
│   ├── locales/
│   ├── app.module.ts
│   └── main.ts
│
├── .env.example
├── nest-cli.json
├── package.json
├── package-lock.json
└── tsconfig.json
```

## 🌍 API Documentation

Swagger is configured automatically by the application.

After starting the server:

```text
http://localhost:3000/api-docs
```

The Swagger document includes bearer authentication support for protected endpoints.

## 🔒 Security Notes

Never commit:

```text
.env
firebase-admin-sdk.json
```

Never put real API keys, OAuth secrets, Stripe secrets, SMTP credentials, or JWT secrets in `.env.example`.

Use placeholders in `.env.example` and keep real credentials in your local `.env` or deployment secret manager.

## ⚠️ Production Notes

Before deploying to production:

- Set `NODE_ENV=production`
- Use a strong random `JWT_SECRET`
- Disable development-only database synchronization
- Configure production PostgreSQL credentials
- Configure Stripe webhook signing
- Configure SMTP credentials
- Configure SMS provider credentials
- Configure Google OAuth redirect URIs
- Configure Firebase Admin credentials
- Restrict CORS to trusted frontend origins
- Store secrets in a secure secret-management system

## 🧪 Testing

The project is configured with Jest and supports:

```bash
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

The test configuration is included in `package.json`.

## 📌 Current Scope

Arenalink is designed around a facility-reservation workflow:

```text
Users
  │
  ├── Discover facilities
  ├── View availability
  ├── Create reservations
  ├── Make payments
  └── Receive notifications
            │
            ▼
        Arenalink API
            │
      ┌─────┼─────┐
      ▼     ▼     ▼
 PostgreSQL Stripe Firebase
```

Owners can manage facilities and availability, while administrators handle approval and management workflows.

---

**Arenalink API — backend services for facility discovery, scheduling, reservations, payments, and notifications.**
