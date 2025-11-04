# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Application web de gestion de caisse pour un club de tennis, incluant:
- Encaissements (liquide, chèque, CB)
- Gestion de stocks (boissons, alimentaires)
- Documents comptables pour bilan financier
- Gestion de comptes membres et non-membres

## Technology Stack

- **Frontend**: React + Vite.js + shadcn/ui + TailwindCSS
- **Database**: MySQL (phpMyAdmin)
- **Infrastructure**: Docker (compatible GitHub Codespaces)
- **Charts**: Bibliothèque professionnelle pour graphiques comptables

## User Roles & Permissions Architecture

The application uses a **modular permissions system** combining predefined roles with granular permissions:

### Predefined Roles
- **Admin**: Full system access and configuration
- **Président**: Dashboard overview, reports, cash operations (bureau member)
- **Trésorier**: Accounting consultation/validation, stock management, financial reports (no cash operations)
- **Secrétaire**: Member management, cash operations (bureau member)
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
