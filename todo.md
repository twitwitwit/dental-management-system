# Dental Management System — TODO

## Foundation
- [x] Database schema: patients, appointments, treatments/clinical records, tooth chart conditions, invoices, payments, inventory items, stock movements, insurance providers, patient insurance, insurance claims, users/staff (role enum: admin | dentist | receptionist | staff)
- [x] Migrations generated and applied
- [x] Server tRPC routers for all modules with role-based authorization
- [x] Vitest tests for key procedures (14/14 passing)
- [x] Professional clinical design system (index.css, fonts, palette)

## 1. Role-based authentication
- [x] 4 roles: Admin, Dentist, Receptionist, Staff (enum extended in schema)
- [x] Role-scoped access enforced server-side (role checks in all procedures)
- [x] Role-scoped sidebar navigation rendered per role

## 2. Dashboard overview
- [x] KPI cards: today's appointments, revenue, new patients, pending tasks
- [x] Chart: appointment trends over time
- [x] Chart: revenue over time
- [x] Role-based dashboard visibility

## 3. Patient management
- [x] Patient registration form
- [x] Patient profile page with demographics
- [x] Medical & dental history records per patient
- [x] Patient list with search and filtering
- [x] Patient status (active/inactive)

## 4. Appointment scheduling
- [x] Calendar view of appointments
- [x] Book appointment
- [x] Reschedule appointment
- [x] Cancel appointment
- [x] Status tracking: scheduled, confirmed, completed, no-show

## 5. Dental chart & clinical records
- [x] Tooth diagram (FDI 32-teeth) visualization
- [x] Tooth conditions (decay, filling, crown, etc.) per tooth
- [x] Treatment notes / diagnoses per patient
- [x] Treatment plans with procedures and status
- [x] Treatment history

## 6. Billing & payments
- [x] Invoice generation from treatment plans
- [x] Payment recording (cash/card/bank transfer)
- [x] Outstanding balance tracking
- [x] Payment history per patient
- [x] Refund/adjustment handling (invoice adjustments)

## 7. Inventory management
- [x] Supplies/materials catalog
- [x] Stock in / stock out operations
- [x] Stock level monitoring
- [x] Low-stock alerts
- [x] Inventory list with stock adjustments

## 8. Insurance management
- [x] Insurance providers list
- [x] Patient insurance details (provider, policy)
- [x] Claim creation (with co-pay/deductible)
- [x] Claim status tracking (pending, submitted, approved, denied)

## 9. Reports & analytics
- [x] Appointment statistics report
- [x] Revenue report
- [x] Patient demographics report
- [x] Exportable summaries (CSV export)

## 10. User & staff management
- [x] Add clinic staff accounts (admin only)
- [x] Edit staff and assign roles (admin only)
- [x] Deactivate staff (admin only)
- [x] Clinic-wide settings page (admin only): clinic info, preferences

## Polish & Delivery
- [x] Seed demo data for all modules
- [x] Screenshots verified, vitest passing (14/14)
- [x] Checkpoint saved
