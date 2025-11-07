# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Application web de gestion de caisse pour le **TCX Saint-André** (club de tennis), incluant:
- Encaissements bar/boutique (liquide, chèque, CB)
- Gestion de stocks (boissons, snacks, accessoires tennis)
- Documents comptables pour bilan financier
- Gestion de comptes membres et non-membres

### Scope & Context

**What this application MANAGES:**
- ✅ Bar/boutique sales (drinks, snacks, tennis accessories)
- ✅ Stock management for these products
- ✅ Cash register operations and accounting
- ✅ Member/non-member accounts for purchases

**What this application DOES NOT manage:**
- ❌ Club memberships/subscriptions → Managed in **TENUP** (FFT external system)
- ❌ Individual coaching fees (BE personal income) → Direct payment to coach
- ❌ Court reservations
- ❌ Tournament registrations

**Key stakeholder:** The BE (Breveté d'État - tennis coach) is the main daily user, present every day as the primary contact for prospects, members, and non-members.

## Technology Stack

- **Frontend**: React + Vite.js + shadcn/ui + TailwindCSS
- **Database**: MySQL (phpMyAdmin)
- **Infrastructure**: Docker (compatible GitHub Codespaces)
- **Charts**: Bibliothèque professionnelle pour graphiques comptables

## User Roles & Permissions Architecture

The application uses a **modular permissions system** combining predefined roles with granular permissions:

### Predefined Roles
- **Admin**: Full system access and configuration
- **BE (Breveté d'État)**: Tennis coach, daily operations, cash operations (bar/boutique), member management, stock consultation
- **Président**: Dashboard overview, reports, cash operations (bureau member)
- **Trésorier**: Accounting consultation/validation, stock management, financial reports (no cash operations)
- **Secrétaire**: Member management, cash operations (bureau member) - *Note: Role exists but no secretary currently at TCX Saint-André*
- **Caissier/Bénévole**: Cash operations, sales, read-only stock view
- **Membre**: Personal account consultation
- **Non-membre**: Guest account consultation

### Permission Categories
- **caisse.***: Cash operations (cash, check, credit card, cancellations)
- **stock.***: Inventory management (view, modify, add products, orders)
- **compta.***: Accounting (view all, generate documents, exports, corrections)
- **membres.***: Member management (create, modify, view, delete accounts)
- **admin.***: System configuration and user management

### Key Design Principles
1. **Multiple roles per user**: Users can combine roles (e.g., Secrétaire + Caissier)
2. **Role-based permissions**: Roles define standard permission sets
3. **Custom permissions**: Additional permissions can be granted per user
4. **Flexible authorization**: Permission checks via `userCan(userId, permission)`

### Database Schema
```
users → user_roles → roles → role_permissions → permissions
     ↘ user_permissions (custom) ↗
```

See `docs/permissions.md` for complete implementation details.

## Current State

This is a new project. No build commands, test commands, or development infrastructure has been set up yet.
