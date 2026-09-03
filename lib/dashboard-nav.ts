import type { NavItem } from '@/components/dashboard/dashboard-shell'

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/pharmacies', label: 'Pharmacies' },
  { href: '/admin/distributors', label: 'Distributors' },
  { href: '/admin/documents', label: 'Document review' },
  { href: '/admin/medicines', label: 'Medicine catalog' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/purchase-orders', label: 'Purchase orders' },
  { href: '/admin/medicine-requests', label: 'Medicine requests' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' },
]

export const PHARMACY_NAV: NavItem[] = [
  { href: '/pharmacy/dashboard', label: 'Overview' },
  { href: '/pharmacy/catalog', label: 'Browse catalog' },
  { href: '/pharmacy/cart', label: 'Cart' },
  { href: '/pharmacy/purchase-orders', label: 'Purchase orders' },
  { href: '/pharmacy/requests', label: 'Medicine requests' },
  { href: '/pharmacy/inventory', label: 'Inventory' },
  { href: '/pharmacy/customers', label: 'Customers' },
  { href: '/pharmacy/sales', label: 'Sales & billing' },
  { href: '/pharmacy/documents', label: 'Documents' },
  { href: '/pharmacy/settings', label: 'Settings' },
]

export const DISTRIBUTOR_NAV: NavItem[] = [
  { href: '/distributor/dashboard', label: 'Overview' },
  { href: '/distributor/listings', label: 'Listings' },
  { href: '/distributor/listings/bulk', label: 'Bulk upload' },
  { href: '/distributor/purchase-orders', label: 'Purchase orders' },
  { href: '/distributor/requests', label: 'Medicine requests' },
  { href: '/distributor/documents', label: 'Documents' },
  { href: '/distributor/settings', label: 'Settings' },
]
