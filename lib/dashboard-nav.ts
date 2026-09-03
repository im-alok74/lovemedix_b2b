export interface NavItem {
  href: string
  label: string
  /** Key into ICONS in components/dashboard/dashboard-nav.tsx (client). */
  icon?: string
}

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'dashboard' },
  { href: '/admin/pharmacies', label: 'Pharmacies', icon: 'building' },
  { href: '/admin/distributors', label: 'Distributors', icon: 'truck' },
  { href: '/admin/documents', label: 'Document review', icon: 'file-check' },
  { href: '/admin/medicines', label: 'Medicine catalog', icon: 'pill' },
  { href: '/admin/categories', label: 'Categories', icon: 'tags' },
  { href: '/admin/purchase-orders', label: 'Purchase orders', icon: 'clipboard' },
  { href: '/admin/medicine-requests', label: 'Medicine requests', icon: 'package-search' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
]

export const PHARMACY_NAV: NavItem[] = [
  { href: '/pharmacy/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '/pharmacy/catalog', label: 'Browse catalog', icon: 'package-search' },
  { href: '/pharmacy/cart', label: 'Cart', icon: 'cart' },
  { href: '/pharmacy/purchase-orders', label: 'Purchase orders', icon: 'clipboard' },
  { href: '/pharmacy/requests', label: 'Medicine requests', icon: 'file-text' },
  { href: '/pharmacy/inventory', label: 'Inventory', icon: 'boxes' },
  { href: '/pharmacy/customers', label: 'Customers', icon: 'contact' },
  { href: '/pharmacy/sales', label: 'Sales & billing', icon: 'receipt' },
  { href: '/pharmacy/documents', label: 'Documents', icon: 'file-check' },
  { href: '/pharmacy/settings', label: 'Settings', icon: 'settings' },
]

export const DISTRIBUTOR_NAV: NavItem[] = [
  { href: '/distributor/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '/distributor/listings', label: 'Listings', icon: 'pill' },
  { href: '/distributor/listings/bulk', label: 'Bulk upload', icon: 'boxes' },
  { href: '/distributor/purchase-orders', label: 'Purchase orders', icon: 'clipboard' },
  { href: '/distributor/requests', label: 'Medicine requests', icon: 'package-search' },
  { href: '/distributor/documents', label: 'Documents', icon: 'file-check' },
  { href: '/distributor/settings', label: 'Settings', icon: 'settings' },
]
