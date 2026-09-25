import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Home,
  Menu,
  Minus,
  MoreHorizontal,
  PackageSearch,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import hululLogo from './assets/hulul-logo.png'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001'
const AUTH_STORAGE_KEY = 'hulul.portal.session'
const STALE_SESSION_ERROR = 'STALE_SESSION_ERROR'

const navItems = [
  { label: 'Inicio', icon: Home },
  { label: 'Venta', icon: ShoppingCart },
  { label: 'Productos', icon: PackageSearch },
  { label: 'Catalogos', icon: Tags },
  { label: 'Inventario', icon: Boxes },
  { label: 'Clientes', icon: Users },
  { label: 'Usuarios', icon: UserCog },
  { label: 'Proveedores', icon: ClipboardList },
  { label: 'Compras', icon: ClipboardList },
  { label: 'Caja', icon: CreditCard },
  { label: 'Bitacora', icon: ClipboardList },
  { label: 'Configuracion', icon: Settings },
  { label: 'Reportes', icon: BarChart3 },
]

type BusinessSummary = {
  id: string
  commercial_name?: string
  status?: string
  role?: string
}

type AdminBusiness = {
  id: string
  commercial_name: string
  legal_name?: string | null
  rfc?: string | null
  status: 'active' | 'suspended' | 'cancelled'
  license_status?: string | null
  branches_count: number
  primary_contact_name?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  trial_ends_at?: string | null
  license_expires_at?: string | null
}

type AdminBusinessForm = {
  commercial_name: string
  legal_name: string
  rfc: string
  primary_contact_name: string
  phone: string
  whatsapp: string
  email: string
  status: AdminBusiness['status']
  license_status: 'trial' | 'active' | 'suspended' | 'cancelled'
  trial_ends_at: string
  license_expires_at: string
}

type AdminCashRegister = {
  id: string
  name: string
  code: string
  active: boolean
  ticket_size: number
}

type AdminBranch = {
  id: string
  name: string
  code: string
  address?: string | null
  timezone: string
  currency: string
  active: boolean
  operational_day_start_minute: number
  inventory_products_count: number
  cash_registers: AdminCashRegister[]
}

type AdminBranchAssignment = {
  id?: string
  branch_id: string
  branch_name?: string
  role: 'manager' | 'cashier' | 'warehouse'
  active: boolean
}

type AdminBusinessUser = {
  membership_id: string
  id: string
  name: string
  email: string
  role: 'owner' | 'member'
  active: boolean
  membership_active: boolean
  branch_assignments: AdminBranchAssignment[]
}

type AdminBusinessDetail = AdminBusiness & {
  branches: AdminBranch[]
  users: AdminBusinessUser[]
}

type AdminBranchForm = {
  name: string
  code: string
  address: string
  timezone: string
  currency: string
  active: boolean
  operational_day_start_minute: string
  cash_register_name: string
  cash_register_code: string
  ticket_size: string
}

type AdminUserForm = {
  membership_id: string
  name: string
  email: string
  password: string
  access_type: 'owner' | 'member'
  active: boolean
  branch_assignments: AdminBranchAssignment[]
}

type ProfileForm = {
  name: string
  email: string
  current_password: string
  password: string
  password_confirmation: string
}

type AuthUser = {
  id: string
  name: string
  email: string
}

type AuthSession = {
  token: string
  user: AuthUser
  default_business_id: string
  active_business_id?: string
  businesses: BusinessSummary[]
}

type PortalContext = {
  business: {
    id: string
    commercial_name: string
    legal_name?: string | null
    rfc?: string | null
    primary_contact_name?: string | null
    phone?: string | null
    whatsapp?: string | null
    email?: string | null
    status: string
    license_status: string
  }
  setup: {
    complete: boolean
    missing: string[]
  }
  company_setup: {
    complete: boolean
    missing: string[]
  }
  branch_setup: {
    complete: boolean
    missing: string[]
  }
  membership: {
    role: 'owner' | 'manager' | 'cashier' | 'warehouse' | null
    base_role: 'owner' | 'manager' | 'cashier' | 'warehouse'
    permissions: Permission[]
  }
  branches: Array<{
    id: string
    name: string
    code: string
    address?: string | null
    timezone: string
    currency: string
  }>
  branch: {
    id: string
    name: string
    code: string
    address?: string | null
    operational_day_start_minute?: number
  } | null
  cash_register: {
    id: string
    code: string
    current_folio_number: number
  } | null
  operator: {
    id: string
    name: string
    email?: string
  } | null
  cash_register_session: {
    id: string
    status: 'open' | 'pending_close' | 'closed'
    opened_at?: string
    closed_at?: string | null
    pending_close_at?: string | null
    opening_amount_cents: number
    expected_cash_cents: number
    counted_cash_cents?: number | null
    difference_cents?: number | null
    closing_notes?: string | null
    forced_closed?: boolean
    force_close_reason?: string | null
    opened_by: {
      id: string
      name: string
    }
    closed_by?: {
      id: string
      name: string
    } | null
  } | null
}

type Product = {
  id: string
  sku: string
  barcode?: string | null
  name: string
  short_description?: string | null
  category_id?: string
  category?: string
  brand_id?: string | null
  brand?: string | null
  allows_fractional_sale?: boolean
  sale_price_cents: number
  current_cost_cents?: number | null
  tax_mode?: 'included' | 'zero' | 'exempt'
  tax_rate?: string
  minimum_stock?: string
  location?: string
  aisle_location?: string | null
  shelf_location?: string | null
  bin_location?: string | null
  stock_quantity: string
  stock_status: 'ok' | 'low' | 'out'
  base_unit: {
    id?: string
    abbreviation: string
  }
  active?: boolean
}

type CartItem = {
  product: Product
  quantity: number
}

type CatalogOption = {
  id: string
  name: string
  abbreviation?: string
  active: boolean
}

type Catalogs = {
  categories: CatalogOption[]
  brands: CatalogOption[]
  units: CatalogOption[]
}

type CatalogSection = 'categories' | 'brands' | 'units'

type CatalogForm = {
  id?: string
  name: string
  abbreviation: string
  active: boolean
}

type Customer = {
  id: string
  customer_type: 'person' | 'company'
  commercial_name: string
  legal_name?: string | null
  rfc?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  contact_name?: string | null
  active: boolean
  notes?: string | null
  public_customer?: boolean
}

type CustomerForm = {
  id?: string
  customer_type: 'person' | 'company'
  commercial_name: string
  legal_name: string
  rfc: string
  phone: string
  whatsapp: string
  email: string
  address: string
  contact_name: string
  active: boolean
  notes: string
}

type Supplier = {
  id: string
  commercial_name: string
  legal_name?: string | null
  rfc?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  contact_name?: string | null
  address?: string | null
  delivery_days?: string | null
  payment_terms?: string | null
  active: boolean
  notes?: string | null
}

type SupplierForm = {
  id?: string
  commercial_name: string
  legal_name: string
  rfc: string
  phone: string
  whatsapp: string
  email: string
  contact_name: string
  address: string
  delivery_days: string
  payment_terms: string
  active: boolean
  notes: string
}

type PortalUser = {
  id: string
  name: string
  email: string
  role: 'owner' | 'member'
  branch_assignments: AdminBranchAssignment[]
  active: boolean
  user_active: boolean
  membership_active: boolean
  created_at: string
}

type UserRole = 'owner' | 'member' | 'manager' | 'cashier' | 'warehouse' | 'hulul_admin' | 'hulul_support'
type Permission =
  | 'manage_business_settings'
  | 'manage_branch_settings'
  | 'manage_users'
  | 'manage_catalogs'
  | 'manage_products'
  | 'manage_customers'
  | 'manage_suppliers'
  | 'create_sale'
  | 'cancel_sale'
  | 'open_cash_register'
  | 'close_cash_register'
  | 'create_cash_movement'
  | 'adjust_inventory'
  | 'manage_purchases'
  | 'cancel_purchase'
  | 'view_audit_events'

type AuditEvent = {
  id: string
  event_type: string
  auditable_type: string
  auditable_id: string
  metadata: Record<string, unknown>
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
  actor?: {
    id: string
    name: string
    email?: string
  } | null
}

type PortalUserForm = {
  id?: string
  name: string
  email: string
  password: string
  access_type: 'owner' | 'member'
  active: boolean
  branch_assignments: AdminBranchAssignment[]
}

type SettingsForm = {
  commercial_name: string
  legal_name: string
  rfc: string
  primary_contact_name: string
  phone: string
  whatsapp: string
  email: string
  branch_name: string
  branch_address: string
}

type OnboardingStep = {
  key: 'branch' | 'unit' | 'category' | 'product' | 'supplier' | 'stock' | 'cash'
  label: string
  complete: boolean
  actionLabel: string
  view: 'Configuracion' | 'Catalogos' | 'Productos' | 'Proveedores' | 'Compras' | 'Inventario' | 'Caja'
}

type Purchase = {
  id: string
  folio: string
  status: string
  purchased_at: string
  cancelled_at?: string | null
  cancellation_reason?: string | null
  invoice_reference?: string | null
  notes?: string | null
  total_cents: number
  branch: {
    id: string
    name: string
    code: string
  }
  supplier: {
    id: string
    commercial_name: string
  }
  created_by: {
    id: string
    name: string
  }
  cancelled_by?: {
    id: string
    name: string
  } | null
  items: Array<{
    id: string
    product: {
      id: string
      sku: string
      name: string
    }
    unit: string
    quantity: string
    unit_cost_cents: number
    total_cents: number
  }>
}

type PurchaseDraftItem = {
  product_id: string
  quantity: string
  unit_cost: string
}

type PurchaseForm = {
  supplier_id: string
  purchased_at: string
  invoice_reference: string
  notes: string
  items: PurchaseDraftItem[]
}

type ImportPreviewRow = {
  row_number: number
  sku: string
  name: string
  category_name: string
  unit_name: string
  sale_price: string
  opening_stock: string
  errors: string[]
}

type ProductForm = {
  id?: string
  name: string
  sku: string
  barcode: string
  category_id: string
  brand_id: string
  base_unit_id: string
  sale_price: string
  current_cost: string
  tax_mode: 'included' | 'zero' | 'exempt'
  tax_rate: string
  minimum_stock: string
  aisle_location: string
  shelf_location: string
  bin_location: string
  allows_fractional_sale: boolean
  active: boolean
}

type InventoryMovement = {
  id: string
  movement_type: string
  quantity: string
  signed_base_quantity: string
  unit_cost_cents?: number | null
  reason?: string | null
  created_at: string
  product: {
    id: string
    sku: string
    name: string
  }
  unit: {
    abbreviation: string
  }
  created_by?: {
    name: string
  } | null
}

type InventoryForm = {
  product_id: string
  movement_type: 'initial_stock' | 'purchase_receipt' | 'positive_adjustment' | 'negative_adjustment' | 'waste'
  quantity: string
  unit_cost: string
  reason: string
}

type CashMovement = {
  id: string
  movement_type: 'opening' | 'sale_cash_payment' | 'credit_payment' | 'cash_out' | 'refund' | 'closing_adjustment' | 'forced_closure'
  amount_cents: number
  reason?: string | null
  created_at: string
  cash_register_session_id: string
  branch: {
    id: string
    name: string
    code: string
  }
  created_by?: {
    id: string
    name: string
  } | null
}

type CashMovementForm = {
  movement_type: 'cash_out' | 'credit_payment'
  amount: string
  reason: string
}

type CashCloseForm = {
  counted_cash: string
  closing_notes: string
  force_close_reason: string
}

type CheckoutMethod = 'cash' | 'card' | 'transfer' | 'mixed'

type CheckoutForm = {
  customer_id: string
  method: CheckoutMethod
  cash_received: string
  card_reference: string
  transfer_reference: string
  mixed_cash_amount: string
  mixed_cash_received: string
  mixed_card_amount: string
  mixed_card_reference: string
  mixed_transfer_amount: string
  mixed_transfer_reference: string
}

type CompletedSale = {
  id: string
  folio: string
  status: string
  sale_type: string
  total_cents: number
  subtotal_cents: number
  tax_cents: number
  created_at: string
  cancelled_at?: string | null
  cancellation_reason?: string | null
  customer?: {
    id: string
    commercial_name: string
  } | null
  cashier: {
    id: string
    name: string
  }
  cancelled_by?: {
    id: string
    name: string
  } | null
  items: Array<{
    id: string
    sku: string
    product_name: string
    quantity: string
    unit: string
    total_cents: number
  }>
  payments: Array<{
    id: string
    payment_method: string
    amount_cents: number
    received_amount_cents: number
    change_amount_cents: number
    reference?: string | null
  }>
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(cents / 100)
}

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2)
}

function centsToInput(cents?: number | null) {
  if (cents == null) return ''
  return (cents / 100).toFixed(2)
}

function moneyInputToCents(value: string) {
  return Math.round(Number(value || 0) * 100)
}

const emptyProductForm: ProductForm = {
  name: '',
  sku: '',
  barcode: '',
  category_id: '',
  brand_id: '',
  base_unit_id: '',
  sale_price: '',
  current_cost: '',
  tax_mode: 'included',
  tax_rate: '16',
  minimum_stock: '0',
  aisle_location: '',
  shelf_location: '',
  bin_location: '',
  allows_fractional_sale: false,
  active: true,
}

const emptyCatalogForm: CatalogForm = {
  name: '',
  abbreviation: '',
  active: true,
}

const emptyCustomerForm: CustomerForm = {
  customer_type: 'person',
  commercial_name: '',
  legal_name: '',
  rfc: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  contact_name: '',
  active: true,
  notes: '',
}

const emptySupplierForm: SupplierForm = {
  commercial_name: '',
  legal_name: '',
  rfc: '',
  phone: '',
  whatsapp: '',
  email: '',
  contact_name: '',
  address: '',
  delivery_days: '',
  payment_terms: '',
  active: true,
  notes: '',
}

const emptyPortalUserForm: PortalUserForm = {
  name: '',
  email: '',
  password: '',
  access_type: 'member',
  active: true,
  branch_assignments: [],
}

const roleLabels: Record<UserRole, string> = {
  owner: 'Propietario',
  member: 'Usuario de sucursal',
  manager: 'Gerente',
  cashier: 'Cajero',
  warehouse: 'Almacén',
  hulul_admin: 'Admin Hulul',
  hulul_support: 'Soporte Hulul',
}

const rolePermissions: Record<UserRole, Permission[]> = {
  owner: [
    'manage_business_settings',
    'manage_branch_settings',
    'manage_users',
    'manage_catalogs',
    'manage_products',
    'manage_customers',
    'manage_suppliers',
    'create_sale',
    'cancel_sale',
    'open_cash_register',
    'close_cash_register',
    'create_cash_movement',
    'adjust_inventory',
    'manage_purchases',
    'cancel_purchase',
    'view_audit_events',
  ],
  member: [],
  manager: [
    'manage_branch_settings',
    'manage_catalogs',
    'manage_products',
    'manage_customers',
    'manage_suppliers',
    'create_sale',
    'cancel_sale',
    'open_cash_register',
    'close_cash_register',
    'create_cash_movement',
    'adjust_inventory',
    'manage_purchases',
    'cancel_purchase',
    'view_audit_events',
  ],
  cashier: ['create_sale', 'open_cash_register', 'manage_customers'],
  warehouse: ['manage_catalogs', 'manage_products', 'adjust_inventory', 'manage_suppliers', 'manage_purchases', 'view_audit_events'],
  hulul_admin: [
    'manage_business_settings',
    'manage_branch_settings',
    'manage_users',
    'manage_catalogs',
    'manage_products',
    'manage_customers',
    'manage_suppliers',
    'create_sale',
    'cancel_sale',
    'open_cash_register',
    'close_cash_register',
    'create_cash_movement',
    'adjust_inventory',
    'manage_purchases',
    'cancel_purchase',
    'view_audit_events',
  ],
  hulul_support: [
    'manage_business_settings',
    'manage_branch_settings',
    'manage_catalogs',
    'manage_products',
    'manage_customers',
    'manage_suppliers',
    'create_sale',
    'cancel_sale',
    'open_cash_register',
    'close_cash_register',
    'create_cash_movement',
    'adjust_inventory',
    'manage_purchases',
    'cancel_purchase',
    'view_audit_events',
  ],
}

const navPermissions: Partial<Record<string, Permission[]>> = {
  Venta: ['create_sale'],
  Productos: ['manage_products'],
  Catalogos: ['manage_catalogs'],
  Inventario: ['adjust_inventory'],
  Clientes: ['manage_customers'],
  Usuarios: ['manage_users'],
  Proveedores: ['manage_suppliers'],
  Compras: ['manage_purchases'],
  Caja: ['open_cash_register', 'close_cash_register', 'create_cash_movement'],
  Bitacora: ['view_audit_events'],
  Configuracion: ['manage_business_settings', 'manage_branch_settings'],
  Reportes: ['view_audit_events'],
}

function permissionsAllowView(label: string, permissions: Permission[]) {
  const required = navPermissions[label]
  return !required || required.some((permission) => permissions.includes(permission))
}

function businessStatusText(status?: string) {
  if (status === 'suspended') return 'Suspendida'
  if (status === 'cancelled') return 'Cancelada'

  return 'Activa'
}

function auditEventText(eventType: string) {
  const labels: Record<string, string> = {
    'business.status_updated': 'Estado de empresa actualizado',
    'business.settings_updated': 'Configuracion de empresa actualizada',
    'membership.created': 'Usuario agregado al negocio',
    'membership.updated': 'Usuario o rol actualizado',
    'product.created': 'Producto creado',
    'product.updated': 'Producto actualizado',
    'products.imported': 'Importacion de productos',
    'catalog.created': 'Catalogo creado',
    'catalog.updated': 'Catalogo actualizado',
    'customer.created': 'Cliente creado',
    'customer.updated': 'Cliente actualizado',
    'supplier.created': 'Proveedor creado',
    'supplier.updated': 'Proveedor actualizado',
    'sale.cancelled': 'Venta cancelada',
    'purchase.cancelled': 'Compra anulada',
    'cash_register_session.force_closed': 'Cierre forzado de caja',
  }

  return labels[eventType] || eventType
}

function auditMetadataSummary(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata).filter(([, value]) => value !== null && value !== undefined && value !== '')
  if (entries.length === 0) return 'Sin detalle adicional'

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
    .join(' | ')
}

const emptySettingsForm: SettingsForm = {
  commercial_name: '',
  legal_name: '',
  rfc: '',
  primary_contact_name: '',
  phone: '',
  whatsapp: '',
  email: '',
  branch_name: '',
  branch_address: '',
}

const emptyPurchaseItem: PurchaseDraftItem = {
  product_id: '',
  quantity: '',
  unit_cost: '',
}

const emptyPurchaseForm: PurchaseForm = {
  supplier_id: '',
  purchased_at: new Date().toISOString().slice(0, 16),
  invoice_reference: '',
  notes: '',
  items: [emptyPurchaseItem],
}

const emptyInventoryForm: InventoryForm = {
  product_id: '',
  movement_type: 'positive_adjustment',
  quantity: '',
  unit_cost: '',
  reason: '',
}

const inventoryMovementLabels: Record<string, string> = {
  initial_stock: 'Stock inicial',
  purchase_receipt: 'Entrada',
  positive_adjustment: 'Ajuste +',
  negative_adjustment: 'Ajuste -',
  waste: 'Merma',
  sale: 'Venta',
  sale_cancellation: 'Cancelacion',
}

const cashMovementLabels: Record<CashMovement['movement_type'], string> = {
  opening: 'Apertura',
  sale_cash_payment: 'Cobro venta',
  credit_payment: 'Abono credito',
  cash_out: 'Salida',
  refund: 'Reembolso',
  closing_adjustment: 'Ajuste cierre',
  forced_closure: 'Cierre forzado',
}

const emptyCashMovementForm: CashMovementForm = {
  movement_type: 'cash_out',
  amount: '',
  reason: '',
}

const emptyCashCloseForm: CashCloseForm = {
  counted_cash: '',
  closing_notes: '',
  force_close_reason: '',
}

const emptyCheckoutForm: CheckoutForm = {
  customer_id: '',
  method: 'cash',
  cash_received: '',
  card_reference: '',
  transfer_reference: '',
  mixed_cash_amount: '',
  mixed_cash_received: '',
  mixed_card_amount: '',
  mixed_card_reference: '',
  mixed_transfer_amount: '',
  mixed_transfer_reference: '',
}

const emptyAdminBusinessForm: AdminBusinessForm = {
  commercial_name: '',
  legal_name: '',
  rfc: '',
  primary_contact_name: '',
  phone: '',
  whatsapp: '',
  email: '',
  status: 'active',
  license_status: 'trial',
  trial_ends_at: '',
  license_expires_at: '',
}

const emptyAdminBranchForm: AdminBranchForm = {
  name: '',
  code: '',
  address: '',
  timezone: 'America/Mexico_City',
  currency: 'MXN',
  active: true,
  operational_day_start_minute: '00:00',
  cash_register_name: 'Caja principal',
  cash_register_code: '001',
  ticket_size: '80',
}

const emptyAdminUserForm: AdminUserForm = {
  membership_id: '',
  name: '',
  email: '',
  password: '',
  access_type: 'member',
  active: true,
  branch_assignments: [],
}

const emptyProfileForm: ProfileForm = {
  name: '',
  email: '',
  current_password: '',
  password: '',
  password_confirmation: '',
}

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}

function minutesToTime(value?: number | null) {
  const totalMinutes = Math.min(1439, Math.max(0, Number(value) || 0))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function timeToMinutes(value: string) {
  const [hours = '0', minutes = '0'] = value.split(':')
  return Math.min(1439, Math.max(0, Number(hours) * 60 + Number(minutes)))
}

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null

    try {
      const parsed = JSON.parse(stored) as AuthSession
      return {
        ...parsed,
        active_business_id: parsed.active_business_id || parsed.default_business_id || parsed.businesses[0]?.id,
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
  })
  const [loginEmail, setLoginEmail] = useState('luis.buendia@hulul.com.mx')
  const [loginPassword, setLoginPassword] = useState('Abc123456')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState('Venta')
  const [portalContext, setPortalContext] = useState<PortalContext | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'offline'>('loading')
  const [isCharging, setIsCharging] = useState(false)
  const [saleMessage, setSaleMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [catalogs, setCatalogs] = useState<Catalogs>({ categories: [], brands: [], units: [] })
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [productSection, setProductSection] = useState<'products' | 'catalogs' | 'import'>('products')
  const [productMode, setProductMode] = useState<'list' | 'form'>('list')
  const [productFilter, setProductFilter] = useState<'all' | 'low' | 'out' | 'inactive'>('all')
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [brandQuery, setBrandQuery] = useState('')
  const [isQuickAddingBrand, setIsQuickAddingBrand] = useState(false)
  const [catalogType, setCatalogType] = useState<CatalogSection>('categories')
  const [catalogForm, setCatalogForm] = useState<CatalogForm>(emptyCatalogForm)
  const [isSavingCatalog, setIsSavingCatalog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreviewRows, setImportPreviewRows] = useState<ImportPreviewRow[]>([])
  const [importPreviewErrors, setImportPreviewErrors] = useState<string[]>([])
  const [isPreviewingImport, setIsPreviewingImport] = useState(false)
  const [isImportingProducts, setIsImportingProducts] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerMode, setCustomerMode] = useState<'list' | 'form'>('list')
  const [customerFilter, setCustomerFilter] = useState<'all' | 'inactive'>('all')
  const [customerQuery, setCustomerQuery] = useState('')
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm)
  const [isSavingCustomer, setIsSavingCustomer] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierMode, setSupplierMode] = useState<'list' | 'form'>('list')
  const [supplierFilter, setSupplierFilter] = useState<'all' | 'inactive'>('all')
  const [supplierQuery, setSupplierQuery] = useState('')
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(emptySupplierForm)
  const [isSavingSupplier, setIsSavingSupplier] = useState(false)
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([])
  const [activePortalBranchId, setActivePortalBranchId] = useState('')
  const [portalUserMode, setPortalUserMode] = useState<'list' | 'form'>('list')
  const [portalUserFilter, setPortalUserFilter] = useState<'all' | 'inactive'>('all')
  const [portalUserQuery, setPortalUserQuery] = useState('')
  const [portalUserForm, setPortalUserForm] = useState<PortalUserForm>(emptyPortalUserForm)
  const [isSavingPortalUser, setIsSavingPortalUser] = useState(false)
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(emptySettingsForm)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [purchaseMode, setPurchaseMode] = useState<'list' | 'form'>('list')
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(emptyPurchaseForm)
  const [isSavingPurchase, setIsSavingPurchase] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [purchaseCancelReason, setPurchaseCancelReason] = useState('')
  const [isCancellingPurchase, setIsCancellingPurchase] = useState(false)
  const [saleView, setSaleView] = useState<'pos' | 'history' | 'detail'>('pos')
  const [saleStage, setSaleStage] = useState<'cart' | 'payment' | 'success'>('cart')
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(emptyCheckoutForm)
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const [sales, setSales] = useState<CompletedSale[]>([])
  const [saleHistoryQuery, setSaleHistoryQuery] = useState('')
  const [selectedSale, setSelectedSale] = useState<CompletedSale | null>(null)
  const [saleCancelReason, setSaleCancelReason] = useState('')
  const [isCancellingSale, setIsCancellingSale] = useState(false)
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([])
  const [inventoryMode, setInventoryMode] = useState<'stock' | 'movement' | 'history'>('stock')
  const [inventoryForm, setInventoryForm] = useState<InventoryForm>(emptyInventoryForm)
  const [isSavingInventoryMovement, setIsSavingInventoryMovement] = useState(false)
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([])
  const [cashMode, setCashMode] = useState<'summary' | 'open' | 'movement' | 'close'>('summary')
  const [cashOpeningAmount, setCashOpeningAmount] = useState('')
  const [cashMovementForm, setCashMovementForm] = useState<CashMovementForm>(emptyCashMovementForm)
  const [cashCloseForm, setCashCloseForm] = useState<CashCloseForm>(emptyCashCloseForm)
  const [isSavingCashAction, setIsSavingCashAction] = useState(false)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [adminBusinesses, setAdminBusinesses] = useState<AdminBusiness[]>([])
  const [adminBusinessQuery, setAdminBusinessQuery] = useState('')
  const [isLoadingAdminBusinesses, setIsLoadingAdminBusinesses] = useState(false)
  const [isUpdatingAdminBusinessId, setIsUpdatingAdminBusinessId] = useState<string | null>(null)
  const [adminBusinessEditorId, setAdminBusinessEditorId] = useState<string | null>(null)
  const [adminBusinessForm, setAdminBusinessForm] = useState<AdminBusinessForm>(emptyAdminBusinessForm)
  const [isSavingAdminBusiness, setIsSavingAdminBusiness] = useState(false)
  const [adminBusinessDetail, setAdminBusinessDetail] = useState<AdminBusinessDetail | null>(null)
  const [adminDetailTab, setAdminDetailTab] = useState<'summary' | 'branches' | 'users' | 'license'>('summary')
  const [isLoadingAdminBusinessDetail, setIsLoadingAdminBusinessDetail] = useState(false)
  const [adminBranchEditorId, setAdminBranchEditorId] = useState<string | null>(null)
  const [adminBranchForm, setAdminBranchForm] = useState<AdminBranchForm>(emptyAdminBranchForm)
  const [isSavingAdminBranch, setIsSavingAdminBranch] = useState(false)
  const [adminUserEditorId, setAdminUserEditorId] = useState<string | null>(null)
  const [adminUserForm, setAdminUserForm] = useState<AdminUserForm>(emptyAdminUserForm)
  const [isSavingAdminUser, setIsSavingAdminUser] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const activeBusinessId = authSession?.active_business_id || authSession?.default_business_id || authSession?.businesses[0]?.id
  const selectedBusiness = authSession?.businesses.find((item) => item.id === activeBusinessId) || authSession?.businesses[0]
  const canSwitchBusiness = (authSession?.businesses.length || 0) > 1
  const activeRole = portalContext?.membership.role || selectedBusiness?.role
  const canAccessAdmin = authSession?.businesses.some((business) => business.role === 'hulul_admin' || business.role === 'hulul_support') ?? false
  const canManageAdminBusinesses = authSession?.businesses.some((business) => business.role === 'hulul_admin') ?? false
  const isInternalConsole = Boolean(
    authSession?.businesses.length &&
    authSession.businesses.every((business) => business.role === 'hulul_admin' || business.role === 'hulul_support'),
  )
  const activePermissions = portalContext?.membership.permissions || (activeRole && activeRole in rolePermissions ? rolePermissions[activeRole as UserRole] : [])
  const can = useCallback((permission: Permission) => activePermissions.includes(permission), [activePermissions])
  const portalNavItems = navItems.filter((item) => permissionsAllowView(item.label, activePermissions))
  const visibleNavItems = isInternalConsole
    ? [{ label: 'Admin Hulul', icon: Building2 }, { label: 'Mi perfil', icon: UserCog }]
    : canAccessAdmin
      ? [{ label: 'Admin Hulul', icon: Building2 }, ...portalNavItems]
      : portalNavItems

  const apiFetch = useCallback((path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    if (authSession?.token) headers.set('Authorization', `Bearer ${authSession.token}`)
    if (activePortalBranchId) headers.set('X-Branch-ID', activePortalBranchId)

    return fetch(path, {
      ...init,
      headers,
    })
  }, [activePortalBranchId, authSession])

  const resetPortalState = useCallback(() => {
    setPortalContext(null)
    setCustomers([])
    setSuppliers([])
    setPortalUsers([])
    setPurchases([])
    setSelectedPurchase(null)
    setPurchaseCancelReason('')
    setProducts([])
    setCatalogs({ categories: [], brands: [], units: [] })
    setSettingsForm(emptySettingsForm)
    setInventoryMovements([])
    setCashMovements([])
    setSales([])
    setAuditEvents([])
    setCartItems([])
    setCompletedSale(null)
    setSaleStage('cart')
    setSaleView('pos')
    setApiStatus('loading')
  }, [])

  const invalidateStoredSession = useCallback((message?: string) => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthSession(null)
    resetPortalState()
    if (message) setLoginError(message)
  }, [resetPortalState])

  const loadAdminBusinesses = useCallback(async () => {
    setIsLoadingAdminBusinesses(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/businesses`)
      if (response.status === 401) throw new Error(STALE_SESSION_ERROR)
      if (response.status === 403) throw new Error('No tienes acceso al administrador Hulul.')
      if (!response.ok) throw new Error('No se pudieron cargar empresas.')

      setAdminBusinesses((await response.json()) as AdminBusiness[])
    } catch (error) {
      if (error instanceof Error && error.message === STALE_SESSION_ERROR) {
        invalidateStoredSession('La sesion guardada ya no coincide con la base actual. Inicia sesion de nuevo.')
        return
      }

      setSaleMessage(error instanceof Error ? error.message : 'No se pudieron cargar empresas.')
    } finally {
      setIsLoadingAdminBusinesses(false)
    }
  }, [apiFetch, invalidateStoredSession])

  async function openAdminBusinessDetail(businessId: string, tab: typeof adminDetailTab = 'summary') {
    setIsLoadingAdminBusinessDetail(true)
    setSaleMessage(null)
    setAdminBusinessEditorId(null)
    setAdminBranchEditorId(null)
    setAdminUserEditorId(null)
    setAdminDetailTab(tab)
    setActiveView('Detalle empresa')

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/businesses/${businessId}`)
      const body = await response.json()
      if (response.status === 401) throw new Error(STALE_SESSION_ERROR)
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo cargar la empresa.')
      setAdminBusinessDetail(body as AdminBusinessDetail)
    } catch (error) {
      if (error instanceof Error && error.message === STALE_SESSION_ERROR) {
        invalidateStoredSession('La sesion guardada ya no coincide con la base actual. Inicia sesion de nuevo.')
        return
      }
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo cargar la empresa.')
    } finally {
      setIsLoadingAdminBusinessDetail(false)
    }
  }

  const loadPortalData = useCallback(async () => {
    if (!authSession) throw new Error('No active session')

    const business = selectedBusiness
    if (!business) throw new Error('No business assigned')

    const selectedBranchQuery = activePortalBranchId ? `?branch_id=${encodeURIComponent(activePortalBranchId)}` : ''
    const contextResponse = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/context${selectedBranchQuery}`)
    if (contextResponse.status === 401 || contextResponse.status === 403 || contextResponse.status === 404) {
      throw new Error(STALE_SESSION_ERROR)
    }
    if (!contextResponse.ok) throw new Error('Could not load portal context')

    const context = (await contextResponse.json()) as PortalContext
    const cashMovementsUrl = context.cash_register_session
      ? `${API_BASE_URL}/api/portal/businesses/${business.id}/cash_movements?cash_register_session_id=${context.cash_register_session.id}`
      : `${API_BASE_URL}/api/portal/businesses/${business.id}/cash_movements`

    const [customersResponse, suppliersResponse, usersResponse, purchasesResponse, productsResponse, catalogsResponse, movementsResponse, cashMovementsResponse, salesResponse] = await Promise.all([
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/customers`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/suppliers`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/users`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/purchases${selectedBranchQuery}`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/products${selectedBranchQuery}`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/catalogs`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/inventory_movements${selectedBranchQuery}`),
      apiFetch(cashMovementsUrl),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/sales${selectedBranchQuery}`),
    ])
    if (!customersResponse.ok) throw new Error('Could not load customers')
    if (!suppliersResponse.ok) throw new Error('Could not load suppliers')
    if (!usersResponse.ok) throw new Error('Could not load users')
    if (!purchasesResponse.ok) throw new Error('Could not load purchases')
    if (!productsResponse.ok) throw new Error('Could not load products')
    if (!catalogsResponse.ok) throw new Error('Could not load catalogs')
    if (!movementsResponse.ok) throw new Error('Could not load inventory movements')
    if (!cashMovementsResponse.ok) throw new Error('Could not load cash movements')
    if (!salesResponse.ok) throw new Error('Could not load sales')

    const loadedCustomers = (await customersResponse.json()) as Customer[]
    const loadedSuppliers = (await suppliersResponse.json()) as Supplier[]
    const loadedPortalUsers = (await usersResponse.json()) as PortalUser[]
    const loadedPurchases = (await purchasesResponse.json()) as Purchase[]
    const loadedProducts = (await productsResponse.json()) as Product[]
    const loadedCatalogs = (await catalogsResponse.json()) as Catalogs
    const loadedMovements = (await movementsResponse.json()) as InventoryMovement[]
    const loadedCashMovements = (await cashMovementsResponse.json()) as CashMovement[]
    const loadedSales = (await salesResponse.json()) as CompletedSale[]
    let loadedAuditEvents: AuditEvent[] = []

    if (can('view_audit_events')) {
      const auditEventsResponse = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/audit_events`)
      if (!auditEventsResponse.ok) throw new Error('Could not load audit events')
      loadedAuditEvents = (await auditEventsResponse.json()) as AuditEvent[]
    }

    return {
      context,
      customers: loadedCustomers,
      suppliers: loadedSuppliers,
      portalUsers: loadedPortalUsers,
      purchases: loadedPurchases,
      products: loadedProducts,
      catalogs: loadedCatalogs,
      inventoryMovements: loadedMovements,
      cashMovements: loadedCashMovements,
      sales: loadedSales,
      auditEvents: loadedAuditEvents,
    }
  }, [activePortalBranchId, apiFetch, authSession, can, selectedBusiness])

  useEffect(() => {
    if (!authSession) {
      setApiStatus('loading')
      return
    }

    if (isInternalConsole) {
      setApiStatus('ready')
      return
    }

    let cancelled = false

    async function loadPortalContext() {
      try {
        const {
          context,
          customers: loadedCustomers,
          suppliers: loadedSuppliers,
          portalUsers: loadedPortalUsers,
          purchases: loadedPurchases,
          products: loadedProducts,
          catalogs: loadedCatalogs,
          inventoryMovements: loadedMovements,
          cashMovements: loadedCashMovements,
          sales: loadedSales,
          auditEvents: loadedAuditEvents,
        } = await loadPortalData()
        if (!cancelled) {
          setPortalContext(context)
          setActivePortalBranchId(context.branch?.id || '')
          setCustomers(loadedCustomers)
          setSuppliers(loadedSuppliers)
          setPortalUsers(loadedPortalUsers)
          setPurchases(loadedPurchases)
          setProducts(loadedProducts)
          setCatalogs(loadedCatalogs)
          setSettingsForm({
            commercial_name: context.business.commercial_name || '',
            legal_name: context.business.legal_name || '',
            rfc: context.business.rfc || '',
            primary_contact_name: context.business.primary_contact_name || '',
            phone: context.business.phone || '',
            whatsapp: context.business.whatsapp || '',
            email: context.business.email || '',
            branch_name: context.branch?.name || '',
            branch_address: context.branch?.address || '',
          })
          setInventoryMovements(loadedMovements)
          setCashMovements(loadedCashMovements)
          setSales(loadedSales)
          setAuditEvents(loadedAuditEvents)
          setProductForm((form) => ({
            ...form,
            category_id: form.category_id || loadedCatalogs.categories[0]?.id || '',
            brand_id: form.brand_id || loadedCatalogs.brands[0]?.id || '',
            base_unit_id: form.base_unit_id || loadedCatalogs.units[0]?.id || '',
          }))
          setInventoryForm((form) => ({
            ...form,
            product_id: form.product_id || loadedProducts[0]?.id || '',
          }))
          setCashCloseForm((form) => ({
            ...form,
            counted_cash: form.counted_cash || centsToInput(context.cash_register_session?.expected_cash_cents),
          }))
          const onboardingReady =
            context.branch_setup.complete &&
            loadedCatalogs.units.length > 0 &&
            loadedCatalogs.categories.length > 0 &&
            loadedProducts.length > 0 &&
            loadedProducts.some((product) => Number(product.stock_quantity) > 0 && product.active !== false) &&
            context.cash_register_session?.status === 'open'
          const canManageSetup = context.membership.permissions.includes('manage_branch_settings')
          setActiveView((currentView) => {
            if (currentView === 'Admin Hulul') return currentView
            if (!permissionsAllowView(currentView, context.membership.permissions)) return 'Inicio'
            // Keep setup destinations reachable while onboarding is incomplete. The
            // onboarding action changes the current view first; forcing every view
            // back to Configuracion here made actions such as "Crear unidad" loop.
            return !onboardingReady && canManageSetup && currentView === 'Venta'
              ? 'Configuracion'
              : currentView
          })
          if (!onboardingReady && activeView !== 'Admin Hulul') {
            setSaleMessage(canManageSetup
              ? 'Completa la configuracion operativa antes de vender.'
              : 'Esta sucursal todavia no esta lista para operar. Solicita la configuracion al propietario o gerente.')
          }
          setApiStatus('ready')
        }
      } catch (error) {
        if (cancelled) return

        if (error instanceof Error && error.message === STALE_SESSION_ERROR) {
          invalidateStoredSession('La sesion guardada ya no coincide con la base actual. Inicia sesion de nuevo.')
          return
        }

        setApiStatus('offline')
      }
    }

    void loadPortalContext()

    return () => {
      cancelled = true
    }
  }, [activeView, authSession, invalidateStoredSession, isInternalConsole, loadPortalData])

  useEffect(() => {
    if (!isInternalConsole) return

    setActiveView('Admin Hulul')
    setSaleMessage(null)
  }, [isInternalConsole])

  useEffect(() => {
    if (!authSession) return

    setProfileForm({
      ...emptyProfileForm,
      name: authSession.user.name,
      email: authSession.user.email,
    })
  }, [authSession])

  useEffect(() => {
    if (!authSession || activeView !== 'Admin Hulul' || !canAccessAdmin) return

    void loadAdminBusinesses()
  }, [activeView, authSession, canAccessAdmin, loadAdminBusinesses])

  async function handleLogin() {
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo iniciar sesion')

      const session = body as AuthSession
      const nextSession = {
        ...session,
        active_business_id: session.default_business_id || session.businesses[0]?.id,
      }
      const opensInternalConsole = session.businesses.length > 0 && session.businesses.every(
        (business) => business.role === 'hulul_admin' || business.role === 'hulul_support',
      )
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
      setAuthSession(nextSession)
      setActiveView(opensInternalConsole ? 'Admin Hulul' : 'Venta')
      setLoginError(null)
      setApiStatus('loading')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesion.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  function handleLogout() {
    invalidateStoredSession()
  }

  async function saveProfile() {
    if (!authSession || !profileForm.name.trim() || !profileForm.email.trim()) return

    setProfileMessage(null)
    setProfileError(null)

    if (profileForm.password && profileForm.password !== profileForm.password_confirmation) {
      setProfileError('La confirmacion de contrasena no coincide.')
      return
    }

    setIsSavingProfile(true)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileForm }),
      })
      const body = await response.json()
      if (response.status === 401) throw new Error(STALE_SESSION_ERROR)
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar el perfil.')

      const nextSession = {
        ...authSession,
        token: body.token as string,
        user: body.user as AuthUser,
      }
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
      setAuthSession(nextSession)
      setProfileMessage(profileForm.password ? 'Perfil y contrasena actualizados.' : 'Perfil actualizado.')
      setProfileForm((form) => ({
        ...form,
        current_password: '',
        password: '',
        password_confirmation: '',
      }))
    } catch (error) {
      if (error instanceof Error && error.message === STALE_SESSION_ERROR) {
        invalidateStoredSession('La sesion guardada ya no coincide con la base actual. Inicia sesion de nuevo.')
        return
      }

      setProfileError(error instanceof Error ? error.message : 'No se pudo guardar el perfil.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  function changeActiveBusiness(businessId: string) {
    if (!authSession || businessId === activeBusinessId) return
    if (!authSession.businesses.some((business) => business.id === businessId)) return

    const nextSession = {
      ...authSession,
      active_business_id: businessId,
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
    setAuthSession(nextSession)
    setActivePortalBranchId('')
    resetPortalState()
    setActiveView('Venta')
    setMobileMenuOpen(false)
    setSaleMessage(null)
  }

  function changeActivePortalBranch(branchId: string) {
    if (!portalContext?.branches.some((branch) => branch.id === branchId) || branchId === activePortalBranchId) return
    setActivePortalBranchId(branchId)
    resetPortalState()
    setActiveView('Inicio')
    setSaleMessage(null)
  }

  async function updateAdminBusinessStatus(business: AdminBusiness, status: AdminBusiness['status']) {
    if (!canManageAdminBusinesses || status === business.status) return

    setIsUpdatingAdminBusinessId(business.id)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: {
            status,
          },
        }),
      })
      const body = await response.json()
      if (response.status === 401) throw new Error(STALE_SESSION_ERROR)
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo actualizar empresa.')

      const updatedBusiness = body as AdminBusiness
      setAdminBusinesses((businesses) => businesses.map((item) => (item.id === updatedBusiness.id ? updatedBusiness : item)))
      setAuthSession((session) => {
        if (!session) return session

        const nextSession = {
          ...session,
          businesses: session.businesses.map((item) => (item.id === updatedBusiness.id ? { ...item, status: updatedBusiness.status } : item)),
        }
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
        return nextSession
      })
      setSaleMessage(`${updatedBusiness.commercial_name} ahora esta ${status === 'active' ? 'activa' : status === 'suspended' ? 'suspendida' : 'cancelada'}.`)
    } catch (error) {
      if (error instanceof Error && error.message === STALE_SESSION_ERROR) {
        invalidateStoredSession('La sesion guardada ya no coincide con la base actual. Inicia sesion de nuevo.')
        return
      }

      setSaleMessage(error instanceof Error ? error.message : 'No se pudo actualizar empresa.')
    } finally {
      setIsUpdatingAdminBusinessId(null)
    }
  }

  function openNewAdminBusiness() {
    setAdminBusinessForm(emptyAdminBusinessForm)
    setAdminBusinessEditorId('new')
    setActiveView('Nueva empresa')
    setSaleMessage(null)
  }

  function openAdminBusinessEditor(business: AdminBusiness) {
    setAdminBusinessForm({
      commercial_name: business.commercial_name || '',
      legal_name: business.legal_name || '',
      rfc: business.rfc || '',
      primary_contact_name: business.primary_contact_name || '',
      phone: business.phone || '',
      whatsapp: business.whatsapp || '',
      email: business.email || '',
      status: business.status,
      license_status: (business.license_status as AdminBusinessForm['license_status']) || 'trial',
      trial_ends_at: dateInputValue(business.trial_ends_at),
      license_expires_at: dateInputValue(business.license_expires_at),
    })
    setAdminBusinessEditorId(business.id)
    setActiveView('Editar empresa')
    setSaleMessage(null)
  }

  function closeAdminBusinessEditor() {
    if (isSavingAdminBusiness) return
    setAdminBusinessEditorId(null)
    setAdminBusinessForm(emptyAdminBusinessForm)
    setActiveView(adminBusinessDetail ? 'Detalle empresa' : 'Admin Hulul')
  }

  async function saveAdminBusiness() {
    if (!canManageAdminBusinesses || !adminBusinessEditorId || !adminBusinessForm.commercial_name.trim()) return

    const creating = adminBusinessEditorId === 'new'
    const endpoint = creating
      ? `${API_BASE_URL}/api/admin/businesses`
      : `${API_BASE_URL}/api/admin/businesses/${adminBusinessEditorId}`
    setIsSavingAdminBusiness(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(endpoint, {
        method: creating ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business: adminBusinessForm }),
      })
      const body = await response.json()
      if (response.status === 401) throw new Error(STALE_SESSION_ERROR)
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? `No se pudo ${creating ? 'crear' : 'actualizar'} la empresa.`)

      const savedBusiness = body as AdminBusiness
      setAdminBusinesses((businesses) => creating
        ? [...businesses, savedBusiness].sort((left, right) => left.commercial_name.localeCompare(right.commercial_name))
        : businesses.map((business) => (business.id === savedBusiness.id ? savedBusiness : business)))
      setSaleMessage(`${savedBusiness.commercial_name} ${creating ? 'fue creada' : 'fue actualizada'}.`)
      setAdminBusinessEditorId(null)
      setAdminBusinessForm(emptyAdminBusinessForm)
      void openAdminBusinessDetail(savedBusiness.id, creating ? 'branches' : adminDetailTab)
    } catch (error) {
      if (error instanceof Error && error.message === STALE_SESSION_ERROR) {
        invalidateStoredSession('La sesion guardada ya no coincide con la base actual. Inicia sesion de nuevo.')
        return
      }

      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar la empresa.')
    } finally {
      setIsSavingAdminBusiness(false)
    }
  }

  function openNewAdminBranch() {
    setAdminBranchForm(emptyAdminBranchForm)
    setAdminBranchEditorId('new')
    setSaleMessage(null)
  }

  function openAdminBranchEditor(branch: AdminBranch) {
    setAdminBranchForm({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      timezone: branch.timezone || 'America/Mexico_City',
      currency: branch.currency || 'MXN',
      active: branch.active,
      operational_day_start_minute: minutesToTime(branch.operational_day_start_minute),
      cash_register_name: '',
      cash_register_code: '',
      ticket_size: '80',
    })
    setAdminBranchEditorId(branch.id)
    setSaleMessage(null)
  }

  async function saveAdminBranch() {
    if (!adminBusinessDetail || !adminBranchEditorId || !adminBranchForm.name.trim() || !adminBranchForm.code.trim()) return
    const creating = adminBranchEditorId === 'new'
    const endpoint = creating
      ? `${API_BASE_URL}/api/admin/businesses/${adminBusinessDetail.id}/branches`
      : `${API_BASE_URL}/api/admin/businesses/${adminBusinessDetail.id}/branches/${adminBranchEditorId}`
    setIsSavingAdminBranch(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(endpoint, {
        method: creating ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: {
            name: adminBranchForm.name,
            code: adminBranchForm.code.toUpperCase(),
            address: adminBranchForm.address,
            timezone: adminBranchForm.timezone,
            currency: adminBranchForm.currency.toUpperCase(),
            active: adminBranchForm.active,
            operational_day_start_minute: timeToMinutes(adminBranchForm.operational_day_start_minute),
          },
          cash_register: creating ? {
            name: adminBranchForm.cash_register_name,
            code: adminBranchForm.cash_register_code,
            ticket_size: Number(adminBranchForm.ticket_size || 80),
            active: true,
          } : undefined,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar la sucursal.')
      const savedBranch = body as AdminBranch
      setAdminBusinessDetail((detail) => detail ? {
        ...detail,
        branches: creating
          ? [...detail.branches, savedBranch]
          : detail.branches.map((branch) => branch.id === savedBranch.id ? savedBranch : branch),
        branches_count: creating ? detail.branches_count + 1 : detail.branches_count,
      } : detail)
      setAdminBusinesses((businesses) => businesses.map((business) => business.id === adminBusinessDetail.id
        ? { ...business, branches_count: creating ? business.branches_count + 1 : business.branches_count }
        : business))
      setAdminBranchEditorId(null)
      setAdminBranchForm(emptyAdminBranchForm)
      setSaleMessage(`Sucursal ${savedBranch.name} ${creating ? 'creada' : 'actualizada'}.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar la sucursal.')
    } finally {
      setIsSavingAdminBranch(false)
    }
  }

  function openNewAdminUser() {
    setAdminUserForm(emptyAdminUserForm)
    setAdminUserEditorId('new')
    setSaleMessage(null)
  }

  function openAdminUserEditor(user: AdminBusinessUser) {
    setAdminUserForm({
      membership_id: user.membership_id,
      name: user.name,
      email: user.email,
      password: '',
      access_type: user.role === 'owner' ? 'owner' : 'member',
      active: user.membership_active,
      branch_assignments: user.branch_assignments,
    })
    setAdminUserEditorId(user.membership_id)
    setSaleMessage(null)
  }

  function toggleAdminUserBranch(branchId: string) {
    setAdminUserForm((form) => {
      const assigned = form.branch_assignments.some((assignment) => assignment.branch_id === branchId)
      return {
        ...form,
        branch_assignments: assigned
          ? form.branch_assignments.filter((assignment) => assignment.branch_id !== branchId)
          : [...form.branch_assignments, { branch_id: branchId, role: 'cashier', active: true }],
      }
    })
  }

  async function saveAdminUser() {
    if (!adminBusinessDetail || !adminUserEditorId || !adminUserForm.name.trim() || !adminUserForm.email.trim()) return
    const creating = adminUserEditorId === 'new'
    const endpoint = creating
      ? `${API_BASE_URL}/api/admin/businesses/${adminBusinessDetail.id}/users`
      : `${API_BASE_URL}/api/admin/businesses/${adminBusinessDetail.id}/users/${adminUserEditorId}`
    setIsSavingAdminUser(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(endpoint, {
        method: creating ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            name: adminUserForm.name,
            email: adminUserForm.email,
            ...(adminUserForm.password ? { password: adminUserForm.password } : {}),
          },
          membership: {
            role: adminUserForm.access_type,
            active: adminUserForm.active,
            branch_assignments: adminUserForm.access_type === 'owner' ? [] : adminUserForm.branch_assignments,
          },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar el usuario.')
      const savedUser = body as AdminBusinessUser
      setAdminBusinessDetail((detail) => detail ? {
        ...detail,
        users: creating
          ? [...detail.users, savedUser]
          : detail.users.map((user) => user.membership_id === savedUser.membership_id ? savedUser : user),
      } : detail)
      setAdminUserEditorId(null)
      setAdminUserForm(emptyAdminUserForm)
      setSaleMessage(`Usuario ${savedUser.name} ${creating ? 'creado' : 'actualizado'}.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar el usuario.')
    } finally {
      setIsSavingAdminUser(false)
    }
  }

  const businessName = portalContext?.business.commercial_name?.trim() || selectedBusiness?.commercial_name || 'Negocio sin configurar'
  const businessStatus = portalContext?.business.status || selectedBusiness?.status || 'active'
  const businessIsOperational = businessStatus === 'active'
  const businessStatusLabel = `Empresa ${businessStatusText(businessStatus).toLowerCase()}`
  const branchName = portalContext?.branch?.name?.trim() || 'Sucursal sin configurar'
  const branchCode = portalContext?.branch?.code ?? 'TOL'
  const cashRegisterCode = portalContext?.cash_register?.code ?? '001'
  const nextFolio = portalContext?.cash_register?.current_folio_number ?? 43
  const formattedFolio = `${branchCode}-${cashRegisterCode}-${String(nextFolio).padStart(6, '0')}`
  const cashSession = portalContext?.cash_register_session
  const cashStatus = cashSession?.status === 'open'
    ? 'Abierta'
    : cashSession?.status === 'pending_close'
      ? 'Pendiente de cierre'
      : 'Cerrada'
  const cashierName = cashSession?.opened_by.name ?? 'Sin cajero'
  const actingUser = portalContext?.operator ?? authSession?.user ?? null
  const actingUserId = actingUser?.id
  const operatorName = actingUser?.name ?? cashierName
  const expectedCash = cashSession ? formatMoney(cashSession.expected_cash_cents) : '$0.00'
  const recentCashMovements = cashMovements.slice(0, 8)
  const cashMovementCounts = {
    inflow: cashMovements
      .filter((movement) => movement.amount_cents > 0)
      .reduce((sum, movement) => sum + movement.amount_cents, 0),
    outflow: cashMovements
      .filter((movement) => movement.amount_cents < 0)
      .reduce((sum, movement) => sum + Math.abs(movement.amount_cents), 0),
  }
  const todayKey = new Date().toISOString().slice(0, 10)
  const todaysSales = sales.filter((sale) => sale.status === 'paid' && sale.created_at.slice(0, 10) === todayKey)
  const todaysSalesTotalCents = todaysSales.reduce((sum, sale) => sum + sale.total_cents, 0)
  const overdueCreditsCount = 0
  const overdueCreditsTotalCents = 0
  const lowStockCount = products.filter((product) => product.stock_status !== 'ok').length
  const operationalMetrics = [
    {
      label: 'Ventas hoy',
      value: formatMoney(todaysSalesTotalCents),
      detail: `${todaysSales.length} tickets`,
    },
    { label: 'Caja', value: cashStatus, detail: `${expectedCash} esperado` },
    { label: 'Stock bajo', value: String(lowStockCount), detail: 'productos por surtir' },
    {
      label: 'Creditos vencidos',
      value: String(overdueCreditsCount),
      detail: `${formatMoney(overdueCreditsTotalCents)} pendientes`,
    },
  ]
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const activeProducts = products.filter((product) => product.active !== false)
  const searchResults = activeProducts
    .filter((product) => {
      if (!normalizedSearchQuery) return product.stock_status !== 'out'

      return [product.sku, product.barcode, product.name]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearchQuery))
    })
    .slice(0, 5)
  const ticketItems = cartItems.map((item) => ({
    productId: item.product.id,
    sku: item.product.sku,
    name: item.product.name,
    stockQuantity: Number(item.product.stock_quantity),
    unit: item.product.base_unit.abbreviation,
    quantity: item.quantity,
    unitPrice: formatMoney(item.product.sale_price_cents),
    totalCents: Math.round(item.product.sale_price_cents * item.quantity),
    total: formatMoney(Math.round(item.product.sale_price_cents * item.quantity)),
  }))
  const ticketTotalCents = ticketItems.reduce((sum, item) => sum + item.totalCents, 0)
  const hasStockIssue = ticketItems.some((item) => item.quantity > item.stockQuantity)
  const checkoutBlockerMessage =
    apiStatus !== 'ready'
      ? apiStatus === 'loading'
        ? 'Cargando datos del POS.'
        : 'Sin conexion con el servidor.'
      : !businessIsOperational
        ? 'La empresa no esta activa. Solo puedes consultar historial.'
      : ticketItems.length === 0
        ? 'Agrega al menos un producto.'
        : cashSession?.status === 'pending_close'
          ? 'La caja cruzo el dia operativo. Cierra o fuerza el cierre antes de vender.'
          : !cashSession || cashSession.status !== 'open'
            ? 'Abre una caja antes de cobrar.'
          : hasStockIssue
            ? 'Corrige el stock antes de cobrar.'
            : null
  const isCheckoutActionDisabled = isCharging || apiStatus === 'loading' || !businessIsOperational || !can('create_sale')
  const publicCustomer = customers.find((customer) => customer.public_customer) || customers.find((customer) => customer.active)
  const checkoutCashReceivedCents = moneyInputToCents(checkoutForm.cash_received || '0')
  const checkoutChangeCents = Math.max(checkoutCashReceivedCents - ticketTotalCents, 0)
  const mixedCashAmountCents = moneyInputToCents(checkoutForm.mixed_cash_amount || '0')
  const mixedCashReceivedCents = moneyInputToCents(checkoutForm.mixed_cash_received || '0')
  const mixedCardAmountCents = moneyInputToCents(checkoutForm.mixed_card_amount || '0')
  const mixedTransferAmountCents = moneyInputToCents(checkoutForm.mixed_transfer_amount || '0')
  const mixedPaidCents = mixedCashAmountCents + mixedCardAmountCents + mixedTransferAmountCents
  const mixedChangeCents = Math.max(mixedCashReceivedCents - mixedCashAmountCents, 0)
  const mixedPendingCents = Math.max(ticketTotalCents - mixedPaidCents, 0)
  const displayedSaleTotalCents = saleStage === 'success' ? completedSale?.total_cents ?? 0 : ticketTotalCents
  const normalizedSaleHistoryQuery = saleHistoryQuery.trim().toLowerCase()
  const filteredSales = normalizedSaleHistoryQuery
    ? sales.filter((sale) =>
      [sale.folio, sale.cashier.name, ...sale.items.map((item) => item.product_name), ...sale.items.map((item) => item.sku)]
        .some((value) => value.toLowerCase().includes(normalizedSaleHistoryQuery)),
    )
    : sales
  const stockAlerts = products
    .filter((product) => product.stock_status !== 'ok')
    .map((product) => ({
      label: product.name,
      status: product.stock_status === 'out' ? 'Agotado' : 'Bajo stock',
    }))
    .slice(0, 4)
  const viewTitles: Record<string, string> = {
    'Admin Hulul': 'Admin Hulul',
    'Nueva empresa': 'Nueva empresa',
    'Editar empresa': 'Editar empresa',
    'Detalle empresa': 'Detalle de empresa',
    'Mi perfil': 'Mi perfil',
    Inicio: 'Resumen operativo',
    Venta: 'Punto de venta',
    Productos: 'Productos',
    Catalogos: 'Catalogos base',
    Inventario: 'Inventario',
    Clientes: 'Clientes',
    Usuarios: 'Usuarios',
    Proveedores: 'Proveedores',
    Compras: 'Compras',
    Caja: 'Caja',
    Bitacora: 'Bitacora',
    Configuracion: 'Configuracion de empresa',
  }
  const isCashOpen = cashSession?.status === 'open'
  const isCashPendingClose = cashSession?.status === 'pending_close'
  const cashOnboardingLabel = isCashPendingClose ? 'Cerrar caja vencida' : 'Caja abierta vigente'
  const cashOnboardingActionLabel = isCashPendingClose ? 'Cerrar caja' : 'Abrir caja'
  const hasUnits = catalogs.units.length > 0
  const hasCategories = catalogs.categories.length > 0
  const hasSuppliers = suppliers.some((supplier) => supplier.active)
  const hasProducts = products.length > 0
  const hasSellableStock = products.some((product) => Number(product.stock_quantity) > 0 && product.active !== false)
  const onboardingSteps: OnboardingStep[] = [
    {
      key: 'branch',
      label: 'Sucursal configurada',
      complete: portalContext?.branch_setup.complete ?? false,
      actionLabel: 'Completar sucursal',
      view: 'Configuracion',
    },
    {
      key: 'unit',
      label: 'Unidad minima',
      complete: hasUnits,
      actionLabel: 'Crear unidad',
      view: 'Catalogos',
    },
    {
      key: 'category',
      label: 'Categoria minima',
      complete: hasCategories,
      actionLabel: 'Crear categoria',
      view: 'Catalogos',
    },
    {
      key: 'product',
      label: 'Primer producto',
      complete: hasProducts,
      actionLabel: 'Crear producto',
      view: 'Productos',
    },
    {
      key: 'supplier',
      label: 'Primer proveedor',
      complete: hasSuppliers,
      actionLabel: 'Crear proveedor',
      view: 'Proveedores',
    },
    {
      key: 'stock',
      label: hasSuppliers ? 'Primera compra recibida' : 'Carga inicial de inventario',
      complete: hasSellableStock,
      actionLabel: hasSuppliers ? 'Registrar compra' : 'Cargar inventario inicial',
      view: hasSuppliers ? 'Compras' : 'Inventario',
    },
    {
      key: 'cash',
      label: cashOnboardingLabel,
      complete: isCashOpen,
      actionLabel: cashOnboardingActionLabel,
      view: 'Caja',
    },
  ]
  const onboardingLocked = portalContext != null && onboardingSteps.some((step) => !step.complete)
  const firstPendingStep = onboardingSteps.find((step) => !step.complete) || null
  const pendingOnboardingCount = onboardingSteps.filter((step) => !step.complete).length
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.complete)
  const completedOnboardingCount = completedOnboardingSteps.length
  const onboardingProgress = Math.round((completedOnboardingCount / onboardingSteps.length) * 100)
  const onboardingAllowedViews = new Set(['Admin Hulul', 'Inicio', 'Configuracion', 'Catalogos', 'Productos', 'Proveedores', 'Compras', 'Inventario', 'Caja', 'Bitacora'])
  const cashSetupReady = onboardingSteps.filter((step) => step.key !== 'cash').every((step) => step.complete)
  const isNavItemDisabled = (label: string) => onboardingLocked && (
    !onboardingAllowedViews.has(label) || (label === 'Caja' && !cashSetupReady)
  )
  useEffect(() => {
    if (isInternalConsole || !portalContext || !isNavItemDisabled(activeView)) return

    setActiveView(can('manage_branch_settings') ? 'Configuracion' : 'Inicio')
    setCashMode('summary')
    setSaleMessage(activeView === 'Caja' && !cashSetupReady
      ? 'Completa la configuracion, catalogos e inventario antes de abrir caja.'
      : 'Esta sucursal todavia no esta lista para operar.')
  }, [activeView, can, cashSetupReady, isInternalConsole, onboardingLocked, portalContext])
  const isProductWorkspace = activeView === 'Productos' || activeView === 'Catalogos'
  const isSalePosView = saleView === 'pos'
  const currentTitle = viewTitles[activeView] ?? activeView
  const internalPageTitle = adminBusinessEditorId
    ? adminBusinessEditorId === 'new' ? 'Nueva empresa' : 'Editar empresa'
    : activeView === 'Detalle empresa' ? adminBusinessDetail?.commercial_name || 'Detalle de empresa'
      : activeView === 'Mi perfil' ? 'Mi perfil' : 'Empresas'
  const mobilePrimaryNavItems = onboardingLocked
    ? visibleNavItems.filter((item) => onboardingAllowedViews.has(item.label))
    : visibleNavItems.filter((item) => ['Admin Hulul', 'Inicio', 'Venta', 'Productos', 'Inventario'].includes(item.label))
  const normalizedAdminBusinessQuery = adminBusinessQuery.trim().toLowerCase()
  const filteredAdminBusinesses = normalizedAdminBusinessQuery
    ? adminBusinesses.filter((business) =>
      [
        business.commercial_name,
        business.legal_name,
        business.rfc,
        business.primary_contact_name,
        business.email,
        business.phone,
        business.status,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedAdminBusinessQuery)),
    )
    : adminBusinesses
  const adminBusinessStatusCounts = {
    active: adminBusinesses.filter((business) => business.status === 'active').length,
    suspended: adminBusinesses.filter((business) => business.status === 'suspended').length,
    cancelled: adminBusinesses.filter((business) => business.status === 'cancelled').length,
  }
  const auditEventCounts = {
    total: auditEvents.length,
    users: auditEvents.filter((event) => event.event_type.startsWith('membership.')).length,
    products: auditEvents.filter((event) => event.event_type.startsWith('product')).length,
    sensitive: auditEvents.filter((event) => event.event_type.includes('cancelled') || event.event_type.includes('force_closed')).length,
  }
  const searchedProducts = normalizedSearchQuery
    ? products.filter((product) =>
      [product.sku, product.barcode, product.name]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearchQuery)),
    )
    : products
  const productCounts = {
    all: products.length,
    low: products.filter((product) => product.stock_status === 'low').length,
    out: products.filter((product) => product.stock_status === 'out').length,
    inactive: products.filter((product) => product.active === false).length,
  }
  const visibleCatalogs = catalogs[catalogType]
  const exactBrandMatch = catalogs.brands.find((brand) => brand.name.trim().toLowerCase() === brandQuery.trim().toLowerCase())
  const canQuickAddBrand = brandQuery.trim().length > 0 && !exactBrandMatch
  const visibleProducts = searchedProducts.filter((product) => {
    if (productFilter === 'low') return product.stock_status === 'low'
    if (productFilter === 'out') return product.stock_status === 'out'
    if (productFilter === 'inactive') return product.active === false
    return true
  })
  const inventoryRows = [...products].sort((first, second) => Number(first.stock_quantity) - Number(second.stock_quantity))
  const inventoryCounts = {
    stock: products.length,
    low: products.filter((product) => product.stock_status === 'low').length,
    out: products.filter((product) => product.stock_status === 'out').length,
    movements: inventoryMovements.length,
  }
  const normalizedCustomerQuery = customerQuery.trim().toLowerCase()
  const filteredCustomers = customers.filter((customer) => {
    const matchesFilter = customerFilter === 'inactive' ? customer.active === false : true
    if (!matchesFilter) return false
    if (!normalizedCustomerQuery) return true

    return [
      customer.commercial_name,
      customer.legal_name,
      customer.contact_name,
      customer.phone,
      customer.email,
      customer.rfc,
    ]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedCustomerQuery))
  })
  const normalizedSupplierQuery = supplierQuery.trim().toLowerCase()
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesFilter = supplierFilter === 'inactive' ? supplier.active === false : true
    if (!matchesFilter) return false
    if (!normalizedSupplierQuery) return true

    return [
      supplier.commercial_name,
      supplier.legal_name,
      supplier.contact_name,
      supplier.phone,
      supplier.email,
      supplier.rfc,
    ]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedSupplierQuery))
  })
  const normalizedPortalUserQuery = portalUserQuery.trim().toLowerCase()
  const filteredPortalUsers = portalUsers.filter((user) => {
    const matchesFilter = portalUserFilter === 'inactive' ? user.active === false : true
    if (!matchesFilter) return false
    if (!normalizedPortalUserQuery) return true

    return [user.name, user.email, roleLabels[user.role]]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedPortalUserQuery))
  })
  const purchaseTotalCents = purchaseForm.items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0)
    const unitCostCents = moneyInputToCents(item.unit_cost || '0')
    return sum + Math.round(quantity * unitCostCents)
  }, 0)
  const userInitials = (authSession?.user.name || 'HU')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function resetCheckout() {
    setCheckoutForm(emptyCheckoutForm)
    setSaleStage('cart')
    setCompletedSale(null)
  }

  function startCheckout() {
    if (!can('create_sale')) {
      setSaleMessage('No tienes permiso para cobrar ventas.')
      return
    }
    if (apiStatus !== 'ready') {
      setSaleMessage(apiStatus === 'loading' ? 'Espera a que cargue el POS.' : 'Sin conexion con el servidor.')
      return
    }
    if (cashSession?.status === 'pending_close') {
      setSaleMessage('La caja cruzo el dia operativo. Cierra o fuerza el cierre antes de vender.')
      return
    }
    if (!portalContext?.branch || !portalContext.cash_register || !cashSession || cashSession.status !== 'open') {
      setSaleMessage('Abre una caja antes de cobrar.')
      return
    }
    if (ticketItems.length === 0) {
      setSaleMessage('Agrega al menos un producto.')
      return
    }
    if (hasStockIssue) {
      setSaleMessage('Corrige el stock antes de cobrar.')
      return
    }

    setCheckoutForm((form) => ({
      ...emptyCheckoutForm,
      customer_id: form.customer_id || publicCustomer?.id || '',
      method: form.method,
      cash_received: form.cash_received || centsToInput(ticketTotalCents),
    }))
    setSaleStage('payment')
    setSaleMessage(null)
  }

  function buildCheckoutPayments() {
    if (checkoutForm.method === 'cash') {
      if (checkoutCashReceivedCents < ticketTotalCents) {
        throw new Error('El efectivo recibido no cubre el total.')
      }

      return [
        {
          payment_method: 'cash',
          amount_cents: ticketTotalCents,
          received_amount_cents: checkoutCashReceivedCents,
        },
      ]
    }

    if (checkoutForm.method === 'card') {
      return [
        {
          payment_method: 'card',
          amount_cents: ticketTotalCents,
          received_amount_cents: ticketTotalCents,
          reference: checkoutForm.card_reference || undefined,
        },
      ]
    }

    if (checkoutForm.method === 'transfer') {
      return [
        {
          payment_method: 'transfer',
          amount_cents: ticketTotalCents,
          received_amount_cents: ticketTotalCents,
          reference: checkoutForm.transfer_reference || undefined,
        },
      ]
    }

    if (mixedCashAmountCents > 0 && mixedCashReceivedCents < mixedCashAmountCents) {
      throw new Error('El efectivo recibido no cubre la parte en efectivo.')
    }
    if (mixedPaidCents < ticketTotalCents) {
      throw new Error('El pago mixto no cubre el total.')
    }

    const payments = [
      mixedCashAmountCents > 0
        ? {
          payment_method: 'cash',
          amount_cents: mixedCashAmountCents,
          received_amount_cents: mixedCashReceivedCents,
        }
        : null,
      mixedCardAmountCents > 0
        ? {
          payment_method: 'card',
          amount_cents: mixedCardAmountCents,
          received_amount_cents: mixedCardAmountCents,
          reference: checkoutForm.mixed_card_reference || undefined,
        }
        : null,
      mixedTransferAmountCents > 0
        ? {
          payment_method: 'transfer',
          amount_cents: mixedTransferAmountCents,
          received_amount_cents: mixedTransferAmountCents,
          reference: checkoutForm.mixed_transfer_reference || undefined,
        }
        : null,
    ].filter((payment) => payment != null)

    if (payments.length < 2) {
      throw new Error('En mixto captura al menos dos formas de pago.')
    }

    return payments
  }

  async function handleCharge() {
    if (!can('create_sale')) {
      setSaleMessage('No tienes permiso para cobrar ventas.')
      return
    }
    if (cashSession?.status === 'pending_close') {
      setSaleMessage('La caja cruzo el dia operativo. Cierra o fuerza el cierre antes de vender.')
      return
    }
    if (!portalContext?.branch || !portalContext.cash_register || !cashSession || cashSession.status !== 'open') {
      setSaleMessage('Abre una caja antes de cobrar.')
      return
    }
    if (!actingUserId) {
      setSaleMessage('Inicia sesion para cobrar.')
      return
    }

    setIsCharging(true)
    setSaleMessage(null)

    try {
      const payments = buildCheckoutPayments()
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale: {
            branch_id: portalContext.branch.id,
            cash_register_id: portalContext.cash_register.id,
            cashier_id: actingUserId,
            customer_id: checkoutForm.customer_id || publicCustomer?.id,
            idempotency_key: `web-pos-${Date.now()}`,
            items: ticketItems.map((item) => ({
              product_id: item.productId,
              quantity: item.quantity,
            })),
            payments,
          },
        }),
      })

      const body = (await response.json()) as CompletedSale & { errors?: string[] }
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo cobrar')

      const {
        context,
        products: loadedProducts,
        catalogs: loadedCatalogs,
        inventoryMovements: loadedMovements,
        cashMovements: loadedCashMovements,
        sales: loadedSales,
      } = await loadPortalData()
      setPortalContext(context)
      setProducts(loadedProducts)
      setCatalogs(loadedCatalogs)
      setInventoryMovements(loadedMovements)
      setCashMovements(loadedCashMovements)
      setSales(loadedSales)
      setCartItems([])
      setSearchQuery('')
      setCompletedSale(body)
      setCheckoutForm(emptyCheckoutForm)
      setSaleStage('success')
      setApiStatus('ready')
      setSaleMessage(`Venta ${body.folio} cobrada.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo cobrar.')
    } finally {
      setIsCharging(false)
    }
  }

  function addProductToCart(product: Product) {
    const stockQuantity = Number(product.stock_quantity)
    if (stockQuantity <= 0) {
      setSaleMessage(`Sin stock para ${product.sku}.`)
      return
    }

    setCartItems((items) => {
      const existingItem = items.find((item) => item.product.id === product.id)
      if (!existingItem) return [...items, { product, quantity: 1 }]

      return items.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, stockQuantity) }
          : item,
      )
    })
    setSaleMessage(null)
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (!Number.isFinite(quantity)) return

    setCartItems((items) =>
      items
        .map((item) => (item.product.id === productId ? { ...item, quantity: Math.max(quantity, 0) } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  function clearCart() {
    setCartItems([])
    setSaleMessage(null)
    resetCheckout()
  }

  function showPendingFeature(feature: string) {
    setSaleMessage(`${feature} estara disponible pronto.`)
  }

  function openCashFromPos() {
    setActiveView('Caja')
    setCashMode('open')
    setSaleMessage(null)
    setSaleView('pos')
    setSelectedSale(null)
  }

  function goToOnboardingTarget(step: OnboardingStep) {
    setSaleMessage(null)
    if (step.view === 'Configuracion') {
      setActiveView('Configuracion')
      return
    }

    if (step.view === 'Catalogos') {
      setActiveView('Catalogos')
      if (step.key === 'unit') setCatalogType('units')
      if (step.key === 'category') setCatalogType('categories')
      setCatalogForm(emptyCatalogForm)
      return
    }

    if (step.view === 'Productos') {
      setActiveView('Productos')
      setProductSection('products')
      startNewProduct()
      return
    }

    if (step.view === 'Proveedores') {
      setActiveView('Proveedores')
      startNewSupplier()
      return
    }

    if (step.view === 'Compras') {
      setActiveView('Compras')
      startNewPurchase()
      return
    }

    if (step.view === 'Inventario') {
      setActiveView('Inventario')
      startInventoryMovement(products[0])
      return
    }

    if (step.view === 'Caja') {
      setActiveView('Caja')
      setCashMode(isCashPendingClose ? 'close' : 'open')
    }
  }

  function pendingStepDescription(step: OnboardingStep | null) {
    if (!step) return 'Completa los pasos obligatorios para habilitar ventas.'
    if (step.key === 'cash' && isCashPendingClose) {
      return 'Hay una caja abierta de un turno anterior. Debes cerrarla para abrir un nuevo turno.'
    }
    if (step.key === 'cash') return 'Abre una caja vigente para iniciar ventas.'
    if (step.key === 'stock') return 'Carga inventario disponible para poder vender productos.'
    return 'Completa este paso obligatorio para habilitar ventas.'
  }

  function renderNavLabel(label: string) {
    return (
      <span className="nav-label">
        <span>{label}</span>
        {label === 'Configuracion' && pendingOnboardingCount > 0 ? (
          <span className="nav-badge" aria-label={`${pendingOnboardingCount} pendientes`}>
            {pendingOnboardingCount}
          </span>
        ) : null}
      </span>
    )
  }

  function applySettingsContext(body: PortalContext) {
    setPortalContext(body)
    setSettingsForm({
      commercial_name: body.business.commercial_name || '',
      legal_name: body.business.legal_name || '',
      rfc: body.business.rfc || '',
      primary_contact_name: body.business.primary_contact_name || '',
      phone: body.business.phone || '',
      whatsapp: body.business.whatsapp || '',
      email: body.business.email || '',
      branch_name: body.branch?.name || '',
      branch_address: body.branch?.address || '',
    })
  }

  async function saveBusinessSettings() {
    if (!portalContext?.business.id) return
    if (!can('manage_business_settings')) {
      setSaleMessage('Solo el propietario puede editar los datos de la empresa.')
      return
    }

    setIsSavingSettings(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: {
            commercial_name: settingsForm.commercial_name,
            legal_name: settingsForm.legal_name,
            rfc: settingsForm.rfc,
            primary_contact_name: settingsForm.primary_contact_name,
            phone: settingsForm.phone,
            whatsapp: settingsForm.whatsapp,
            email: settingsForm.email,
          },
        }),
      })

      const body = (await response.json()) as PortalContext & { errors?: string[] }
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar la configuracion.')

      applySettingsContext(body)
      setSaleMessage('Datos de empresa actualizados.')
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudieron guardar los datos de empresa.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function saveBranchSettings() {
    if (!portalContext?.business.id || !portalContext.branch?.id) return
    if (!can('manage_branch_settings')) {
      setSaleMessage('No tienes permiso para editar esta sucursal.')
      return
    }

    setIsSavingSettings(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/branch_settings?branch_id=${encodeURIComponent(portalContext.branch.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: {
            name: settingsForm.branch_name,
            address: settingsForm.branch_address,
          },
        }),
      })
      const body = (await response.json()) as PortalContext & { errors?: string[] }
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar la sucursal.')

      applySettingsContext(body)
      setSaleMessage(body.branch_setup.complete ? 'Sucursal actualizada.' : 'Sucursal guardada; aun faltan datos operativos.')
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar la sucursal.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  function goToView(label: string) {
    if (!isInternalConsole && label !== 'Admin Hulul' && !permissionsAllowView(label, activePermissions)) {
      setActiveView('Inicio')
      setSaleMessage('Tu rol en esta sucursal no tiene acceso a ese modulo.')
      return
    }
    if (isNavItemDisabled(label)) {
      setActiveView(can('manage_branch_settings') ? 'Configuracion' : 'Inicio')
      setSaleMessage(label === 'Caja' && !cashSetupReady
        ? 'Completa la configuracion, catalogos e inventario antes de abrir caja.'
        : can('manage_branch_settings')
        ? `Antes de continuar: ${firstPendingStep?.label || 'completa la configuracion operativa'}.`
        : 'Esta sucursal todavia no esta lista para operar. Solicita la configuracion al propietario o gerente.')
      return
    }
    if (isInternalConsole) {
      setAdminBusinessEditorId(null)
      setAdminBusinessForm(emptyAdminBusinessForm)
      setAdminBusinessDetail(null)
      setAdminBranchEditorId(null)
      setAdminUserEditorId(null)
    }
    setActiveView(label)
    setSaleMessage(null)
    if (label === 'Productos') setProductSection('products')
    if (label === 'Catalogos') setProductSection('catalogs')
    if (label !== 'Venta') {
      setSaleView('pos')
      setSelectedSale(null)
    }
    if (!viewTitles[label]) showPendingFeature(label)
  }

  function openSaleDetail(sale: CompletedSale) {
    setSelectedSale(sale)
    setSaleView('detail')
    setSaleCancelReason('')
    setSaleMessage(null)
  }

  function printSaleReceipt(sale: CompletedSale) {
    const printWindow = window.open('', '_blank', 'width=420,height=820')
    if (!printWindow) {
      setSaleMessage('No se pudo abrir la impresion. Revisa el bloqueador de ventanas.')
      return
    }

    const paymentLabels = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      mixed: 'Mixto',
    } as const

    const itemsMarkup = sale.items.map((item) => `
      <tr>
        <td style="padding:6px 0; vertical-align:top;">
          <div style="font-weight:700;">${item.product_name}</div>
          <div style="font-size:12px; color:#667085;">${item.sku} · ${item.quantity} ${item.unit}</div>
        </td>
        <td style="padding:6px 0; text-align:right; vertical-align:top; font-weight:700;">${formatMoney(item.total_cents)}</td>
      </tr>
    `).join('')

    const paymentsMarkup = sale.payments.map((payment) => `
      <tr>
        <td style="padding:4px 0;">${paymentLabels[payment.payment_method as keyof typeof paymentLabels] || payment.payment_method}</td>
        <td style="padding:4px 0; text-align:right;">${formatMoney(payment.amount_cents)}</td>
      </tr>
    `).join('')

    const receiptHtml = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Ticket ${sale.folio}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:#101828; margin:0; padding:24px; }
            .ticket { max-width: 360px; margin: 0 auto; }
            .muted { color:#667085; font-size:12px; }
            .block { margin-bottom:16px; }
            .title { font-size:20px; font-weight:800; margin-bottom:4px; }
            table { width:100%; border-collapse:collapse; }
            .total { border-top:1px dashed #d0d5dd; margin-top:10px; padding-top:10px; font-size:18px; font-weight:800; display:flex; justify-content:space-between; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="block">
              <div class="title">${businessName}</div>
              <div class="muted">${branchName}</div>
            </div>
            <div class="block">
              <div><strong>Folio:</strong> ${sale.folio}</div>
              <div><strong>Fecha:</strong> ${new Date(sale.created_at).toLocaleString('es-MX')}</div>
              <div><strong>Cliente:</strong> ${sale.customer?.commercial_name || 'Publico en general'}</div>
              <div><strong>Cajero:</strong> ${sale.cashier.name}</div>
            </div>
            <div class="block">
              <table>${itemsMarkup}</table>
            </div>
            <div class="block">
              <table>${paymentsMarkup}</table>
            </div>
            <div class="total">
              <span>Total</span>
              <span>${formatMoney(sale.total_cents)}</span>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    setSaleMessage(`Ticket ${sale.folio} enviado a impresion.`)
  }

  async function cancelSelectedSale() {
    if (!selectedSale || !portalContext?.business.id || !actingUserId) return
    if (!can('cancel_sale')) {
      setSaleMessage('No tienes permiso para cancelar ventas.')
      return
    }
    if (!saleCancelReason.trim()) {
      setSaleMessage('Captura motivo de cancelacion.')
      return
    }

    setIsCancellingSale(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/sales/${selectedSale.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale: {
            cancelled_by_id: actingUserId,
            cash_register_session_id: cashSession?.id,
            cancellation_reason: saleCancelReason,
          },
        }),
      })
      const body = (await response.json()) as CompletedSale & { errors?: string[] }
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo cancelar venta')

      const { context, cashMovements: loadedCashMovements, sales: loadedSales, products: loadedProducts, inventoryMovements: loadedMovements } = await loadPortalData()
      setPortalContext(context)
      setCashMovements(loadedCashMovements)
      setSales(loadedSales)
      setProducts(loadedProducts)
      setInventoryMovements(loadedMovements)
      setSelectedSale(body)
      setSaleCancelReason('')
      setSaleMessage(`Venta ${body.folio} cancelada.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo cancelar venta.')
    } finally {
      setIsCancellingSale(false)
    }
  }

  function startInventoryMovement(product?: Product) {
    setInventoryForm({
      ...emptyInventoryForm,
      product_id: product?.id || inventoryForm.product_id || products[0]?.id || '',
    })
    setInventoryMode('movement')
    setSaleMessage(null)
  }

  function startNewProduct() {
    if (!can('manage_products')) {
      setSaleMessage('No tienes permiso para administrar productos.')
      return
    }
    setProductForm({
      ...emptyProductForm,
      category_id: catalogs.categories[0]?.id || '',
      brand_id: '',
      base_unit_id: catalogs.units[0]?.id || '',
    })
    setBrandQuery('')
    setProductMode('form')
    setSaleMessage(null)
  }

  function startNewCatalog() {
    if (!can('manage_catalogs')) {
      setSaleMessage('No tienes permiso para administrar catalogos.')
      return
    }
    setCatalogForm(emptyCatalogForm)
    setSaleMessage(null)
  }

  function startNewCustomer() {
    if (!can('manage_customers')) {
      setSaleMessage('No tienes permiso para administrar clientes.')
      return
    }
    setCustomerForm(emptyCustomerForm)
    setCustomerMode('form')
    setSaleMessage(null)
  }

  function startNewSupplier() {
    if (!can('manage_suppliers')) {
      setSaleMessage('No tienes permiso para administrar proveedores.')
      return
    }
    setSupplierForm(emptySupplierForm)
    setSupplierMode('form')
    setSaleMessage(null)
  }

  function startNewPortalUser() {
    if (!can('manage_users')) {
      setSaleMessage('No tienes permiso para administrar usuarios.')
      return
    }
    setPortalUserForm(emptyPortalUserForm)
    setPortalUserMode('form')
    setSaleMessage(null)
  }

  function startNewPurchase() {
    if (!can('manage_purchases')) {
      setSaleMessage('No tienes permiso para registrar compras.')
      return
    }
    if (!hasSuppliers) {
      setActiveView('Proveedores')
      setSaleMessage('Primero crea un proveedor o usa carga inicial desde Inventario.')
      return
    }
    if (!hasProducts) {
      setActiveView('Productos')
      setSaleMessage('Primero crea al menos un producto para registrar compras.')
      return
    }
    setPurchaseForm({
      ...emptyPurchaseForm,
      supplier_id: suppliers[0]?.id || '',
      items: [
        {
          ...emptyPurchaseItem,
          product_id: products[0]?.id || '',
        },
      ],
    })
    setPurchaseMode('form')
    setSelectedPurchase(null)
    setPurchaseCancelReason('')
    setSaleMessage(null)
  }

  function startCancelPurchase(purchase: Purchase) {
    if (!can('cancel_purchase')) {
      setSaleMessage('No tienes permiso para anular compras.')
      return
    }
    setSelectedPurchase(purchase)
    setPurchaseCancelReason('')
    setSaleMessage(null)
  }

  function resetImportState() {
    setImportFile(null)
    setImportPreviewRows([])
    setImportPreviewErrors([])
  }

  function editCatalog(option: CatalogOption) {
    setCatalogForm({
      id: option.id,
      name: option.name,
      abbreviation: option.abbreviation || '',
      active: option.active,
    })
    setSaleMessage(null)
  }

  function editProduct(product: Product) {
    setProductForm({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category_id: product.category_id || catalogs.categories[0]?.id || '',
      brand_id: product.brand_id || '',
      base_unit_id: product.base_unit.id || catalogs.units[0]?.id || '',
      sale_price: centsToInput(product.sale_price_cents),
      current_cost: centsToInput(product.current_cost_cents),
      tax_mode: product.tax_mode || 'included',
      tax_rate: product.tax_rate || '16',
      minimum_stock: product.minimum_stock || '0',
      aisle_location: product.aisle_location || '',
      shelf_location: product.shelf_location || '',
      bin_location: product.bin_location || '',
      allows_fractional_sale: Boolean(product.allows_fractional_sale),
      active: product.active !== false,
    })
    setBrandQuery(product.brand || '')
    setProductMode('form')
    setSaleMessage(null)
  }

  async function createCatalogOption(type: CatalogSection, form: CatalogForm) {
    if (!portalContext?.business.id) throw new Error('No hay negocio activo.')

    const payload = {
      catalog: {
        name: form.name,
        abbreviation: type === 'units' ? form.abbreviation : undefined,
        active: form.active,
      },
    }

    const baseUrl = `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/catalogs/${type}`
    const response = await apiFetch(form.id ? `${baseUrl}/${form.id}` : baseUrl, {
      method: form.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar catalogo')

    const { catalogs: loadedCatalogs } = await loadPortalData()
    setCatalogs(loadedCatalogs)
    return {
      body,
      catalogs: loadedCatalogs,
    }
  }

  function editCustomer(customer: Customer) {
    setCustomerForm({
      id: customer.id,
      customer_type: customer.customer_type,
      commercial_name: customer.commercial_name,
      legal_name: customer.legal_name || '',
      rfc: customer.rfc || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      address: customer.address || '',
      contact_name: customer.contact_name || '',
      active: customer.active,
      notes: customer.notes || '',
    })
    setCustomerMode('form')
    setSaleMessage(null)
  }

  function editSupplier(supplier: Supplier) {
    setSupplierForm({
      id: supplier.id,
      commercial_name: supplier.commercial_name,
      legal_name: supplier.legal_name || '',
      rfc: supplier.rfc || '',
      phone: supplier.phone || '',
      whatsapp: supplier.whatsapp || '',
      email: supplier.email || '',
      contact_name: supplier.contact_name || '',
      address: supplier.address || '',
      delivery_days: supplier.delivery_days || '',
      payment_terms: supplier.payment_terms || '',
      active: supplier.active,
      notes: supplier.notes || '',
    })
    setSupplierMode('form')
    setSaleMessage(null)
  }

  function editPortalUser(user: PortalUser) {
    setPortalUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      access_type: user.role === 'owner' ? 'owner' : 'member',
      active: user.membership_active,
      branch_assignments: user.branch_assignments,
    })
    setPortalUserMode('form')
    setSaleMessage(null)
  }

  function togglePortalUserBranch(branchId: string) {
    setPortalUserForm((form) => {
      const assigned = form.branch_assignments.some((assignment) => assignment.branch_id === branchId)
      return {
        ...form,
        branch_assignments: assigned
          ? form.branch_assignments.filter((assignment) => assignment.branch_id !== branchId)
          : [...form.branch_assignments, { branch_id: branchId, role: 'cashier', active: true }],
      }
    })
  }

  async function saveProduct(form = productForm) {
    if (!portalContext?.business.id) return
    if (!can('manage_products')) {
      setSaleMessage('No tienes permiso para administrar productos.')
      return
    }
    if (brandQuery.trim().length > 0 && !form.brand_id) {
      setSaleMessage('La marca escrita no existe todavia. Agregala primero o deja el campo vacio.')
      return
    }

    setIsSavingProduct(true)
    setSaleMessage(null)

    const payload = {
      product: {
        name: form.name,
        sku: form.sku,
        barcode: form.barcode || null,
        category_id: form.category_id,
        brand_id: form.brand_id || null,
        base_unit_id: form.base_unit_id,
        sale_price_cents: moneyInputToCents(form.sale_price),
        current_cost_cents: form.current_cost ? moneyInputToCents(form.current_cost) : null,
        tax_mode: form.tax_mode,
        tax_rate: form.tax_rate,
        minimum_stock: form.minimum_stock || '0',
        aisle_location: form.aisle_location,
        shelf_location: form.shelf_location,
        bin_location: form.bin_location,
        allows_fractional_sale: form.allows_fractional_sale,
        active: form.active,
      },
    }

    try {
      const url = form.id
        ? `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/products/${form.id}`
        : `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/products`
      const response = await apiFetch(url, {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar producto')

      const {
        products: loadedProducts,
        catalogs: loadedCatalogs,
        inventoryMovements: loadedMovements,
        cashMovements: loadedCashMovements,
        sales: loadedSales,
      } = await loadPortalData()
      setProducts(loadedProducts)
      setCatalogs(loadedCatalogs)
      setInventoryMovements(loadedMovements)
      setCashMovements(loadedCashMovements)
      setSales(loadedSales)
      setProductMode('list')
      setSaleMessage(`Producto ${body.sku} guardado.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar producto.')
    } finally {
      setIsSavingProduct(false)
    }
  }

  async function saveCatalog(form = catalogForm) {
    if (!portalContext?.business.id) return
    if (!can('manage_catalogs')) {
      setSaleMessage('No tienes permiso para administrar catalogos.')
      return
    }

    setIsSavingCatalog(true)
    setSaleMessage(null)

    try {
      const { body } = await createCatalogOption(catalogType, form)
      setCatalogForm(emptyCatalogForm)
      setSaleMessage(`Catalogo ${body.name} guardado.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar catalogo.')
    } finally {
      setIsSavingCatalog(false)
    }
  }

  async function quickAddBrand() {
    if (!can('manage_catalogs')) {
      setSaleMessage('No tienes permiso para administrar catalogos.')
      return
    }
    if (!brandQuery.trim()) return

    setIsQuickAddingBrand(true)
    setSaleMessage(null)

    try {
      const { body, catalogs: loadedCatalogs } = await createCatalogOption('brands', {
        name: brandQuery.trim(),
        abbreviation: '',
        active: true,
      })
      const createdBrand = loadedCatalogs.brands.find((brand) => brand.id === body.id) ||
        loadedCatalogs.brands.find((brand) => brand.name.trim().toLowerCase() === body.name.trim().toLowerCase())

      setProductForm((form) => ({
        ...form,
        brand_id: createdBrand?.id || '',
      }))
      setBrandQuery(createdBrand?.name || body.name)
      setSaleMessage(`Marca ${body.name} agregada.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo agregar la marca.')
    } finally {
      setIsQuickAddingBrand(false)
    }
  }

  async function saveCustomer(form = customerForm) {
    if (!portalContext?.business.id) return
    if (!can('manage_customers')) {
      setSaleMessage('No tienes permiso para administrar clientes.')
      return
    }

    setIsSavingCustomer(true)
    setSaleMessage(null)

    const payload = {
      customer: {
        customer_type: form.customer_type,
        commercial_name: form.commercial_name,
        legal_name: form.legal_name || null,
        rfc: form.rfc || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        address: form.address || null,
        contact_name: form.contact_name || null,
        active: form.active,
        notes: form.notes || null,
      },
    }

    try {
      const url = form.id
        ? `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/customers/${form.id}`
        : `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/customers`
      const response = await apiFetch(url, {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar cliente')

      const { customers: loadedCustomers } = await loadPortalData()
      setCustomers(loadedCustomers)
      setCustomerMode('list')
      setSaleMessage(`Cliente ${body.commercial_name} guardado.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar cliente.')
    } finally {
      setIsSavingCustomer(false)
    }
  }

  async function saveSupplier(form = supplierForm) {
    if (!portalContext?.business.id) return
    if (!can('manage_suppliers')) {
      setSaleMessage('No tienes permiso para administrar proveedores.')
      return
    }

    setIsSavingSupplier(true)
    setSaleMessage(null)

    const payload = {
      supplier: {
        commercial_name: form.commercial_name,
        legal_name: form.legal_name || null,
        rfc: form.rfc || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        contact_name: form.contact_name || null,
        address: form.address || null,
        delivery_days: form.delivery_days || null,
        payment_terms: form.payment_terms || null,
        active: form.active,
        notes: form.notes || null,
      },
    }

    try {
      const url = form.id
        ? `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/suppliers/${form.id}`
        : `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/suppliers`
      const response = await apiFetch(url, {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar proveedor')

      const { suppliers: loadedSuppliers } = await loadPortalData()
      setSuppliers(loadedSuppliers)
      setSupplierMode('list')
      setSaleMessage(`Proveedor ${body.commercial_name} guardado.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar proveedor.')
    } finally {
      setIsSavingSupplier(false)
    }
  }

  async function savePortalUser(form = portalUserForm) {
    if (!portalContext?.business.id) return
    if (!can('manage_users')) {
      setSaleMessage('No tienes permiso para administrar usuarios.')
      return
    }

    setIsSavingPortalUser(true)
    setSaleMessage(null)

    const payload = {
      user: {
        name: form.name,
        email: form.email,
        password: form.password || undefined,
      },
      membership: {
        role: form.access_type,
        active: form.active,
        branch_assignments: form.access_type === 'owner' ? [] : form.branch_assignments,
      },
    }

    try {
      const url = form.id
        ? `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/users/${form.id}`
        : `${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/users`
      const response = await apiFetch(url, {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar usuario')

      const { portalUsers: loadedPortalUsers } = await loadPortalData()
      setPortalUsers(loadedPortalUsers)
      setPortalUserMode('list')
      setSaleMessage(`Usuario ${body.name} guardado.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar usuario.')
    } finally {
      setIsSavingPortalUser(false)
    }
  }

  async function toggleCustomerActive(customer: Customer) {
    const nextForm: CustomerForm = {
      id: customer.id,
      customer_type: customer.customer_type,
      commercial_name: customer.commercial_name,
      legal_name: customer.legal_name || '',
      rfc: customer.rfc || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      address: customer.address || '',
      contact_name: customer.contact_name || '',
      active: customer.active === false,
      notes: customer.notes || '',
    }
    setCustomerForm(nextForm)
    await saveCustomer(nextForm)
  }

  async function toggleSupplierActive(supplier: Supplier) {
    const nextForm: SupplierForm = {
      id: supplier.id,
      commercial_name: supplier.commercial_name,
      legal_name: supplier.legal_name || '',
      rfc: supplier.rfc || '',
      phone: supplier.phone || '',
      whatsapp: supplier.whatsapp || '',
      email: supplier.email || '',
      contact_name: supplier.contact_name || '',
      address: supplier.address || '',
      delivery_days: supplier.delivery_days || '',
      payment_terms: supplier.payment_terms || '',
      active: supplier.active === false,
      notes: supplier.notes || '',
    }
    setSupplierForm(nextForm)
    await saveSupplier(nextForm)
  }

  async function togglePortalUserActive(user: PortalUser) {
    const nextForm: PortalUserForm = {
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      access_type: user.role === 'owner' ? 'owner' : 'member',
      active: user.active === false,
      branch_assignments: user.branch_assignments,
    }
    setPortalUserForm(nextForm)
    await savePortalUser(nextForm)
  }

  function updatePurchaseItem(index: number, patch: Partial<PurchaseDraftItem>) {
    setPurchaseForm((form) => ({
      ...form,
      items: form.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      )),
    }))
  }

  function addPurchaseItem() {
    setPurchaseForm((form) => ({
      ...form,
      items: [
        ...form.items,
        {
          ...emptyPurchaseItem,
          product_id: products[0]?.id || '',
        },
      ],
    }))
  }

  function removePurchaseItem(index: number) {
    setPurchaseForm((form) => ({
      ...form,
      items: form.items.length === 1 ? form.items : form.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function savePurchase() {
    if (!portalContext?.business.id || !portalContext.branch || !actingUserId) return

    if (!hasSuppliers) {
      setSaleMessage('Primero crea un proveedor.')
      return
    }
    if (!hasProducts) {
      setSaleMessage('Primero crea al menos un producto.')
      return
    }
    const normalizedItems = purchaseForm.items.filter((item) => item.product_id && Number(item.quantity) > 0 && Number(item.unit_cost) > 0)
    if (!purchaseForm.supplier_id) {
      setSaleMessage('Selecciona un proveedor.')
      return
    }
    if (normalizedItems.length === 0) {
      setSaleMessage('Agrega al menos una partida valida.')
      return
    }

    setIsSavingPurchase(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase: {
            branch_id: portalContext.branch.id,
            supplier_id: purchaseForm.supplier_id,
            created_by_id: actingUserId,
            purchased_at: new Date(purchaseForm.purchased_at).toISOString(),
            invoice_reference: purchaseForm.invoice_reference || null,
            notes: purchaseForm.notes || null,
            items: normalizedItems.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_cost_cents: moneyInputToCents(item.unit_cost),
            })),
          },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo registrar compra')

      const {
        purchases: loadedPurchases,
        products: loadedProducts,
        inventoryMovements: loadedMovements,
      } = await loadPortalData()
      setPurchases(loadedPurchases)
      setProducts(loadedProducts)
      setInventoryMovements(loadedMovements)
      setPurchaseMode('list')
      setPurchaseForm(emptyPurchaseForm)
      setSelectedPurchase(null)
      setPurchaseCancelReason('')
      setSaleMessage(`Compra ${body.folio} registrada.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo registrar compra.')
    } finally {
      setIsSavingPurchase(false)
    }
  }

  async function cancelSelectedPurchase() {
    if (!selectedPurchase || !portalContext?.business.id || !actingUserId) return
    if (!purchaseCancelReason.trim()) {
      setSaleMessage('Captura motivo de cancelacion.')
      return
    }

    setIsCancellingPurchase(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/purchases/${selectedPurchase.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase: {
            cancelled_by_id: actingUserId,
            cancellation_reason: purchaseCancelReason,
          },
        }),
      })
      const body = (await response.json()) as Purchase & { errors?: string[] }
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo cancelar compra')

      const {
        purchases: loadedPurchases,
        products: loadedProducts,
        inventoryMovements: loadedMovements,
      } = await loadPortalData()
      setPurchases(loadedPurchases)
      setProducts(loadedProducts)
      setInventoryMovements(loadedMovements)
      setSelectedPurchase(body)
      setPurchaseCancelReason('')
      setSaleMessage(`Compra ${body.folio} cancelada.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo cancelar compra.')
    } finally {
      setIsCancellingPurchase(false)
    }
  }

  async function downloadImportTemplate() {
    if (!portalContext?.business.id) return

    const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/products/import_template`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hulul-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function previewImportFile() {
    if (!portalContext?.business.id || !importFile) {
      setSaleMessage('Selecciona un archivo primero.')
      return
    }
    if (!can('manage_products')) {
      setSaleMessage('No tienes permiso para importar productos.')
      return
    }

    setIsPreviewingImport(true)
    setSaleMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      if (actingUserId) formData.append('created_by_id', actingUserId)

      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/products/import_preview`, {
        method: 'POST',
        body: formData,
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo leer archivo')

      setImportPreviewRows(body.rows || [])
      setImportPreviewErrors(body.errors || [])
      setSaleMessage(body.errors?.length ? 'Revisa errores antes de importar.' : 'Preview lista.')
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo leer archivo.')
    } finally {
      setIsPreviewingImport(false)
    }
  }

  async function commitImportFile() {
    if (!portalContext?.business.id || !importFile) {
      setSaleMessage('Selecciona un archivo primero.')
      return
    }

    setIsImportingProducts(true)
    setSaleMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      if (actingUserId) formData.append('created_by_id', actingUserId)

      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/products/import_commit`, {
        method: 'POST',
        body: formData,
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo importar archivo')

      const { products: loadedProducts, catalogs: loadedCatalogs, inventoryMovements: loadedMovements } = await loadPortalData()
      setProducts(loadedProducts)
      setCatalogs(loadedCatalogs)
      setInventoryMovements(loadedMovements)
      resetImportState()
      setProductSection('products')
      setSaleMessage(`Importacion completada. ${body.imported_count} productos.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo importar archivo.')
    } finally {
      setIsImportingProducts(false)
    }
  }

  async function toggleProductActive(product: Product) {
    const nextForm: ProductForm = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category_id: product.category_id || catalogs.categories[0]?.id || '',
      brand_id: product.brand_id || '',
      base_unit_id: product.base_unit.id || catalogs.units[0]?.id || '',
      sale_price: centsToInput(product.sale_price_cents),
      current_cost: centsToInput(product.current_cost_cents),
      tax_mode: product.tax_mode || 'included',
      tax_rate: product.tax_rate || '16',
      minimum_stock: product.minimum_stock || '0',
      aisle_location: product.aisle_location || '',
      shelf_location: product.shelf_location || '',
      bin_location: product.bin_location || '',
      allows_fractional_sale: Boolean(product.allows_fractional_sale),
      active: product.active === false,
    }
    setProductForm(nextForm)
    await saveProduct(nextForm)
  }

  async function saveInventoryMovement() {
    if (!portalContext?.business.id || !portalContext.branch) return
    if (!can('adjust_inventory')) {
      setSaleMessage('No tienes permiso para ajustar inventario.')
      return
    }
    if (!actingUserId) {
      setSaleMessage('Inicia sesion para registrar movimientos.')
      return
    }

    const selectedProduct = products.find((product) => product.id === inventoryForm.product_id)
    if (!selectedProduct) {
      setSaleMessage('Selecciona un producto.')
      return
    }

    if (['negative_adjustment', 'waste'].includes(inventoryForm.movement_type) && !inventoryForm.reason.trim()) {
      setSaleMessage('Captura un motivo para este movimiento.')
      return
    }

    setIsSavingInventoryMovement(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/inventory_movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_movement: {
            branch_id: portalContext.branch.id,
            product_id: selectedProduct.id,
            movement_type: inventoryForm.movement_type,
            quantity: inventoryForm.quantity,
            unit_id: selectedProduct.base_unit.id,
            unit_cost_cents: inventoryForm.unit_cost ? moneyInputToCents(inventoryForm.unit_cost) : null,
            reason: inventoryForm.reason,
            created_by_id: actingUserId,
          },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo registrar movimiento')

      const {
        context,
        products: loadedProducts,
        inventoryMovements: loadedMovements,
        cashMovements: loadedCashMovements,
        sales: loadedSales,
      } = await loadPortalData()
      setPortalContext(context)
      setProducts(loadedProducts)
      setInventoryMovements(loadedMovements)
      setCashMovements(loadedCashMovements)
      setSales(loadedSales)
      setInventoryMode('stock')
      setInventoryForm({
        ...emptyInventoryForm,
        product_id: selectedProduct.id,
      })
      setSaleMessage(`Movimiento ${inventoryMovementLabels[body.movement_type] || body.movement_type} registrado.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo registrar movimiento.')
    } finally {
      setIsSavingInventoryMovement(false)
    }
  }

  async function openCashSession() {
    if (!portalContext?.branch || !portalContext.cash_register) return
    if (!can('open_cash_register')) {
      setSaleMessage('No tienes permiso para abrir caja.')
      return
    }
    if (!actingUserId) {
      setSaleMessage('Inicia sesion para abrir caja.')
      return
    }

    setIsSavingCashAction(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/cash_register_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cash_register_session: {
            branch_id: portalContext.branch.id,
            cash_register_id: portalContext.cash_register.id,
            opened_by_id: actingUserId,
            opening_amount_cents: moneyInputToCents(cashOpeningAmount || '0'),
          },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo abrir caja')

      const { context, cashMovements: loadedCashMovements, sales: loadedSales } = await loadPortalData()
      setPortalContext(context)
      setCashMovements(loadedCashMovements)
      setSales(loadedSales)
      setCashMode('summary')
      setCashOpeningAmount('')
      setCashCloseForm({
        counted_cash: centsToInput(context.cash_register_session?.expected_cash_cents),
        closing_notes: '',
        force_close_reason: '',
      })
      setSaleMessage('Caja abierta.')
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo abrir caja.')
    } finally {
      setIsSavingCashAction(false)
    }
  }

  async function saveCashMovement() {
    if (!portalContext?.business.id || !cashSession) return
    if (!can('create_cash_movement')) {
      setSaleMessage('No tienes permiso para registrar movimientos de caja.')
      return
    }
    if (cashSession.status === 'pending_close') {
      setSaleMessage('La caja esta pendiente de cierre. Cierra o fuerza el cierre antes de registrar movimientos.')
      return
    }
    if (!actingUserId) {
      setSaleMessage('Inicia sesion para registrar movimientos.')
      return
    }
    if (!cashMovementForm.reason.trim()) {
      setSaleMessage('Captura un motivo para este movimiento.')
      return
    }

    const amountCents = moneyInputToCents(cashMovementForm.amount || '0')
    if (amountCents <= 0) {
      setSaleMessage('Captura un importe mayor a cero.')
      return
    }

    setIsSavingCashAction(true)
    setSaleMessage(null)

    try {
      const signedAmountCents = cashMovementForm.movement_type === 'cash_out' ? -amountCents : amountCents
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/cash_movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cash_movement: {
            cash_register_session_id: cashSession.id,
            movement_type: cashMovementForm.movement_type,
            amount_cents: signedAmountCents,
            reason: cashMovementForm.reason,
            created_by_id: actingUserId,
          },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo registrar movimiento de caja')

      const { context, cashMovements: loadedCashMovements, sales: loadedSales } = await loadPortalData()
      setPortalContext(context)
      setCashMovements(loadedCashMovements)
      setSales(loadedSales)
      setCashMovementForm(emptyCashMovementForm)
      setCashMode('summary')
      setCashCloseForm((form) => ({
        ...form,
        counted_cash: centsToInput(context.cash_register_session?.expected_cash_cents),
      }))
      setSaleMessage(`Movimiento ${cashMovementLabels[body.movement_type as CashMovement['movement_type']] || body.movement_type} registrado.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo registrar movimiento de caja.')
    } finally {
      setIsSavingCashAction(false)
    }
  }

  async function closeCashSession() {
    if (!portalContext?.business.id || !portalContext.cash_register || !cashSession) return
    if (!can('close_cash_register')) {
      setSaleMessage('No tienes permiso para cerrar caja.')
      return
    }
    if (!actingUserId) {
      setSaleMessage('Inicia sesion para cerrar caja.')
      return
    }

    const countedCashCents = moneyInputToCents(cashCloseForm.counted_cash || '0')
    setIsSavingCashAction(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/cash_register_session/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cash_register_session: {
            cash_register_id: portalContext.cash_register.id,
            closed_by_id: actingUserId,
            counted_cash_cents: countedCashCents,
            closing_notes: cashCloseForm.closing_notes,
          },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo cerrar caja')

      const { context, cashMovements: loadedCashMovements, sales: loadedSales } = await loadPortalData()
      setPortalContext(context)
      setCashMovements(loadedCashMovements)
      setSales(loadedSales)
      setCashMode('summary')
      setCashCloseForm({
        counted_cash: '',
        closing_notes: '',
        force_close_reason: '',
      })
      setSaleMessage(`Caja cerrada. Diferencia ${formatMoney(body.difference_cents || 0)}.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo cerrar caja.')
    } finally {
      setIsSavingCashAction(false)
    }
  }

  async function forceCloseCashSession() {
    if (!portalContext?.business.id || !portalContext.cash_register || !cashSession) return
    if (!can('close_cash_register')) {
      setSaleMessage('No tienes permiso para forzar cierre de caja.')
      return
    }
    if (!actingUserId) {
      setSaleMessage('Inicia sesion para forzar cierre de caja.')
      return
    }
    if (!cashCloseForm.force_close_reason.trim()) {
      setSaleMessage('Captura un motivo para el cierre forzado.')
      return
    }

    const countedCashCents = moneyInputToCents(cashCloseForm.counted_cash || '0')
    setIsSavingCashAction(true)
    setSaleMessage(null)

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${portalContext.business.id}/cash_register_session/force_close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cash_register_session: {
            cash_register_id: portalContext.cash_register.id,
            closed_by_id: actingUserId,
            counted_cash_cents: countedCashCents,
            closing_notes: cashCloseForm.closing_notes,
            force_close_reason: cashCloseForm.force_close_reason,
          },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo forzar cierre de caja')

      const { context, cashMovements: loadedCashMovements, sales: loadedSales } = await loadPortalData()
      setPortalContext(context)
      setCashMovements(loadedCashMovements)
      setSales(loadedSales)
      setCashMode('summary')
      setCashCloseForm(emptyCashCloseForm)
      setSaleMessage(`Cierre forzado registrado. Diferencia ${formatMoney(body.difference_cents || 0)}.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo forzar cierre de caja.')
    } finally {
      setIsSavingCashAction(false)
    }
  }

  if (!authSession) {
    return (
      <div className="login-shell">
        <section className="login-card">
          <div className="brand login-brand">
            <img src={hululLogo} alt="Hulul" />
          </div>
          <div className="login-copy">
            <p className="eyebrow">Hulul POS</p>
            <h1>Iniciar sesion</h1>
            <p>Accede para operar ventas, inventario y caja.</p>
          </div>
          <form
            className="product-form login-form"
            onSubmit={(event) => {
              event.preventDefault()
              void handleLogin()
            }}
          >
            <label>
              <span>Correo</span>
              <input
                autoComplete="username"
                onChange={(event) => setLoginEmail(event.target.value)}
                type="email"
                value={loginEmail}
              />
            </label>
            <label>
              <span>Contrasena</span>
              <input
                autoComplete="current-password"
                onChange={(event) => setLoginPassword(event.target.value)}
                type="password"
                value={loginPassword}
              />
            </label>
            <div className="actions-row form-actions">
              <button className="primary-button login-button" disabled={isLoggingIn} type="submit">
                {isLoggingIn ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
            {loginError ? <p className="sale-message form-message login-error">{loginError}</p> : null}
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className={isInternalConsole ? 'app-shell admin-console-shell' : 'app-shell'}>
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand">
          <img src={hululLogo} alt="Hulul" />
        </div>
        <div className={isInternalConsole ? 'tenant-switch admin-console-identity' : 'tenant-switch'}>
          {isInternalConsole ? (
            <>
              <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.1} />
              <div>
                <span>Consola interna</span>
                <strong>Administracion Hulul</strong>
                <small>{canManageAdminBusinesses ? 'Control total de empresas' : 'Consulta de empresas'}</small>
              </div>
            </>
          ) : canSwitchBusiness ? (
            <>
              <span>Negocio activo</span>
            <select
              aria-label="Cambiar negocio activo"
              onChange={(event) => changeActiveBusiness(event.target.value)}
              value={activeBusinessId}
            >
              {authSession.businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.commercial_name || 'Negocio sin nombre'}{business.status && business.status !== 'active' ? ` (${business.status})` : ''}
                </option>
              ))}
            </select>
            </>
          ) : (
            <>
              <span>Negocio activo</span>
              <strong>{businessName}</strong>
            </>
          )}
          {!isInternalConsole && activeRole ? <small>{roleLabels[activeRole as UserRole] || activeRole}</small> : null}
          {!isInternalConsole && !businessIsOperational ? <small>{businessStatusLabel}</small> : null}
        </div>
        <nav className="nav-list">
          {visibleNavItems.map(({ label, icon: Icon }) => (
            <button
              className={label === activeView || (label === 'Admin Hulul' && (Boolean(adminBusinessEditorId) || activeView === 'Detalle empresa')) ? 'active' : ''}
              disabled={isNavItemDisabled(label)}
              key={label}
              onClick={() => goToView(label)}
              type="button"
            >
              <Icon size={18} strokeWidth={2.2} />
              {isInternalConsole && label === 'Admin Hulul' ? 'Empresas' : renderNavLabel(label)}
            </button>
          ))}
        </nav>
        <div className="support-card">
          <span>Usuario</span>
          <strong>{authSession.user.name}</strong>
          <button className="text-button logout-button" onClick={handleLogout} type="button">Salir</button>
        </div>
      </aside>

      <main className="workspace">
        <div className="mobile-brandbar">
          <img src={hululLogo} alt="Hulul" />
          <div>
            <span>{isInternalConsole ? 'Administracion Hulul' : businessName}</span>
            <button
              aria-label="Abrir menu"
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              type="button"
            >
              <Menu size={20} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <header className="topbar">
          <div>
            <p className="eyebrow">{isInternalConsole ? 'Administracion Hulul' : businessName}</p>
            <h1>{isInternalConsole ? internalPageTitle : currentTitle}</h1>
          </div>
          <div className="status-strip">
            <span className={apiStatus === 'ready' ? 'status online' : 'status warning'}>
              {apiStatus === 'ready' ? 'En linea' : apiStatus === 'loading' ? 'Cargando' : 'Sin conexion'}
            </span>
            {isInternalConsole ? <span className="status admin-access-status"><ShieldCheck size={14} /> Acceso interno</span> : portalContext && portalContext.branches.length > 1 ? (
              <select className="status branch-switcher" aria-label="Cambiar sucursal activa" onChange={(event) => changeActivePortalBranch(event.target.value)} value={activePortalBranchId || portalContext.branch?.id || ''}>
                {portalContext.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            ) : <span className="status">{branchName}</span>}
            {!isInternalConsole && !businessIsOperational ? <span className="status warning">{businessStatusLabel}</span> : null}
            <button
              className="user-chip user-chip-button"
              onClick={isInternalConsole ? () => goToView('Mi perfil') : undefined}
              type="button"
              title={authSession.user.email}
            >
              {userInitials}
            </button>
          </div>
        </header>

        {!isInternalConsole && !businessIsOperational ? (
          <section className="setup-banner business-status-banner" role="status">
            <div>
              <strong>{businessStatusLabel}</strong>
              <span>El portal queda en modo consulta. Un Admin Hulul debe activar la empresa para operar ventas, caja e inventario.</span>
            </div>
          </section>
        ) : null}

        {activeView === 'Admin Hulul' ? (
          <section className="module-view admin-businesses-view">
            <article className="module-card wide-card">
              <div className="products-command customers-command">
                <div>
                  <p className="eyebrow">Directorio de clientes</p>
                  <h2>Estado de las empresas</h2>
                </div>
                <div className="actions-row admin-directory-actions">
                  <button className="secondary-button" disabled={isLoadingAdminBusinesses} onClick={() => void loadAdminBusinesses()} type="button">
                    {isLoadingAdminBusinesses ? 'Cargando...' : 'Actualizar'}
                  </button>
                  {canManageAdminBusinesses ? (
                    <button className="primary-button" onClick={openNewAdminBusiness} type="button">
                      <Plus size={17} strokeWidth={2.4} /> Nueva empresa
                    </button>
                  ) : null}
                </div>
              </div>

              {saleMessage && activeView === 'Admin Hulul' ? <p className="sale-message list-message">{saleMessage}</p> : null}

              <div className="admin-summary-grid">
                <article className="metric-card">
                  <span>Activas</span>
                  <strong>{adminBusinessStatusCounts.active}</strong>
                  <small>operan normal</small>
                </article>
                <article className="metric-card">
                  <span>Suspendidas</span>
                  <strong>{adminBusinessStatusCounts.suspended}</strong>
                  <small>solo consulta</small>
                </article>
                <article className="metric-card">
                  <span>Canceladas</span>
                  <strong>{adminBusinessStatusCounts.cancelled}</strong>
                  <small>sin operacion</small>
                </article>
              </div>

              <label className="search-box products-search">
                <span>Buscar empresa</span>
                <input
                  onChange={(event) => setAdminBusinessQuery(event.target.value)}
                  placeholder="Nombre, RFC, contacto, email o estado"
                  value={adminBusinessQuery}
                />
              </label>

              <div className="product-list-meta">
                <span>{filteredAdminBusinesses.length} de {adminBusinesses.length} empresas</span>
                <button className="icon-button" onClick={() => setAdminBusinessQuery('')} type="button" aria-label="Limpiar busqueda">
                  <MoreHorizontal size={17} strokeWidth={2.4} />
                </button>
              </div>

              <div className="product-card-list admin-business-list">
                {filteredAdminBusinesses.map((business) => (
                  <article className="product-list-card admin-business-card" key={business.id}>
                    <div className="product-main">
                      <span>{business.rfc || 'RFC pendiente'}</span>
                      <strong>{business.commercial_name || 'Empresa sin nombre'}</strong>
                      <small>{business.legal_name || business.primary_contact_name || 'Sin razon social'}</small>
                    </div>
                    <div className="product-facts">
                      <b className={business.status === 'active' ? 'stock-ok' : 'stock-alert'}>{businessStatusText(business.status)}</b>
                      <small>{business.branches_count} sucursales</small>
                    </div>
                    <div className="product-facts">
                      <b>{business.email || 'Sin email'}</b>
                      <small>{business.phone || business.primary_contact_name || 'Sin contacto'}</small>
                    </div>
                    <div className="admin-business-actions">
                      <label className="admin-status-control">
                        <span>Estado</span>
                        <select
                          disabled={!canManageAdminBusinesses || isUpdatingAdminBusinessId === business.id}
                          onChange={(event) => void updateAdminBusinessStatus(business, event.target.value as AdminBusiness['status'])}
                          value={business.status}
                        >
                          <option value="active">Activa</option>
                          <option value="suspended">Suspendida</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </label>
                      <button className="text-button admin-edit-button" onClick={() => void openAdminBusinessDetail(business.id)} type="button">
                        <Building2 size={14} strokeWidth={2.2} /> Administrar
                      </button>
                    </div>
                  </article>
                ))}
                {filteredAdminBusinesses.length === 0 ? (
                  <div className="empty-ticket">
                    <Building2 size={22} strokeWidth={2.1} />
                    <span>{isLoadingAdminBusinesses ? 'Cargando empresas...' : 'No hay empresas para ese criterio.'}</span>
                  </div>
                ) : null}
              </div>
            </article>
          </section>
        ) : null}

        {activeView === 'Detalle empresa' ? (
          <section className="module-view admin-business-detail-view">
            {isLoadingAdminBusinessDetail && !adminBusinessDetail ? (
              <article className="module-card admin-detail-loading">Cargando empresa...</article>
            ) : adminBusinessDetail ? (
              <article className="module-card admin-business-detail-page">
                <header className="admin-detail-hero">
                  <div className="admin-detail-heading">
                    <button className="secondary-button admin-back-button" onClick={() => goToView('Admin Hulul')} type="button">
                      <ArrowLeft size={17} strokeWidth={2.4} /> Empresas
                    </button>
                    <div>
                      <span>{adminBusinessDetail.rfc || 'RFC pendiente'}</span>
                      <h2>{adminBusinessDetail.commercial_name}</h2>
                      <p>{adminBusinessDetail.legal_name || 'Sin razon social registrada'}</p>
                    </div>
                  </div>
                  <div className="admin-detail-hero-actions">
                    <span className={`admin-detail-status ${adminBusinessDetail.status}`}>{businessStatusText(adminBusinessDetail.status)}</span>
                    {canManageAdminBusinesses ? (
                      <button className="secondary-button" onClick={() => openAdminBusinessEditor(adminBusinessDetail)} type="button">
                        <Pencil size={16} /> Editar datos
                      </button>
                    ) : null}
                  </div>
                </header>

                <nav className="admin-detail-tabs" aria-label="Secciones de empresa">
                  {([
                    ['summary', 'Resumen'],
                    ['branches', `Sucursales (${adminBusinessDetail.branches.length})`],
                    ['users', `Usuarios (${adminBusinessDetail.users.length})`],
                    ['license', 'Licencia'],
                  ] as const).map(([tab, label]) => (
                    <button className={adminDetailTab === tab ? 'active' : ''} key={tab} onClick={() => {
                      setAdminDetailTab(tab)
                      setAdminBranchEditorId(null)
                      setAdminUserEditorId(null)
                      setSaleMessage(null)
                    }} type="button">{label}</button>
                  ))}
                </nav>

                {saleMessage ? <p className="sale-message admin-detail-message">{saleMessage}</p> : null}

                {adminDetailTab === 'summary' ? (
                  <div className="admin-detail-content">
                    <div className="admin-topology-strip">
                      <div>
                        <span>Catalogo</span>
                        <strong>Productos compartidos</strong>
                        <small>SKU, precios y datos maestros pertenecen a la empresa.</small>
                      </div>
                      <div className="admin-topology-line" aria-hidden="true" />
                      <div>
                        <span>Operacion</span>
                        <strong>Inventario por sucursal</strong>
                        <small>Existencias, ventas, compras y cajas quedan separadas.</small>
                      </div>
                    </div>
                    <div className="admin-detail-metrics">
                      <div><span>Sucursales</span><strong>{adminBusinessDetail.branches.length}</strong><small>{adminBusinessDetail.branches.filter((branch) => branch.active).length} activas</small></div>
                      <div><span>Usuarios</span><strong>{adminBusinessDetail.users.length}</strong><small>{adminBusinessDetail.users.filter((user) => user.active).length} con acceso</small></div>
                      <div><span>Cajas</span><strong>{adminBusinessDetail.branches.reduce((total, branch) => total + branch.cash_registers.length, 0)}</strong><small>distribuidas por sucursal</small></div>
                    </div>
                    <section className="admin-contact-block">
                      <h3>Contacto principal</h3>
                      <dl>
                        <div><dt>Nombre</dt><dd>{adminBusinessDetail.primary_contact_name || 'Sin registrar'}</dd></div>
                        <div><dt>Email</dt><dd>{adminBusinessDetail.email || 'Sin registrar'}</dd></div>
                        <div><dt>Telefono</dt><dd>{adminBusinessDetail.phone || 'Sin registrar'}</dd></div>
                        <div><dt>WhatsApp</dt><dd>{adminBusinessDetail.whatsapp || 'Sin registrar'}</dd></div>
                      </dl>
                    </section>
                  </div>
                ) : null}

                {adminDetailTab === 'branches' ? (
                  <div className="admin-detail-content">
                    {adminBranchEditorId ? (
                      <form className="admin-subpage-form" onSubmit={(event) => { event.preventDefault(); void saveAdminBranch() }}>
                        <div className="admin-subpage-title">
                          <button className="secondary-button" onClick={() => setAdminBranchEditorId(null)} type="button"><ArrowLeft size={16} /> Sucursales</button>
                          <div><span>{adminBranchEditorId === 'new' ? 'Nueva operacion' : 'Configuracion'}</span><h3>{adminBranchEditorId === 'new' ? 'Crear sucursal' : 'Editar sucursal'}</h3></div>
                        </div>
                        <div className="admin-editor-grid">
                          <label><span>Nombre *</span><input autoFocus required value={adminBranchForm.name} onChange={(event) => setAdminBranchForm((form) => ({ ...form, name: event.target.value }))} /></label>
                          <label><span>Codigo *</span><input required value={adminBranchForm.code} onChange={(event) => setAdminBranchForm((form) => ({ ...form, code: event.target.value.toUpperCase() }))} /></label>
                          <label className="admin-editor-wide"><span>Direccion</span><input value={adminBranchForm.address} onChange={(event) => setAdminBranchForm((form) => ({ ...form, address: event.target.value }))} /></label>
                          <label><span>Zona horaria</span><input value={adminBranchForm.timezone} onChange={(event) => setAdminBranchForm((form) => ({ ...form, timezone: event.target.value }))} /></label>
                          <label><span>Moneda</span><input value={adminBranchForm.currency} onChange={(event) => setAdminBranchForm((form) => ({ ...form, currency: event.target.value }))} /></label>
                          <label className="admin-time-field"><span>Inicio de jornada</span><input aria-describedby="admin-day-start-help" step="900" type="time" value={adminBranchForm.operational_day_start_minute} onChange={(event) => setAdminBranchForm((form) => ({ ...form, operational_day_start_minute: event.target.value }))} /><small id="admin-day-start-help">Hora en que comienza el nuevo dia operativo.</small></label>
                          <label className="admin-check-field"><input checked={adminBranchForm.active} onChange={(event) => setAdminBranchForm((form) => ({ ...form, active: event.target.checked }))} type="checkbox" /><span>Sucursal activa</span></label>
                        </div>
                        {adminBranchEditorId === 'new' ? (
                          <section className="admin-form-section">
                            <h4>Primera caja</h4>
                            <p>Se crea junto con la sucursal para dejarla lista para operar.</p>
                            <div className="admin-editor-grid">
                              <label><span>Nombre de caja</span><input value={adminBranchForm.cash_register_name} onChange={(event) => setAdminBranchForm((form) => ({ ...form, cash_register_name: event.target.value }))} /></label>
                              <label><span>Codigo</span><input value={adminBranchForm.cash_register_code} onChange={(event) => setAdminBranchForm((form) => ({ ...form, cash_register_code: event.target.value }))} /></label>
                              <label><span>Ancho de ticket (mm)</span><input type="number" value={adminBranchForm.ticket_size} onChange={(event) => setAdminBranchForm((form) => ({ ...form, ticket_size: event.target.value }))} /></label>
                            </div>
                          </section>
                        ) : null}
                        <div className="admin-editor-footer"><button className="secondary-button" onClick={() => setAdminBranchEditorId(null)} type="button">Cancelar</button><button className="primary-button" disabled={isSavingAdminBranch} type="submit">{isSavingAdminBranch ? 'Guardando...' : 'Guardar sucursal'}</button></div>
                      </form>
                    ) : (
                      <>
                        <div className="admin-section-command"><div><span>Red operativa</span><h3>Sucursales e inventarios</h3><p>Cada sucursal conserva sus propias existencias, ventas, compras y cajas.</p></div>{canManageAdminBusinesses ? <button className="primary-button" onClick={openNewAdminBranch} type="button"><Plus size={16} /> Nueva sucursal</button> : null}</div>
                        <div className="admin-branch-list">
                          {adminBusinessDetail.branches.map((branch) => (
                            <article className="admin-branch-row" key={branch.id}>
                              <div className="admin-branch-code">{branch.code}</div>
                              <div className="admin-branch-main"><strong>{branch.name}</strong><span>{branch.address || 'Sin direccion'}</span><small>{branch.timezone} · {branch.currency}</small></div>
                              <div className="admin-branch-stat"><strong>{branch.inventory_products_count}</strong><span>productos con stock</span></div>
                              <div className="admin-branch-stat"><strong>{branch.cash_registers.length}</strong><span>{branch.cash_registers.map((register) => register.name).join(', ') || 'sin cajas'}</span></div>
                              <span className={`admin-detail-status ${branch.active ? 'active' : 'suspended'}`}>{branch.active ? 'Activa' : 'Inactiva'}</span>
                              {canManageAdminBusinesses ? <button className="icon-button" aria-label={`Editar ${branch.name}`} onClick={() => openAdminBranchEditor(branch)} type="button"><Pencil size={16} /></button> : null}
                            </article>
                          ))}
                          {adminBusinessDetail.branches.length === 0 ? <div className="admin-empty-state"><Building2 size={24} /><strong>Aun no hay sucursales</strong><span>Crea la primera para separar inventario y operacion.</span></div> : null}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {adminDetailTab === 'users' ? (
                  <div className="admin-detail-content">
                    {adminUserEditorId ? (
                      <form className="admin-subpage-form" onSubmit={(event) => { event.preventDefault(); void saveAdminUser() }}>
                        <div className="admin-subpage-title"><button className="secondary-button" onClick={() => setAdminUserEditorId(null)} type="button"><ArrowLeft size={16} /> Usuarios</button><div><span>Acceso operativo</span><h3>{adminUserEditorId === 'new' ? 'Crear usuario' : 'Editar usuario'}</h3></div></div>
                        <div className="admin-editor-grid">
                          <label><span>Nombre *</span><input autoFocus required value={adminUserForm.name} onChange={(event) => setAdminUserForm((form) => ({ ...form, name: event.target.value }))} /></label>
                          <label><span>Email *</span><input required type="email" value={adminUserForm.email} onChange={(event) => setAdminUserForm((form) => ({ ...form, email: event.target.value }))} /></label>
                          <label><span>{adminUserEditorId === 'new' ? 'Contrasena temporal *' : 'Nueva contrasena (opcional)'}</span><input minLength={8} required={adminUserEditorId === 'new'} type="password" value={adminUserForm.password} onChange={(event) => setAdminUserForm((form) => ({ ...form, password: event.target.value }))} /></label>
                          <fieldset className="admin-access-type admin-editor-wide"><legend>Tipo de acceso</legend><label><input checked={adminUserForm.access_type === 'member'} onChange={() => setAdminUserForm((form) => ({ ...form, access_type: 'member' }))} type="radio" /><span><strong>Usuario de sucursal</strong><small>Su rol se define por cada sucursal asignada.</small></span></label><label><input checked={adminUserForm.access_type === 'owner'} onChange={() => setAdminUserForm((form) => ({ ...form, access_type: 'owner', branch_assignments: [] }))} type="radio" /><span><strong>Propietario</strong><small>Acceso global a toda la empresa.</small></span></label></fieldset>
                          <label className="admin-check-field"><input checked={adminUserForm.active} onChange={(event) => setAdminUserForm((form) => ({ ...form, active: event.target.checked }))} type="checkbox" /><span>Acceso activo</span></label>
                        </div>
                        <section className="admin-form-section admin-access-section">
                          <h4>Acceso por sucursal</h4>
                          {adminUserForm.access_type === 'owner' ? <p className="admin-owner-note"><ShieldCheck size={17} /> El propietario tiene acceso a todas las sucursales.</p> : (
                            <div className="admin-branch-access-list">
                              {adminBusinessDetail.branches.map((branch) => {
                                const assignment = adminUserForm.branch_assignments.find((item) => item.branch_id === branch.id)
                                return <div className={assignment ? 'selected' : ''} key={branch.id}>
                                  <label><input checked={Boolean(assignment)} onChange={() => toggleAdminUserBranch(branch.id)} type="checkbox" /><span><strong>{branch.name}</strong><small>{branch.code}</small></span></label>
                                  {assignment ? <select value={assignment.role} onChange={(event) => setAdminUserForm((form) => ({ ...form, branch_assignments: form.branch_assignments.map((item) => item.branch_id === branch.id ? { ...item, role: event.target.value as AdminBranchAssignment['role'] } : item) }))}><option value="manager">Gerente</option><option value="cashier">Cajero</option><option value="warehouse">Almacén</option></select> : null}
                                </div>
                              })}
                              {adminBusinessDetail.branches.length === 0 ? <p>Primero crea una sucursal.</p> : null}
                            </div>
                          )}
                        </section>
                        <div className="admin-editor-footer"><button className="secondary-button" onClick={() => setAdminUserEditorId(null)} type="button">Cancelar</button><button className="primary-button" disabled={isSavingAdminUser || (adminUserForm.access_type === 'member' && adminUserForm.branch_assignments.length === 0)} type="submit">{isSavingAdminUser ? 'Guardando...' : 'Guardar usuario'}</button></div>
                      </form>
                    ) : (
                      <>
                        <div className="admin-section-command"><div><span>Equipo</span><h3>Usuarios y permisos</h3><p>El rol puede cambiar por sucursal; propietarios acceden a toda la empresa.</p></div>{canManageAdminBusinesses ? <button className="primary-button" onClick={openNewAdminUser} type="button"><Plus size={16} /> Nuevo usuario</button> : null}</div>
                        <div className="admin-user-list">
                          {adminBusinessDetail.users.map((user) => (
                            <article className="admin-user-row" key={user.membership_id}>
                              <div className="profile-avatar admin-user-avatar">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                              <div><strong>{user.name}</strong><span>{user.email}</span></div>
                              <div><strong>{user.role === 'owner' ? 'Propietario' : 'Usuario de sucursal'}</strong><span>{user.role === 'owner' ? 'Todas las sucursales' : user.branch_assignments.map((assignment) => `${assignment.branch_name} · ${roleLabels[assignment.role]}`).join(', ') || 'Sin sucursales'}</span></div>
                              <span className={`admin-detail-status ${user.active ? 'active' : 'suspended'}`}>{user.active ? 'Activo' : 'Inactivo'}</span>
                              {canManageAdminBusinesses ? <button className="icon-button" aria-label={`Editar ${user.name}`} onClick={() => openAdminUserEditor(user)} type="button"><Pencil size={16} /></button> : null}
                            </article>
                          ))}
                          {adminBusinessDetail.users.length === 0 ? <div className="admin-empty-state"><Users size={24} /><strong>Aun no hay usuarios</strong><span>Crea al propietario o al primer operador de la empresa.</span></div> : null}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {adminDetailTab === 'license' ? (
                  <div className="admin-detail-content admin-license-content">
                    <div><span>Estado de licencia</span><strong>{adminBusinessDetail.license_status || 'Sin definir'}</strong></div>
                    <div><span>Fin de prueba</span><strong>{adminBusinessDetail.trial_ends_at ? new Date(adminBusinessDetail.trial_ends_at).toLocaleDateString('es-MX') : 'Sin fecha'}</strong></div>
                    <div><span>Vencimiento</span><strong>{adminBusinessDetail.license_expires_at ? new Date(adminBusinessDetail.license_expires_at).toLocaleDateString('es-MX') : 'Sin fecha'}</strong></div>
                    {canManageAdminBusinesses ? <button className="secondary-button" onClick={() => openAdminBusinessEditor(adminBusinessDetail)} type="button"><Pencil size={16} /> Modificar licencia</button> : null}
                  </div>
                ) : null}
              </article>
            ) : (
              <article className="module-card admin-detail-loading">No se pudo mostrar la empresa.</article>
            )}
          </section>
        ) : null}

        {adminBusinessEditorId ? (
          <section className="module-view admin-business-editor-view">
            <article aria-label={adminBusinessEditorId === 'new' ? 'Nueva empresa' : 'Editar empresa'} className="module-card admin-business-editor-page">
              <div className="admin-editor-header">
                <button className="secondary-button admin-back-button" onClick={closeAdminBusinessEditor} type="button">
                  <ArrowLeft size={17} strokeWidth={2.4} /> Empresas
                </button>
                <div>
                  <span>{adminBusinessEditorId === 'new' ? 'Alta de empresa' : 'Datos de empresa'}</span>
                  <h2>{adminBusinessEditorId === 'new' ? 'Nueva empresa' : 'Editar empresa'}</h2>
                </div>
              </div>

              <form
                className="admin-editor-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void saveAdminBusiness()
                }}
              >
                <section>
                  <h3>Identidad fiscal</h3>
                  <div className="admin-editor-grid">
                    <label className="admin-editor-wide">
                      <span>Nombre comercial *</span>
                      <input autoFocus onChange={(event) => setAdminBusinessForm((form) => ({ ...form, commercial_name: event.target.value }))} required value={adminBusinessForm.commercial_name} />
                    </label>
                    <label className="admin-editor-wide">
                      <span>Razon social</span>
                      <input onChange={(event) => setAdminBusinessForm((form) => ({ ...form, legal_name: event.target.value }))} value={adminBusinessForm.legal_name} />
                    </label>
                    <label>
                      <span>RFC</span>
                      <input onChange={(event) => setAdminBusinessForm((form) => ({ ...form, rfc: event.target.value.toUpperCase() }))} value={adminBusinessForm.rfc} />
                    </label>
                    <label>
                      <span>Estado</span>
                      <select onChange={(event) => setAdminBusinessForm((form) => ({ ...form, status: event.target.value as AdminBusiness['status'] }))} value={adminBusinessForm.status}>
                        <option value="active">Activa</option>
                        <option value="suspended">Suspendida</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section>
                  <h3>Contacto</h3>
                  <div className="admin-editor-grid">
                    <label className="admin-editor-wide">
                      <span>Contacto principal</span>
                      <input onChange={(event) => setAdminBusinessForm((form) => ({ ...form, primary_contact_name: event.target.value }))} value={adminBusinessForm.primary_contact_name} />
                    </label>
                    <label>
                      <span>Telefono</span>
                      <input onChange={(event) => setAdminBusinessForm((form) => ({ ...form, phone: event.target.value }))} value={adminBusinessForm.phone} />
                    </label>
                    <label>
                      <span>WhatsApp</span>
                      <input onChange={(event) => setAdminBusinessForm((form) => ({ ...form, whatsapp: event.target.value }))} value={adminBusinessForm.whatsapp} />
                    </label>
                    <label className="admin-editor-wide">
                      <span>Email</span>
                      <input onChange={(event) => setAdminBusinessForm((form) => ({ ...form, email: event.target.value }))} type="email" value={adminBusinessForm.email} />
                    </label>
                  </div>
                </section>

                <section>
                  <h3>Licencia</h3>
                  <div className="admin-editor-grid">
                    <label>
                      <span>Tipo de licencia</span>
                      <select onChange={(event) => setAdminBusinessForm((form) => ({ ...form, license_status: event.target.value as AdminBusinessForm['license_status'] }))} value={adminBusinessForm.license_status}>
                        <option value="trial">Prueba</option>
                        <option value="active">Activa</option>
                        <option value="suspended">Suspendida</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </label>
                    <label>
                      <span>Fin de prueba</span>
                      <input onChange={(event) => setAdminBusinessForm((form) => ({ ...form, trial_ends_at: event.target.value }))} type="date" value={adminBusinessForm.trial_ends_at} />
                    </label>
                    <label className="admin-editor-wide">
                      <span>Vencimiento de licencia</span>
                      <input onChange={(event) => setAdminBusinessForm((form) => ({ ...form, license_expires_at: event.target.value }))} type="date" value={adminBusinessForm.license_expires_at} />
                    </label>
                  </div>
                </section>

                <div className="admin-editor-footer">
                  <button className="secondary-button" disabled={isSavingAdminBusiness} onClick={closeAdminBusinessEditor} type="button">Cancelar</button>
                  <button className="primary-button" disabled={isSavingAdminBusiness || !adminBusinessForm.commercial_name.trim()} type="submit">
                    {isSavingAdminBusiness ? 'Guardando...' : adminBusinessEditorId === 'new' ? 'Crear empresa' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </article>
          </section>
        ) : null}

        {activeView === 'Mi perfil' ? (
          <section className="module-view profile-view">
            <article className="module-card profile-card">
              <div className="profile-intro">
                <div className="profile-avatar" aria-hidden="true">{userInitials}</div>
                <div>
                  <h2>{authSession.user.name}</h2>
                  <p>{authSession.user.email}</p>
                  <span><ShieldCheck size={14} /> Cuenta interna de Hulul</span>
                </div>
              </div>

              <form
                className="profile-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void saveProfile()
                }}
              >
                <section>
                  <div className="profile-section-heading">
                    <h3>Datos personales</h3>
                    <p>Estos datos identifican tu cuenta dentro de la consola.</p>
                  </div>
                  <div className="profile-fields">
                    <label>
                      <span>Nombre</span>
                      <input autoComplete="name" onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))} required value={profileForm.name} />
                    </label>
                    <label>
                      <span>Correo</span>
                      <input autoComplete="email" onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))} required type="email" value={profileForm.email} />
                    </label>
                  </div>
                </section>

                <section>
                  <div className="profile-section-heading">
                    <h3>Cambiar contrasena</h3>
                    <p>Deja estos campos vacios si solo quieres actualizar tus datos.</p>
                  </div>
                  <div className="profile-fields">
                    <label className="profile-field-wide">
                      <span>Contrasena actual</span>
                      <input autoComplete="current-password" onChange={(event) => setProfileForm((form) => ({ ...form, current_password: event.target.value }))} type="password" value={profileForm.current_password} />
                    </label>
                    <label>
                      <span>Nueva contrasena</span>
                      <input autoComplete="new-password" minLength={8} onChange={(event) => setProfileForm((form) => ({ ...form, password: event.target.value }))} type="password" value={profileForm.password} />
                      <small>Minimo 8 caracteres.</small>
                    </label>
                    <label>
                      <span>Confirmar contrasena</span>
                      <input autoComplete="new-password" minLength={8} onChange={(event) => setProfileForm((form) => ({ ...form, password_confirmation: event.target.value }))} type="password" value={profileForm.password_confirmation} />
                    </label>
                  </div>
                </section>

                {profileError ? <p className="profile-feedback error" role="alert">{profileError}</p> : null}
                {profileMessage ? <p className="profile-feedback success" role="status">{profileMessage}</p> : null}

                <div className="profile-actions">
                  <button className="primary-button" disabled={isSavingProfile || !profileForm.name.trim() || !profileForm.email.trim()} type="submit">
                    {isSavingProfile ? 'Guardando...' : 'Guardar perfil'}
                  </button>
                </div>
              </form>
            </article>
          </section>
        ) : null}

        {activeView === 'Bitacora' ? (
          <section className="module-view audit-events-view">
            <article className="module-card wide-card">
              <div className="products-command customers-command">
                <div>
                  <p className="eyebrow">Auditoria</p>
                  <h2>Bitacora</h2>
                </div>
                <button className="secondary-button" onClick={() => void loadPortalData().then(({ auditEvents: loadedAuditEvents }) => setAuditEvents(loadedAuditEvents))} type="button">
                  Actualizar
                </button>
              </div>

              <div className="admin-summary-grid audit-summary-grid">
                <article className="metric-card">
                  <span>Eventos</span>
                  <strong>{auditEventCounts.total}</strong>
                  <small>ultimos registros</small>
                </article>
                <article className="metric-card">
                  <span>Usuarios</span>
                  <strong>{auditEventCounts.users}</strong>
                  <small>roles y accesos</small>
                </article>
                <article className="metric-card">
                  <span>Sensibles</span>
                  <strong>{auditEventCounts.sensitive}</strong>
                  <small>cancelaciones y cierres</small>
                </article>
              </div>

              <div className="product-card-list audit-event-list">
                {auditEvents.map((event) => (
                  <article className="product-list-card audit-event-card" key={event.id}>
                    <div className="product-main">
                      <span>{event.auditable_type}</span>
                      <strong>{auditEventText(event.event_type)}</strong>
                      <small>{auditMetadataSummary(event.metadata)}</small>
                    </div>
                    <div className="product-facts">
                      <b>{event.actor?.name || 'Sistema'}</b>
                      <small>{event.actor?.email || 'Sin usuario'}</small>
                    </div>
                    <div className="product-facts">
                      <b>{new Date(event.created_at).toLocaleString('es-MX')}</b>
                      <small>{event.ip_address || 'Sin IP'}</small>
                    </div>
                  </article>
                ))}
                {auditEvents.length === 0 ? (
                  <div className="empty-ticket">
                    <ClipboardList size={22} strokeWidth={2.1} />
                    <span>No hay eventos de auditoria todavia.</span>
                  </div>
                ) : null}
              </div>
            </article>
          </section>
        ) : null}

        {onboardingLocked && activeView !== 'Admin Hulul' ? (
          <section className="setup-banner" role="status">
            <div>
              <strong>Configuracion pendiente</strong>
              <span>
                {can('manage_branch_settings')
                  ? `Faltan ${pendingOnboardingCount} puntos. Siguiente accion: ${firstPendingStep?.label || 'Configuracion pendiente'}`
                  : 'La sucursal aun no esta lista para operar. Solicita la configuracion al propietario o gerente.'}
              </span>
            </div>
            {can('manage_branch_settings') ? (
              <button className="secondary-button" onClick={() => goToView('Configuracion')} type="button">
                Revisar
              </button>
            ) : null}
          </section>
        ) : null}

        {!isInternalConsole && !isProductWorkspace && !onboardingLocked && activeView !== 'Configuracion' && activeView !== 'Admin Hulul' && activeView !== 'Mi perfil' && activeView !== 'Bitacora' ? (
          <section className="metrics-grid" aria-label="Resumen operativo">
            {operationalMetrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.detail}</small>
              </article>
            ))}
          </section>
        ) : null}

	        {!onboardingLocked && (activeView === 'Venta' || activeView === 'Inicio') ? (
	        <section className="pos-grid">
		          <article className="sale-panel">
		            <div className="section-header">
		              <div>
		                <p className="eyebrow">Venta rapida</p>
		                <h2>
		                  {activeView === 'Venta' && saleView === 'history'
		                    ? 'Historial de ventas'
		                    : activeView === 'Venta' && saleView === 'detail'
		                      ? 'Detalle de venta'
		                      : saleStage === 'payment'
		                        ? 'Cobro'
		                        : saleStage === 'success'
		                          ? 'Ticket final'
		                          : 'Ticket actual'}
		                </h2>
		              </div>
		              {activeView === 'Venta' && saleView !== 'pos' ? (
		                <button className="secondary-button" onClick={() => { setSaleView('history'); setSelectedSale(null) }} type="button">
		                  {saleView === 'detail' ? 'Volver' : 'Actualizar'}
		                </button>
		              ) : saleStage === 'cart' ? (
		                <button className="secondary-button" onClick={() => showPendingFeature('Cotizaciones')} type="button">Guardar cotizacion</button>
		              ) : (
		                <button className="secondary-button" onClick={resetCheckout} type="button">Volver</button>
		              )}
		            </div>

		            {activeView === 'Venta' ? (
		              <div className="filter-chips sale-tabs" aria-label="Vistas de venta">
		                <button className={saleView === 'pos' ? 'active' : ''} onClick={() => setSaleView('pos')} type="button">
		                  POS
		                </button>
		                <button className={saleView === 'history' ? 'active' : ''} onClick={() => { setSaleView('history'); setSelectedSale(null) }} type="button">
		                  Historial <span>{sales.length}</span>
		                </button>
		              </div>
		            ) : null}

		            {isSalePosView ? (
		              <>
		            {saleStage === 'cart' ? (
		              <div className={isCashOpen ? 'pos-cart-surface' : 'pos-cart-surface locked'}>
                  {!isCashOpen ? (
                    <div className="cash-lock-banner" role="status">
                      <div>
                        <strong>{isCashPendingClose ? 'Caja pendiente de cierre' : 'Caja cerrada'}</strong>
                        <span>{isCashPendingClose ? 'Cierra o fuerza el cierre antes de vender.' : 'Abre caja para buscar productos y empezar a vender.'}</span>
                      </div>
                      {isCashPendingClose ? (
                        <button className="primary-button" onClick={() => { setActiveView('Caja'); setCashMode('close') }} type="button">
                          Ir a cierre
                        </button>
                      ) : (
                        <button className="primary-button" disabled={!can('open_cash_register')} onClick={openCashFromPos} type="button">
                          Abrir caja
                        </button>
                      )}
                    </div>
                  ) : null}
		              <>
		                <label className="search-box">
	                  <span>Buscar producto</span>
	                  <input
	                    disabled={!isCashOpen}
	                    onChange={(event) => setSearchQuery(event.target.value)}
	                    placeholder="SKU, codigo de barras o nombre"
	                    value={searchQuery}
	                  />
	                </label>

	                <div className="product-results" aria-label="Resultados de busqueda">
	                  {searchResults.map((product) => (
	                    <button
	                      className="product-result"
	                      disabled={!isCashOpen || product.stock_status === 'out'}
	                      key={product.id}
	                      onClick={() => addProductToCart(product)}
	                      type="button"
	                    >
	                      <span>
	                        <strong>{product.name}</strong>
	                        <small>{product.sku} · Stock {formatQuantity(Number(product.stock_quantity))} {product.base_unit.abbreviation}</small>
	                      </span>
	                      <b>{formatMoney(product.sale_price_cents)}</b>
	                      <Plus size={17} strokeWidth={2.4} />
	                    </button>
	                  ))}
	                </div>

	                <div className="ticket-list">
	                  {ticketItems.length === 0 && (
	                    <div className="empty-ticket">
	                      <ShoppingCart size={22} strokeWidth={2.1} />
	                      <span>Agrega productos para iniciar la venta.</span>
	                    </div>
	                  )}

	                  {ticketItems.map((item) => (
	                    <div className="ticket-row" key={item.sku}>
	                      <div>
	                        <span>{item.sku}</span>
	                        <strong>{item.name}</strong>
	                        <small className="line-note">{item.unitPrice} / {item.unit}</small>
	                        {item.quantity > item.stockQuantity && <small>Stock disponible: {formatQuantity(item.stockQuantity)}</small>}
	                      </div>
	                      <div className="quantity-control">
	                        <button aria-label={`Restar ${item.name}`} disabled={!isCashOpen} onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} type="button">
	                          <Minus size={15} strokeWidth={2.4} />
	                        </button>
	                        <input
	                          aria-label={`Cantidad ${item.name}`}
	                          disabled={!isCashOpen}
	                          min="0"
	                          onChange={(event) => updateCartQuantity(item.productId, Number(event.target.value))}
	                          step={products.find((product) => product.id === item.productId)?.allows_fractional_sale ? '0.01' : '1'}
	                          type="number"
	                          value={item.quantity}
	                        />
	                        <button aria-label={`Sumar ${item.name}`} disabled={!isCashOpen} onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} type="button">
	                          <Plus size={15} strokeWidth={2.4} />
	                        </button>
	                      </div>
	                      <b>{item.total}</b>
	                      <button aria-label={`Quitar ${item.name}`} className="remove-line" disabled={!isCashOpen} onClick={() => updateCartQuantity(item.productId, 0)} type="button">
	                        <Trash2 size={16} strokeWidth={2.3} />
	                      </button>
	                    </div>
	                  ))}
	                </div>
	              </>
	            </div>
	            ) : null}

	            {saleStage === 'payment' ? (
	              <form
	                className="product-form checkout-form"
	                onSubmit={(event) => {
	                  event.preventDefault()
	                  void handleCharge()
	                }}
	              >
	                <div className="form-title">
	                  <strong>Metodo de pago</strong>
	                  <span>Total {formatMoney(ticketTotalCents)}</span>
	                </div>
                  <label>
                    <span>Cliente</span>
                    <select
                      onChange={(event) => setCheckoutForm((form) => ({ ...form, customer_id: event.target.value }))}
                      required
                      value={checkoutForm.customer_id}
                    >
                      <option value="">Selecciona cliente</option>
                      {customers.filter((customer) => customer.active).map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.commercial_name}</option>
                      ))}
                    </select>
                  </label>
	                <div className="filter-chips payment-tabs" aria-label="Metodos de pago">
	                  {[
	                    { key: 'cash', label: 'Efectivo' },
	                    { key: 'card', label: 'Tarjeta' },
	                    { key: 'transfer', label: 'Transferencia' },
	                    { key: 'mixed', label: 'Mixto' },
	                  ].map((option) => (
	                    <button
	                      className={checkoutForm.method === option.key ? 'active' : ''}
	                      key={option.key}
	                      onClick={() => setCheckoutForm((form) => ({ ...form, method: option.key as CheckoutMethod }))}
	                      type="button"
	                    >
	                      {option.label}
	                    </button>
	                  ))}
	                </div>

	                {checkoutForm.method === 'cash' ? (
	                  <>
	                    <label>
	                      <span>Recibido</span>
	                      <input
	                        min="0"
	                        onChange={(event) => setCheckoutForm((form) => ({ ...form, cash_received: event.target.value }))}
	                        required
	                        step="0.01"
	                        type="number"
	                        value={checkoutForm.cash_received}
	                      />
	                    </label>
	                    <div className="checkout-summary">
	                      <div><span>Total</span><strong>{formatMoney(ticketTotalCents)}</strong></div>
	                      <div><span>Cambio</span><strong>{formatMoney(checkoutChangeCents)}</strong></div>
	                    </div>
	                  </>
	                ) : null}

	                {checkoutForm.method === 'card' ? (
	                  <label>
	                    <span>Referencia</span>
	                    <input
	                      onChange={(event) => setCheckoutForm((form) => ({ ...form, card_reference: event.target.value }))}
	                      placeholder="Opcional"
	                      value={checkoutForm.card_reference}
	                    />
	                  </label>
	                ) : null}

	                {checkoutForm.method === 'transfer' ? (
	                  <label>
	                    <span>Referencia</span>
	                    <input
	                      onChange={(event) => setCheckoutForm((form) => ({ ...form, transfer_reference: event.target.value }))}
	                      placeholder="Folio o banco"
	                      value={checkoutForm.transfer_reference}
	                    />
	                  </label>
	                ) : null}

	                {checkoutForm.method === 'mixed' ? (
	                  <>
	                    <div className="form-grid-2">
	                      <label>
	                        <span>Efectivo</span>
	                        <input
	                          min="0"
	                          onChange={(event) => setCheckoutForm((form) => ({ ...form, mixed_cash_amount: event.target.value }))}
	                          step="0.01"
	                          type="number"
	                          value={checkoutForm.mixed_cash_amount}
	                        />
	                      </label>
	                      <label>
	                        <span>Recibido efectivo</span>
	                        <input
	                          min="0"
	                          onChange={(event) => setCheckoutForm((form) => ({ ...form, mixed_cash_received: event.target.value }))}
	                          step="0.01"
	                          type="number"
	                          value={checkoutForm.mixed_cash_received}
	                        />
	                      </label>
	                    </div>
	                    <div className="form-grid-2">
	                      <label>
	                        <span>Tarjeta</span>
	                        <input
	                          min="0"
	                          onChange={(event) => setCheckoutForm((form) => ({ ...form, mixed_card_amount: event.target.value, method: 'mixed' }))}
	                          step="0.01"
	                          type="number"
	                          value={checkoutForm.mixed_card_amount}
	                        />
	                      </label>
	                      <label>
	                        <span>Ref tarjeta</span>
	                        <input
	                          onChange={(event) => setCheckoutForm((form) => ({ ...form, mixed_card_reference: event.target.value }))}
	                          value={checkoutForm.mixed_card_reference}
	                        />
	                      </label>
	                    </div>
	                    <div className="form-grid-2">
	                      <label>
	                        <span>Transferencia</span>
	                        <input
	                          min="0"
	                          onChange={(event) => setCheckoutForm((form) => ({ ...form, mixed_transfer_amount: event.target.value }))}
	                          step="0.01"
	                          type="number"
	                          value={checkoutForm.mixed_transfer_amount}
	                        />
	                      </label>
	                      <label>
	                        <span>Ref transferencia</span>
	                        <input
	                          onChange={(event) => setCheckoutForm((form) => ({ ...form, mixed_transfer_reference: event.target.value }))}
	                          value={checkoutForm.mixed_transfer_reference}
	                        />
	                      </label>
	                    </div>
	                    <div className="checkout-summary">
	                      <div><span>Aplicado</span><strong>{formatMoney(mixedPaidCents)}</strong></div>
	                      <div><span>Pendiente</span><strong>{formatMoney(mixedPendingCents)}</strong></div>
	                      <div><span>Cambio</span><strong>{formatMoney(mixedChangeCents)}</strong></div>
	                    </div>
	                  </>
	                ) : null}

	                <div className="actions-row form-actions">
	                  <button className="ghost-button" onClick={() => setSaleStage('cart')} type="button">Volver</button>
	                  <button className="primary-button" disabled={isCharging} type="submit">
	                    {isCharging ? 'Cobrando...' : 'Confirmar cobro'}
	                  </button>
	                </div>
	              </form>
	            ) : null}

	            {saleStage === 'success' && completedSale ? (
	              <div className="checkout-ticket">
	                <div className="checkout-summary ticket-summary">
	                  <div><span>Folio</span><strong>{completedSale.folio}</strong></div>
	                  <div><span>Fecha</span><strong>{new Date(completedSale.created_at).toLocaleString('es-MX')}</strong></div>
	                  <div><span>Total</span><strong>{formatMoney(completedSale.total_cents)}</strong></div>
	                </div>
                  <div className="checkout-summary ticket-summary">
                    <div><span>Cliente</span><strong>{completedSale.customer?.commercial_name || 'Sin cliente'}</strong></div>
                  </div>
	                <div className="movement-list">
	                  {completedSale.items.map((item) => (
	                    <article className="movement-row" key={item.id}>
	                      <div>
	                        <span>{item.sku}</span>
	                        <strong>{item.product_name}</strong>
	                        <small>{item.quantity} {item.unit}</small>
	                      </div>
	                      <b className="movement-positive">{formatMoney(item.total_cents)}</b>
	                      <small />
	                    </article>
	                  ))}
	                </div>
	                <div className="movement-list payments-list">
	                  {completedSale.payments.map((payment) => (
	                    <article className="movement-row" key={payment.id}>
	                      <div>
	                        <span>{payment.payment_method === 'cash' ? 'Efectivo' : payment.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}</span>
	                        <strong>{formatMoney(payment.amount_cents)}</strong>
	                        <small>{payment.reference || 'Sin referencia'}</small>
	                      </div>
	                      <b className="movement-positive">{formatMoney(payment.change_amount_cents)}</b>
	                      <small>Cambio</small>
	                    </article>
	                  ))}
	                </div>
	                <div className="actions-row form-actions">
	                  <button className="ghost-button" onClick={resetCheckout} type="button">Cerrar ticket</button>
	                  <button
	                    className="primary-button"
	                    onClick={() => printSaleReceipt(completedSale)}
	                    type="button"
	                  >
	                    Imprimir
	                  </button>
		                </div>
		              </div>
		            ) : null}
              </>
            ) : null}

		            {saleView === 'history' ? (
		              <div className="product-list-view sales-history-view">
		                <label className="search-box products-search">
		                  <span>Buscar venta</span>
		                  <input
		                    onChange={(event) => setSaleHistoryQuery(event.target.value)}
		                    placeholder="Folio, SKU, producto o cajero"
		                    value={saleHistoryQuery}
		                  />
		                </label>
		                <div className="product-list-meta">
		                  <span>{filteredSales.length} de {sales.length} ventas</span>
		                  <button className="icon-button" onClick={() => setSaleHistoryQuery('')} type="button" aria-label="Limpiar busqueda">
		                    <MoreHorizontal size={17} strokeWidth={2.4} />
		                  </button>
		                </div>
		                <div className="product-card-list">
		                  {filteredSales.map((sale) => (
		                    <article className="product-list-card sale-history-card" key={sale.id}>
		                      <div className="product-main">
		                        <span>{sale.folio}</span>
		                        <strong>{sale.items[0]?.product_name || 'Venta'}</strong>
		                        <small>{new Date(sale.created_at).toLocaleString('es-MX')} · {sale.cashier.name}</small>
		                      </div>
		                      <div className="product-facts">
		                        <b>{formatMoney(sale.total_cents)}</b>
		                        <small>{sale.payments.map((payment) => payment.payment_method).join(' + ')}</small>
		                      </div>
		                      <div className="row-actions">
		                        <button onClick={() => openSaleDetail(sale)} type="button">
		                          <Pencil size={16} strokeWidth={2.3} />
		                          <span>Ver</span>
		                        </button>
		                      </div>
		                    </article>
		                  ))}
		                  {filteredSales.length === 0 ? (
		                    <div className="empty-ticket">
		                      <ClipboardList size={22} strokeWidth={2.1} />
		                      <span>No hay ventas para ese criterio.</span>
		                    </div>
		                  ) : null}
		                </div>
		              </div>
		            ) : null}

		            {saleView === 'detail' && selectedSale ? (
		              <div className="checkout-ticket">
		                <div className="checkout-summary ticket-summary">
		                  <div><span>Folio</span><strong>{selectedSale.folio}</strong></div>
		                  <div><span>Fecha</span><strong>{new Date(selectedSale.created_at).toLocaleString('es-MX')}</strong></div>
		                  <div><span>Total</span><strong>{formatMoney(selectedSale.total_cents)}</strong></div>
		                </div>
		                <div className="checkout-summary ticket-summary">
		                  <div><span>Estado</span><strong>{selectedSale.status === 'cancelled' ? 'Cancelada' : 'Pagada'}</strong></div>
		                  <div><span>Cajero</span><strong>{selectedSale.cashier.name}</strong></div>
		                  <div><span>Pago</span><strong>{selectedSale.sale_type}</strong></div>
		                </div>
                    <div className="checkout-summary ticket-summary">
                      <div><span>Cliente</span><strong>{selectedSale.customer?.commercial_name || 'Sin cliente'}</strong></div>
                    </div>
		                {selectedSale.status === 'cancelled' ? (
		                  <div className="checkout-summary ticket-summary">
		                    <div><span>Cancelada</span><strong>{selectedSale.cancelled_at ? new Date(selectedSale.cancelled_at).toLocaleString('es-MX') : 'Sin fecha'}</strong></div>
		                    <div><span>Por</span><strong>{selectedSale.cancelled_by?.name || 'Sin usuario'}</strong></div>
		                    <div><span>Motivo</span><strong>{selectedSale.cancellation_reason || 'Sin motivo'}</strong></div>
		                  </div>
		                ) : null}
		                <div className="movement-list">
		                  {selectedSale.items.map((item) => (
		                    <article className="movement-row" key={item.id}>
		                      <div>
		                        <span>{item.sku}</span>
		                        <strong>{item.product_name}</strong>
		                        <small>{item.quantity} {item.unit}</small>
		                      </div>
		                      <b className="movement-positive">{formatMoney(item.total_cents)}</b>
		                      <small />
		                    </article>
		                  ))}
		                </div>
		                <div className="movement-list payments-list">
		                  {selectedSale.payments.map((payment) => (
		                    <article className="movement-row" key={payment.id}>
		                      <div>
		                        <span>{payment.payment_method === 'cash' ? 'Efectivo' : payment.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}</span>
		                        <strong>{formatMoney(payment.amount_cents)}</strong>
		                        <small>{payment.reference || 'Sin referencia'}</small>
		                      </div>
		                      <b className="movement-positive">{formatMoney(payment.change_amount_cents)}</b>
		                      <small>Cambio</small>
		                    </article>
		                  ))}
		                </div>
                    <div className="actions-row form-actions">
                      <button className="ghost-button" onClick={() => printSaleReceipt(selectedSale)} type="button">
                        Imprimir ticket
                      </button>
                    </div>
		                {selectedSale.status !== 'cancelled' ? (
		                  <form
		                    className="product-form sale-cancel-form"
		                    onSubmit={(event) => {
		                      event.preventDefault()
		                      void cancelSelectedSale()
		                    }}
		                  >
		                    <div className="form-title">
		                      <strong>Cancelar venta</strong>
		                      <span>{cashSession ? 'Con devolucion si aplica' : 'Requiere caja abierta si hubo efectivo'}</span>
		                    </div>
		                    <label>
		                      <span>Motivo de cancelacion</span>
		                      <input
		                        onChange={(event) => setSaleCancelReason(event.target.value)}
		                        placeholder="Ej. error de captura, cliente cancelo"
		                        required
		                        value={saleCancelReason}
		                      />
		                    </label>
		                    <div className="actions-row form-actions">
		                      <button className="ghost-button" onClick={() => setSaleView('history')} type="button">Volver</button>
		                      <button className="primary-button" disabled={isCancellingSale || !can('cancel_sale')} type="submit">
		                        {isCancellingSale ? 'Cancelando...' : 'Cancelar venta'}
		                      </button>
		                    </div>
		                  </form>
		                ) : null}
		              </div>
		            ) : null}

		            {isSalePosView ? (
		            <div className="total-box">
		              <div>
		                <span>IVA incluido</span>
		                <strong>Total</strong>
		              </div>
		              <b>{formatMoney(displayedSaleTotalCents)}</b>
		            </div>
		            ) : null}

		            {isSalePosView && saleStage === 'cart' ? (
		              <div className="actions-row">
		                <button className="ghost-button" onClick={clearCart} type="button">Cancelar</button>
		                <button className="primary-button" disabled={isCheckoutActionDisabled} onClick={startCheckout} type="button">
		                  Ir a cobro
		                </button>
		              </div>
		            ) : null}
                {isSalePosView && saleStage === 'cart' && checkoutBlockerMessage ? (
                  <p className="sale-message checkout-hint">{checkoutBlockerMessage}</p>
                ) : null}
			            {saleMessage && <p className="sale-message">{saleMessage}</p>}
		          </article>

          <aside className="side-panel">
            <article className="module-card">
              <div className="section-header compact">
                <h2>Caja</h2>
                <span className={cashSession?.status === 'open' ? 'status success' : 'status warning'}>{cashStatus}</span>
              </div>
              <dl>
                <div>
                  <dt>Cajero</dt>
                  <dd>{cashierName}</dd>
                </div>
                <div>
                  <dt>Folio siguiente</dt>
                  <dd>{formattedFolio}</dd>
                </div>
                <div>
                  <dt>Efectivo esperado</dt>
                  <dd>{expectedCash}</dd>
                </div>
              </dl>
            </article>

            <article className="module-card">
              <div className="section-header compact">
                <h2>Alertas</h2>
                <button className="text-button" onClick={() => showPendingFeature('Alertas')} type="button">Ver todo</button>
              </div>
              <div className="alert-list">
                {stockAlerts.map((alert) => (
                  <div className="alert-row" key={alert.label}>
                    <span>{alert.label}</span>
                    <b>{alert.status}</b>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>
        ) : null}

        {activeView === 'Productos' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="filter-chips sale-tabs" aria-label="Secciones de productos">
                <button className={productSection === 'products' ? 'active' : ''} onClick={() => setProductSection('products')} type="button">
                  Productos <span>{products.length}</span>
                </button>
                <button className={productSection === 'import' ? 'active' : ''} onClick={() => setProductSection('import')} type="button">
                  Importar
                </button>
              </div>

              {productSection === 'products' ? (
                <>
                  {productMode === 'list' ? (
                    <div className="products-command">
                      <label className="search-box products-search">
                        <span>Buscar producto</span>
                        <input
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="SKU, codigo o nombre"
                          value={searchQuery}
                        />
                      </label>
                      <button className="primary-button new-product-button" disabled={!can('manage_products')} onClick={startNewProduct} type="button">
                        <Plus size={17} strokeWidth={2.4} />
                        Nuevo producto
                      </button>
                      <div className="filter-chips" aria-label="Filtros de productos">
                        {[
                          { key: 'all', label: 'Todos', count: productCounts.all },
                          { key: 'low', label: 'Bajo stock', count: productCounts.low },
                          { key: 'out', label: 'Agotados', count: productCounts.out },
                          { key: 'inactive', label: 'Inactivos', count: productCounts.inactive },
                        ].map((filter) => (
                          <button
                            className={productFilter === filter.key ? 'active' : ''}
                            key={filter.key}
                            onClick={() => setProductFilter(filter.key as typeof productFilter)}
                            type="button"
                          >
                            {filter.label} <span>{filter.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="section-header compact products-form-header">
                      <div>
                        <p className="eyebrow">Catalogo</p>
                        <h2>{productForm.id ? 'Editar producto' : 'Nuevo producto'}</h2>
                      </div>
                      <button className="secondary-button" onClick={() => setProductMode('list')} type="button">Volver</button>
                    </div>
                  )}

                  {productMode === 'form' ? (
                    <form
                      className="product-form"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void saveProduct()
                      }}
                    >
                      <div className="form-title">
                        <strong>{productForm.id ? 'Editar producto' : 'Nuevo producto'}</strong>
                        <span>{productForm.active ? 'Activo' : 'Inactivo'}</span>
                      </div>

                      <label>
                        <span>Nombre</span>
                        <input
                          onChange={(event) => setProductForm((form) => ({ ...form, name: event.target.value }))}
                          required
                          value={productForm.name}
                        />
                      </label>

                      <div className="form-grid-2">
                        <label>
                          <span>SKU</span>
                          <input
                            onChange={(event) => setProductForm((form) => ({ ...form, sku: event.target.value }))}
                            required
                            value={productForm.sku}
                          />
                        </label>
                        <label>
                          <span>Codigo</span>
                          <input
                            onChange={(event) => setProductForm((form) => ({ ...form, barcode: event.target.value }))}
                            value={productForm.barcode}
                          />
                        </label>
                      </div>

                      <div className="form-grid-2">
                        <label>
                          <span>Categoria</span>
                          <select
                            onChange={(event) => setProductForm((form) => ({ ...form, category_id: event.target.value }))}
                            required
                            value={productForm.category_id}
                          >
                            {catalogs.categories.map((category) => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Marca</span>
                          <div className="inline-action-field">
                            <input
                              list="brand-options"
                              onBlur={() => {
                                if (exactBrandMatch) {
                                  setProductForm((form) => ({ ...form, brand_id: exactBrandMatch.id }))
                                  setBrandQuery(exactBrandMatch.name)
                                }
                              }}
                              onChange={(event) => {
                                const value = event.target.value
                                const match = catalogs.brands.find((brand) => brand.name.trim().toLowerCase() === value.trim().toLowerCase())
                                setBrandQuery(value)
                                setProductForm((form) => ({ ...form, brand_id: match?.id || '' }))
                              }}
                              placeholder="Escribe para buscar o crear"
                              value={brandQuery}
                            />
                            <datalist id="brand-options">
                              {catalogs.brands.map((brand) => (
                                <option key={brand.id} value={brand.name} />
                              ))}
                            </datalist>
                            {canQuickAddBrand ? (
                              <button className="secondary-button inline-action-button" disabled={isQuickAddingBrand} onClick={() => void quickAddBrand()} type="button">
                                {isQuickAddingBrand ? 'Agregando...' : 'Agregar marca'}
                              </button>
                            ) : null}
                          </div>
                          <small className="field-hint">
                            {productForm.brand_id
                              ? 'Marca seleccionada.'
                              : brandQuery.trim()
                                ? 'La marca escrita no existe todavia.'
                                : 'Opcional.'}
                          </small>
                        </label>
                      </div>

                      <div className="form-grid-2">
                        <label>
                          <span>Unidad</span>
                          <select
                            onChange={(event) => setProductForm((form) => ({ ...form, base_unit_id: event.target.value }))}
                            required
                            value={productForm.base_unit_id}
                          >
                            {catalogs.units.map((unit) => (
                              <option key={unit.id} value={unit.id}>{unit.name}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Stock minimo</span>
                          <input
                            min="0"
                            onChange={(event) => setProductForm((form) => ({ ...form, minimum_stock: event.target.value }))}
                            step="0.01"
                            type="number"
                            value={productForm.minimum_stock}
                          />
                        </label>
                      </div>

                      <div className="form-grid-2">
                        <label>
                          <span>Precio venta</span>
                          <input
                            min="0"
                            onChange={(event) => setProductForm((form) => ({ ...form, sale_price: event.target.value }))}
                            required
                            step="0.01"
                            type="number"
                            value={productForm.sale_price}
                          />
                        </label>
                        <label>
                          <span>Costo</span>
                          <input
                            min="0"
                            onChange={(event) => setProductForm((form) => ({ ...form, current_cost: event.target.value }))}
                            step="0.01"
                            type="number"
                            value={productForm.current_cost}
                          />
                        </label>
                      </div>

                      <div className="form-grid-2">
                        <label>
                          <span>IVA</span>
                          <select
                            onChange={(event) => setProductForm((form) => ({ ...form, tax_mode: event.target.value as ProductForm['tax_mode'] }))}
                            value={productForm.tax_mode}
                          >
                            <option value="included">Incluido</option>
                            <option value="zero">0%</option>
                            <option value="exempt">Exento</option>
                          </select>
                        </label>
                        <label>
                          <span>Tasa</span>
                          <input
                            min="0"
                            onChange={(event) => setProductForm((form) => ({ ...form, tax_rate: event.target.value }))}
                            step="0.01"
                            type="number"
                            value={productForm.tax_rate}
                          />
                        </label>
                      </div>

                      <div className="form-grid-3">
                        <label>
                          <span>Pasillo</span>
                          <input
                            onChange={(event) => setProductForm((form) => ({ ...form, aisle_location: event.target.value }))}
                            value={productForm.aisle_location}
                          />
                        </label>
                        <label>
                          <span>Anaquel</span>
                          <input
                            onChange={(event) => setProductForm((form) => ({ ...form, shelf_location: event.target.value }))}
                            value={productForm.shelf_location}
                          />
                        </label>
                        <label>
                          <span>Gaveta</span>
                          <input
                            onChange={(event) => setProductForm((form) => ({ ...form, bin_location: event.target.value }))}
                            value={productForm.bin_location}
                          />
                        </label>
                      </div>

                      <div className="form-toggles">
                        <label>
                          <input
                            checked={productForm.allows_fractional_sale}
                            onChange={(event) => setProductForm((form) => ({ ...form, allows_fractional_sale: event.target.checked }))}
                            type="checkbox"
                          />
                          <span>Venta fraccionada</span>
                        </label>
                        <label>
                          <input
                            checked={productForm.active}
                            onChange={(event) => setProductForm((form) => ({ ...form, active: event.target.checked }))}
                            type="checkbox"
                          />
                          <span>Activo</span>
                        </label>
                      </div>

                      <div className="actions-row form-actions">
                        <button className="ghost-button" onClick={startNewProduct} type="button">Limpiar</button>
                        <button className="primary-button" disabled={isSavingProduct || !can('manage_products')} type="submit">
                          {isSavingProduct ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                      {saleMessage && activeView === 'Productos' && <p className="sale-message form-message">{saleMessage}</p>}
                    </form>
                  ) : (
                    <div className="product-list-view">
                      {saleMessage && activeView === 'Productos' && <p className="sale-message list-message">{saleMessage}</p>}
                      <div className="product-list-meta">
                        <span>{visibleProducts.length} de {products.length} productos</span>
                        <button className="icon-button" onClick={() => setSearchQuery('')} type="button" aria-label="Limpiar busqueda">
                          <MoreHorizontal size={17} strokeWidth={2.4} />
                        </button>
                      </div>
                      <div className="product-card-list">
                        {visibleProducts.map((product) => (
                          <article className="product-list-card" key={product.id}>
                            <div className="product-main">
                              <span>{product.sku}</span>
                              <strong>{product.name}</strong>
                              <small>{product.category || 'Sin categoria'} · {product.base_unit.abbreviation}</small>
                            </div>
                            <div className="product-facts">
                              <b>{formatMoney(product.sale_price_cents)}</b>
                              <span className={product.stock_status === 'ok' ? 'stock-ok' : product.stock_status === 'out' ? 'stock-out' : 'stock-alert'}>
                                {formatQuantity(Number(product.stock_quantity))}
                              </span>
                              <small>{product.active === false ? 'Inactivo' : 'Activo'}</small>
                            </div>
                            <div className="row-actions">
                              <button aria-label={`Editar ${product.name}`} disabled={!can('manage_products')} onClick={() => editProduct(product)} type="button">
                                <Pencil size={16} strokeWidth={2.3} />
                                <span>Editar</span>
                              </button>
                              <button aria-label={`Mas acciones ${product.name}`} disabled={!can('manage_products')} onClick={() => void toggleProductActive(product)} type="button">
                                <MoreHorizontal size={17} strokeWidth={2.4} />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="catalogs-layout">
                  {saleMessage && activeView === 'Productos' && <p className="sale-message list-message">{saleMessage}</p>}
                  <div className="products-command catalogs-command">
                    <div>
                      <p className="eyebrow">Carga masiva</p>
                      <h2>Importacion Excel</h2>
                    </div>
                    <button className="secondary-button" onClick={() => void downloadImportTemplate()} type="button">
                      Descargar plantilla
                    </button>
                  </div>

                  <div className="catalogs-grid">
                    <form
                      className="product-form catalog-form"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void previewImportFile()
                      }}
                    >
                      <div className="form-title">
                        <strong>Archivo de productos</strong>
                        <span>.xlsx o .csv</span>
                      </div>
                      <label>
                        <span>Seleccionar archivo</span>
                        <input
                          accept=".xlsx,.csv"
                          onChange={(event) => {
                            setImportFile(event.target.files?.[0] || null)
                            setImportPreviewRows([])
                            setImportPreviewErrors([])
                          }}
                          type="file"
                        />
                      </label>
                      <div className="actions-row form-actions">
                        <button className="ghost-button" onClick={resetImportState} type="button">Limpiar</button>
                        <button className="primary-button" disabled={isPreviewingImport || !importFile || !can('manage_products')} type="submit">
                          {isPreviewingImport ? 'Leyendo...' : 'Ver preview'}
                        </button>
                      </div>
                    </form>

                    <div className="product-list-view">
                      <div className="product-list-meta">
                        <span>{importPreviewRows.length} filas leidas</span>
                        <button className="primary-button" disabled={!can('manage_products') || !importFile || importPreviewErrors.length > 0 || isImportingProducts || importPreviewRows.length === 0} onClick={() => void commitImportFile()} type="button">
                          {isImportingProducts ? 'Importando...' : 'Confirmar importacion'}
                        </button>
                      </div>
                      {importPreviewErrors.length > 0 ? (
                        <div className="movement-list payments-list">
                          {importPreviewErrors.map((error) => (
                            <article className="movement-row" key={error}>
                              <div>
                                <span>Error</span>
                                <strong>{error}</strong>
                              </div>
                              <b className="movement-negative">Revisar</b>
                              <small />
                            </article>
                          ))}
                        </div>
                      ) : null}
                      <div className="product-card-list">
                        {importPreviewRows.map((row) => (
                          <article className="product-list-card catalog-list-card" key={`${row.row_number}-${row.sku}`}>
                            <div className="product-main">
                              <span>Fila {row.row_number} · {row.sku}</span>
                              <strong>{row.name}</strong>
                              <small>{row.category_name} · {row.unit_name}</small>
                            </div>
                            <div className="product-facts">
                              <b>{row.sale_price ? `$${row.sale_price}` : '-'}</b>
                              <small>Stock {row.opening_stock || '0'}</small>
                            </div>
                            <div className="row-actions">
                              <button disabled type="button">
                                <span>{row.errors.length === 0 ? 'OK' : 'Error'}</span>
                              </button>
                            </div>
                          </article>
                        ))}
                        {importPreviewRows.length === 0 && importPreviewErrors.length === 0 ? (
                          <div className="empty-ticket">
                            <ClipboardList size={22} strokeWidth={2.1} />
                            <span>Sube tu archivo y genera preview antes de importar.</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {activeView === 'Catalogos' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="catalogs-layout">
                <div className="products-command catalogs-command">
                  <div className="filter-chips" aria-label="Tipos de catalogo">
                    {[
                      { key: 'categories', label: 'Categorias', count: catalogs.categories.length },
                      { key: 'brands', label: 'Marcas', count: catalogs.brands.length },
                      { key: 'units', label: 'Unidades', count: catalogs.units.length },
                    ].map((section) => (
                      <button
                        className={catalogType === section.key ? 'active' : ''}
                        key={section.key}
                        onClick={() => {
                          setCatalogType(section.key as CatalogSection)
                          setCatalogForm(emptyCatalogForm)
                        }}
                        type="button"
                      >
                        {section.label} <span>{section.count}</span>
                      </button>
                    ))}
                  </div>
                  <button className="primary-button new-product-button" disabled={!can('manage_catalogs')} onClick={startNewCatalog} type="button">
                    <Plus size={17} strokeWidth={2.4} />
                    Nuevo catalogo
                  </button>
                </div>

                {saleMessage && activeView === 'Catalogos' && <p className="sale-message list-message">{saleMessage}</p>}

                <div className="catalogs-grid">
                  <form
                    className="product-form catalog-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void saveCatalog()
                    }}
                  >
                    <div className="form-title">
                      <strong>{catalogForm.id ? 'Editar catalogo' : 'Nuevo catalogo'}</strong>
                      <span>{catalogType === 'categories' ? 'Categoria' : catalogType === 'brands' ? 'Marca' : 'Unidad'}</span>
                    </div>
                    <label>
                      <span>Nombre</span>
                      <input
                        onChange={(event) => setCatalogForm((form) => ({ ...form, name: event.target.value }))}
                        required
                        value={catalogForm.name}
                      />
                    </label>
                    {catalogType === 'units' ? (
                      <label>
                        <span>Abreviatura</span>
                        <input
                          onChange={(event) => setCatalogForm((form) => ({ ...form, abbreviation: event.target.value }))}
                          required
                          value={catalogForm.abbreviation}
                        />
                      </label>
                    ) : null}
                    <div className="form-toggles">
                      <label>
                        <input
                          checked={catalogForm.active}
                          onChange={(event) => setCatalogForm((form) => ({ ...form, active: event.target.checked }))}
                          type="checkbox"
                        />
                        <span>Activo</span>
                      </label>
                    </div>
                    <div className="actions-row form-actions">
                      <button className="ghost-button" onClick={startNewCatalog} type="button">Limpiar</button>
                      <button className="primary-button" disabled={isSavingCatalog || !can('manage_catalogs')} type="submit">
                        {isSavingCatalog ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </form>

                  <div className="product-card-list">
                    {visibleCatalogs.map((option) => (
                      <article className="product-list-card catalog-list-card" key={option.id}>
                        <div className="product-main">
                          <span>{catalogType === 'units' ? option.abbreviation || 'unidad' : catalogType === 'brands' ? 'marca' : 'categoria'}</span>
                          <strong>{option.name}</strong>
                          <small>{option.active ? 'Activo' : 'Inactivo'}</small>
                        </div>
                        <div className="product-facts">
                          <b>{catalogType === 'units' ? option.abbreviation || '-' : '-'}</b>
                          <small>{option.active ? 'Disponible' : 'Oculto'}</small>
                        </div>
                        <div className="row-actions">
                          <button disabled={!can('manage_catalogs')} onClick={() => editCatalog(option)} type="button">
                            <Pencil size={16} strokeWidth={2.3} />
                            <span>Editar</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </section>
        ) : null}

        {activeView === 'Inventario' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="inventory-command">
                <div className="filter-chips inventory-tabs" aria-label="Vistas de inventario">
                  {[
                    { key: 'stock', label: 'Stock', count: inventoryCounts.stock },
                    { key: 'movement', label: hasSellableStock ? 'Ajuste' : 'Carga inicial', count: null },
                    { key: 'history', label: 'Historial', count: inventoryCounts.movements },
                  ].map((tab) => (
                    <button
                      className={inventoryMode === tab.key ? 'active' : ''}
                      key={tab.key}
                      onClick={() => setInventoryMode(tab.key as typeof inventoryMode)}
                      type="button"
                    >
                      {tab.label} {tab.count != null ? <span>{tab.count}</span> : null}
                    </button>
                  ))}
                </div>
                <button className="primary-button new-product-button" disabled={!can('adjust_inventory')} onClick={() => startInventoryMovement()} type="button">
                  <Plus size={17} strokeWidth={2.4} />
                  {hasSellableStock ? 'Registrar ajuste' : 'Registrar carga inicial'}
                </button>
              </div>

              {saleMessage && activeView === 'Inventario' && <p className="sale-message list-message">{saleMessage}</p>}

              {inventoryMode === 'stock' ? (
                <div className="product-card-list">
                  {inventoryRows.map((product) => (
                    <article className="product-list-card inventory-list-card" key={product.id}>
                      <div className="product-main">
                        <span>{product.sku}</span>
                        <strong>{product.name}</strong>
                        <small>{product.category || 'Sin categoria'} · {product.base_unit.abbreviation}</small>
                      </div>
                      <div className="product-facts">
                        <b className={product.stock_status === 'ok' ? 'stock-ok' : product.stock_status === 'out' ? 'stock-out' : 'stock-alert'}>
                          {product.stock_status === 'out' ? '0' : formatQuantity(Number(product.stock_quantity))}
                        </b>
                        <small>{product.stock_status === 'out' ? 'Agotado' : product.stock_status === 'low' ? 'Bajo stock' : 'En stock'}</small>
                      </div>
                      <div className="row-actions">
                        <button aria-label={`Movimiento ${product.name}`} disabled={!can('adjust_inventory')} onClick={() => startInventoryMovement(product)} type="button">
                          <Plus size={16} strokeWidth={2.3} />
                          <span>Mover</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {inventoryMode === 'movement' ? (
                <form
                  className="product-form inventory-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveInventoryMovement()
                  }}
                >
                  <div className="form-title">
                    <strong>{hasSellableStock ? 'Registrar ajuste de inventario' : 'Registrar carga inicial'}</strong>
                    <span>{branchName}</span>
                  </div>

                  <label>
                    <span>Producto</span>
                    <select
                      onChange={(event) => setInventoryForm((form) => ({ ...form, product_id: event.target.value }))}
                      required
                      value={inventoryForm.product_id}
                    >
                      {activeProducts.map((product) => (
                        <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>
                      ))}
                    </select>
                  </label>

                  <div className="form-grid-2">
                    <label>
                      <span>Tipo</span>
                      <select
                        onChange={(event) => setInventoryForm((form) => ({ ...form, movement_type: event.target.value as InventoryForm['movement_type'] }))}
                        value={inventoryForm.movement_type}
                      >
                        <option value="initial_stock">Stock inicial</option>
                        <option value="purchase_receipt">Entrada extraordinaria</option>
                        <option value="positive_adjustment">Ajuste positivo</option>
                        <option value="negative_adjustment">Ajuste negativo</option>
                        <option value="waste">Merma</option>
                      </select>
                    </label>
                    <label>
                      <span>Cantidad</span>
                      <input
                        min="0.0001"
                        onChange={(event) => setInventoryForm((form) => ({ ...form, quantity: event.target.value }))}
                        required
                        step="0.0001"
                        type="number"
                        value={inventoryForm.quantity}
                      />
                    </label>
                  </div>

                  <div className="form-grid-2">
                    <label>
                      <span>Costo unitario</span>
                      <input
                        min="0"
                        onChange={(event) => setInventoryForm((form) => ({ ...form, unit_cost: event.target.value }))}
                        step="0.01"
                        type="number"
                        value={inventoryForm.unit_cost}
                      />
                    </label>
                    <label>
                      <span>Motivo</span>
                      <input
                        onChange={(event) => setInventoryForm((form) => ({ ...form, reason: event.target.value }))}
                        placeholder="Requerido para ajustes y merma"
                        value={inventoryForm.reason}
                      />
                    </label>
                  </div>

                  <div className="actions-row form-actions">
                    <button className="ghost-button" onClick={() => setInventoryMode('stock')} type="button">Volver</button>
                    <button className="primary-button" disabled={isSavingInventoryMovement || !can('adjust_inventory')} type="submit">
                      {isSavingInventoryMovement ? 'Registrando...' : 'Registrar'}
                    </button>
                  </div>
                </form>
              ) : null}

              {inventoryMode === 'history' ? (
                <div className="movement-list">
                  {inventoryMovements.map((movement) => (
                    <article className="movement-row" key={movement.id}>
                      <div>
                        <span>{inventoryMovementLabels[movement.movement_type] || movement.movement_type}</span>
                        <strong>{movement.product.name}</strong>
                        <small>{movement.product.sku} · {new Date(movement.created_at).toLocaleString('es-MX')}</small>
                      </div>
                      <b className={Number(movement.signed_base_quantity) < 0 ? 'movement-negative' : 'movement-positive'}>
                        {Number(movement.signed_base_quantity) > 0 ? '+' : ''}{formatQuantity(Number(movement.signed_base_quantity))} {movement.unit.abbreviation}
                      </b>
                      <small>{movement.reason || movement.created_by?.name || 'Sin motivo'}</small>
                    </article>
                  ))}
                </div>
              ) : null}
            </article>
          </section>
        ) : null}

        {activeView === 'Configuracion' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Configuracion inicial</p>
                  <h2>Empresa y sucursal</h2>
                </div>
              </div>

              <div className="product-form settings-form">
                <div className="form-title">
                  <strong>Datos minimos para operar</strong>
                  <span>{onboardingLocked ? 'Pendiente' : 'Listo para operar'}</span>
                </div>
                {onboardingLocked ? (
                  <div className="setup-unblocker" role="status">
                    <div className="setup-unblocker-main">
                      <div className="setup-alert-icon" aria-hidden="true">
                        <AlertTriangle size={20} strokeWidth={2.4} />
                      </div>
                      <div>
                        <strong>No puedes vender todavia</strong>
                        <span>{pendingStepDescription(firstPendingStep)}</span>
                      </div>
                      {firstPendingStep ? (
                        <button className="primary-button" onClick={() => goToOnboardingTarget(firstPendingStep)} type="button">
                          {firstPendingStep.key === 'cash' && isCashPendingClose ? 'Cerrar caja ahora' : firstPendingStep.actionLabel}
                        </button>
                      ) : null}
                    </div>

                    <div className="setup-progress-panel">
                      <div>
                        <strong>Progreso de configuracion</strong>
                        <span>{completedOnboardingCount} de {onboardingSteps.length} pasos completos</span>
                      </div>
                      <div className="setup-progress-track" aria-label={`${onboardingProgress}% completado`}>
                        <span style={{ width: `${onboardingProgress}%` }} />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="onboarding-split" aria-label="Checklist de arranque">
                  {firstPendingStep ? (
                    <section className="blocking-step-panel">
                      <div className="section-header compact">
                        <h2>Pendiente bloqueante</h2>
                        <span className="status warning">Bloquea ventas</span>
                      </div>
                      <article className="blocking-step">
                        <div className="setup-alert-icon" aria-hidden="true">
                          <AlertTriangle size={20} strokeWidth={2.4} />
                        </div>
                        <div>
                          <strong>{firstPendingStep.label}</strong>
                          <small>{pendingStepDescription(firstPendingStep)}</small>
                          {firstPendingStep.key === 'cash' && cashSession ? (
                            <dl className="blocking-step-facts">
                              <div>
                                <dt>Caja abierta desde</dt>
                                <dd>{cashSession.opened_at ? new Date(cashSession.opened_at).toLocaleString('es-MX') : 'Sin fecha'}</dd>
                              </div>
                              <div>
                                <dt>Cajero</dt>
                                <dd>{cashierName}</dd>
                              </div>
                              <div>
                                <dt>Efectivo esperado</dt>
                                <dd>{expectedCash}</dd>
                              </div>
                            </dl>
                          ) : null}
                        </div>
                        <button className="secondary-button" onClick={() => goToOnboardingTarget(firstPendingStep)} type="button">
                          {firstPendingStep.key === 'cash' && isCashPendingClose ? 'Cerrar caja' : firstPendingStep.actionLabel}
                        </button>
                      </article>
                    </section>
                  ) : null}

                  <section className="completed-steps-panel">
                    <div className="section-header compact">
                      <h2>Completado</h2>
                      <span>{completedOnboardingCount} listos</span>
                    </div>
                    <div className="completed-steps-list">
                      {completedOnboardingSteps.map((step) => (
                        <div className="completed-step" key={step.key}>
                          <CheckCircle2 size={17} strokeWidth={2.4} />
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="settings-scope-block company-scope-block">
                  <div className="settings-scope-heading">
                    <div>
                      <span>Identidad única</span>
                      <h3>Empresa</h3>
                      <p>Estos datos se comparten entre todas las sucursales.</p>
                    </div>
                    {!can('manage_business_settings') ? <span className="status">Solo lectura</span> : null}
                  </div>

                  {can('manage_business_settings') ? (
                    <form onSubmit={(event) => { event.preventDefault(); void saveBusinessSettings() }}>
                      <div className="form-grid-2">
                        <label><span>Nombre comercial</span><input required value={settingsForm.commercial_name} onChange={(event) => setSettingsForm((form) => ({ ...form, commercial_name: event.target.value }))} /></label>
                        <label><span>Razon social</span><input required value={settingsForm.legal_name} onChange={(event) => setSettingsForm((form) => ({ ...form, legal_name: event.target.value }))} /></label>
                        <label><span>RFC</span><input required value={settingsForm.rfc} onChange={(event) => setSettingsForm((form) => ({ ...form, rfc: event.target.value.toUpperCase() }))} /></label>
                        <label><span>Contacto principal</span><input required value={settingsForm.primary_contact_name} onChange={(event) => setSettingsForm((form) => ({ ...form, primary_contact_name: event.target.value }))} /></label>
                        <label><span>Telefono</span><input required value={settingsForm.phone} onChange={(event) => setSettingsForm((form) => ({ ...form, phone: event.target.value }))} /></label>
                        <label><span>Email</span><input required type="email" value={settingsForm.email} onChange={(event) => setSettingsForm((form) => ({ ...form, email: event.target.value }))} /></label>
                        <label><span>WhatsApp</span><input value={settingsForm.whatsapp} onChange={(event) => setSettingsForm((form) => ({ ...form, whatsapp: event.target.value }))} /></label>
                      </div>
                      <div className="actions-row form-actions"><button className="primary-button" disabled={isSavingSettings} type="submit">{isSavingSettings ? 'Guardando...' : 'Guardar empresa'}</button></div>
                    </form>
                  ) : (
                    <dl className="settings-readonly-grid">
                      <div><dt>Nombre comercial</dt><dd>{settingsForm.commercial_name || 'Sin registrar'}</dd></div>
                      <div><dt>Razon social</dt><dd>{settingsForm.legal_name || 'Sin registrar'}</dd></div>
                      <div><dt>RFC</dt><dd>{settingsForm.rfc || 'Sin registrar'}</dd></div>
                      <div><dt>Contacto</dt><dd>{settingsForm.primary_contact_name || settingsForm.email || 'Sin registrar'}</dd></div>
                    </dl>
                  )}
                </section>

                <section className="settings-scope-block branch-scope-block">
                  <div className="settings-scope-heading">
                    <div>
                      <span>Operacion local</span>
                      <h3>Sucursal activa</h3>
                      <p>Los cambios aplican únicamente a {branchName}.</p>
                    </div>
                    <span className={portalContext?.branch_setup.complete ? 'status online' : 'status warning'}>{portalContext?.branch_setup.complete ? 'Configurada' : 'Pendiente'}</span>
                  </div>
                  <form onSubmit={(event) => { event.preventDefault(); void saveBranchSettings() }}>
                    <div className="form-grid-2">
                      <label><span>Nombre de sucursal</span><input required value={settingsForm.branch_name} onChange={(event) => setSettingsForm((form) => ({ ...form, branch_name: event.target.value }))} /></label>
                      <label><span>Direccion de sucursal</span><input required value={settingsForm.branch_address} onChange={(event) => setSettingsForm((form) => ({ ...form, branch_address: event.target.value }))} /></label>
                    </div>
                    <div className="actions-row form-actions"><button className="primary-button" disabled={isSavingSettings || !can('manage_branch_settings')} type="submit">{isSavingSettings ? 'Guardando...' : 'Guardar sucursal'}</button></div>
                  </form>
                </section>
                {saleMessage && activeView === 'Configuracion' ? <p className="sale-message form-message">{saleMessage}</p> : null}
              </div>
            </article>
          </section>
        ) : null}

        {!onboardingLocked && activeView === 'Clientes' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="products-command customers-command">
                <div>
                  <p className="eyebrow">Base comercial</p>
                  <h2>Clientes</h2>
                </div>
                {customerMode === 'list' ? (
                  <button className="primary-button new-product-button" disabled={!can('manage_customers')} onClick={startNewCustomer} type="button">
                    <Plus size={17} strokeWidth={2.4} />
                    Nuevo cliente
                  </button>
                ) : (
                  <button className="secondary-button" onClick={() => setCustomerMode('list')} type="button">
                    Volver al listado
                  </button>
                )}
              </div>

              {customerMode === 'list' ? (
                <div className="product-list-view">
                  {saleMessage && activeView === 'Clientes' && <p className="sale-message list-message">{saleMessage}</p>}
                  <label className="search-box products-search">
                    <span>Buscar cliente</span>
                    <input
                      onChange={(event) => setCustomerQuery(event.target.value)}
                      placeholder="Nombre, contacto, telefono, email o RFC"
                      value={customerQuery}
                    />
                  </label>
                  <div className="products-command customers-filters">
                    <div className="filter-chips" aria-label="Filtros de clientes">
                      <button className={customerFilter === 'all' ? 'active' : ''} onClick={() => setCustomerFilter('all')} type="button">
                        Todos <span>{customers.length}</span>
                      </button>
                      <button className={customerFilter === 'inactive' ? 'active' : ''} onClick={() => setCustomerFilter('inactive')} type="button">
                        Inactivos <span>{customers.filter((customer) => customer.active === false).length}</span>
                      </button>
                    </div>
                  </div>
                  <div className="product-list-meta">
                    <span>{filteredCustomers.length} de {customers.length} clientes</span>
                    <button className="icon-button" onClick={() => setCustomerQuery('')} type="button" aria-label="Limpiar busqueda">
                      <MoreHorizontal size={17} strokeWidth={2.4} />
                    </button>
                  </div>
                  <div className="product-card-list">
                    {filteredCustomers.map((customer) => (
                      <article className="product-list-card customer-list-card" key={customer.id}>
                        <div className="product-main">
                          <span>{customer.customer_type === 'company' ? 'Empresa' : 'Persona'}</span>
                          <strong>{customer.commercial_name}</strong>
                          <small>
                            {[
                              customer.contact_name,
                              customer.phone || customer.whatsapp,
                              customer.email,
                            ].filter(Boolean).join(' · ') || 'Sin contacto registrado'}
                          </small>
                        </div>
                        <div className="product-facts">
                          <b>{customer.public_customer ? 'Base' : customer.rfc || '-'}</b>
                          <small>{customer.active ? 'Activo' : 'Inactivo'}</small>
                        </div>
                        <div className="row-actions">
                          <button aria-label={`Editar ${customer.commercial_name}`} disabled={!can('manage_customers')} onClick={() => editCustomer(customer)} type="button">
                            <Pencil size={16} strokeWidth={2.3} />
                            <span>Editar</span>
                          </button>
                          <button
                            aria-label={`Cambiar estado ${customer.commercial_name}`}
                            disabled={customer.public_customer || !can('manage_customers')}
                            onClick={() => void toggleCustomerActive(customer)}
                            type="button"
                          >
                            <MoreHorizontal size={17} strokeWidth={2.4} />
                          </button>
                        </div>
                      </article>
                    ))}
                    {filteredCustomers.length === 0 ? (
                      <div className="empty-ticket">
                        <Users size={22} strokeWidth={2.1} />
                        <span>No hay clientes para ese criterio.</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <form
                  className="product-form customer-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveCustomer()
                  }}
                >
                  <div className="form-title">
                    <strong>{customerForm.id ? 'Editar cliente' : 'Nuevo cliente'}</strong>
                    <span>{customerForm.active ? 'Activo' : 'Inactivo'}</span>
                  </div>

                  <label>
                    <span>Tipo</span>
                    <select
                      onChange={(event) => setCustomerForm((form) => ({ ...form, customer_type: event.target.value as CustomerForm['customer_type'] }))}
                      value={customerForm.customer_type}
                    >
                      <option value="person">Persona</option>
                      <option value="company">Empresa</option>
                    </select>
                  </label>

                  <label>
                    <span>Nombre comercial</span>
                    <input
                      onChange={(event) => setCustomerForm((form) => ({ ...form, commercial_name: event.target.value }))}
                      required
                      value={customerForm.commercial_name}
                    />
                  </label>

                  <div className="form-grid-2">
                    <label>
                      <span>Contacto</span>
                      <input
                        onChange={(event) => setCustomerForm((form) => ({ ...form, contact_name: event.target.value }))}
                        value={customerForm.contact_name}
                      />
                    </label>
                    <label>
                      <span>RFC</span>
                      <input
                        onChange={(event) => setCustomerForm((form) => ({ ...form, rfc: event.target.value }))}
                        value={customerForm.rfc}
                      />
                    </label>
                  </div>

                  <div className="form-grid-2">
                    <label>
                      <span>Telefono</span>
                      <input
                        onChange={(event) => setCustomerForm((form) => ({ ...form, phone: event.target.value }))}
                        value={customerForm.phone}
                      />
                    </label>
                    <label>
                      <span>WhatsApp</span>
                      <input
                        onChange={(event) => setCustomerForm((form) => ({ ...form, whatsapp: event.target.value }))}
                        value={customerForm.whatsapp}
                      />
                    </label>
                  </div>

                  <div className="form-grid-2">
                    <label>
                      <span>Email</span>
                      <input
                        onChange={(event) => setCustomerForm((form) => ({ ...form, email: event.target.value }))}
                        type="email"
                        value={customerForm.email}
                      />
                    </label>
                    <label>
                      <span>Razon social</span>
                      <input
                        onChange={(event) => setCustomerForm((form) => ({ ...form, legal_name: event.target.value }))}
                        value={customerForm.legal_name}
                      />
                    </label>
                  </div>

                  <label>
                    <span>Direccion</span>
                    <input
                      onChange={(event) => setCustomerForm((form) => ({ ...form, address: event.target.value }))}
                      value={customerForm.address}
                    />
                  </label>

                  <label>
                    <span>Notas</span>
                    <input
                      onChange={(event) => setCustomerForm((form) => ({ ...form, notes: event.target.value }))}
                      value={customerForm.notes}
                    />
                  </label>

                  <div className="form-toggles">
                    <label>
                      <input
                        checked={customerForm.active}
                        onChange={(event) => setCustomerForm((form) => ({ ...form, active: event.target.checked }))}
                        type="checkbox"
                      />
                      <span>Activo</span>
                    </label>
                  </div>

                  <div className="actions-row form-actions">
                    <button className="ghost-button" onClick={startNewCustomer} type="button">Limpiar</button>
                    <button className="primary-button" disabled={isSavingCustomer || !can('manage_customers')} type="submit">
                      {isSavingCustomer ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                  {saleMessage && activeView === 'Clientes' && <p className="sale-message form-message">{saleMessage}</p>}
                </form>
              )}
            </article>
          </section>
        ) : null}

        {!onboardingLocked && activeView === 'Usuarios' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="products-command customers-command">
                <div>
                  <p className="eyebrow">Equipo operativo</p>
                  <h2>Usuarios</h2>
                </div>
                {portalUserMode === 'list' ? (
                  <button className="primary-button new-product-button" disabled={!can('manage_users')} onClick={startNewPortalUser} type="button">
                    <Plus size={17} strokeWidth={2.4} />
                    Nuevo usuario
                  </button>
                ) : (
                  <button className="secondary-button" onClick={() => setPortalUserMode('list')} type="button">
                    Volver al listado
                  </button>
                )}
              </div>

              {portalUserMode === 'list' ? (
                <div className="product-list-view">
                  {saleMessage && activeView === 'Usuarios' && <p className="sale-message list-message">{saleMessage}</p>}
                  <label className="search-box products-search">
                    <span>Buscar usuario</span>
                    <input
                      onChange={(event) => setPortalUserQuery(event.target.value)}
                      placeholder="Nombre, email o rol"
                      value={portalUserQuery}
                    />
                  </label>
                  <div className="products-command customers-filters">
                    <div className="filter-chips" aria-label="Filtros de usuarios">
                      <button className={portalUserFilter === 'all' ? 'active' : ''} onClick={() => setPortalUserFilter('all')} type="button">
                        Todos <span>{portalUsers.length}</span>
                      </button>
                      <button className={portalUserFilter === 'inactive' ? 'active' : ''} onClick={() => setPortalUserFilter('inactive')} type="button">
                        Inactivos <span>{portalUsers.filter((user) => user.active === false).length}</span>
                      </button>
                    </div>
                  </div>
                  <div className="product-list-meta">
                    <span>{filteredPortalUsers.length} de {portalUsers.length} usuarios</span>
                    <button className="icon-button" onClick={() => setPortalUserQuery('')} type="button" aria-label="Limpiar busqueda">
                      <MoreHorizontal size={17} strokeWidth={2.4} />
                    </button>
                  </div>
                  <div className="product-card-list">
                    {filteredPortalUsers.map((user) => (
                      <article className="product-list-card customer-list-card" key={user.id}>
                        <div className="product-main">
                          <span>{user.role === 'owner' ? 'Propietario' : 'Usuario de sucursal'}</span>
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                        </div>
                        <div className="product-facts">
                          <b>{user.active ? 'Activo' : 'Inactivo'}</b>
                          <small>{user.user_active ? 'Cuenta vigente' : 'Cuenta suspendida'}</small>
                        </div>
                        <div className="row-actions">
                          <button aria-label={`Editar ${user.name}`} disabled={!can('manage_users')} onClick={() => editPortalUser(user)} type="button">
                            <Pencil size={16} strokeWidth={2.3} />
                            <span>Editar</span>
                          </button>
                          <button aria-label={`Cambiar estado ${user.name}`} disabled={!can('manage_users')} onClick={() => void togglePortalUserActive(user)} type="button">
                            <MoreHorizontal size={17} strokeWidth={2.4} />
                          </button>
                        </div>
                      </article>
                    ))}
                    {filteredPortalUsers.length === 0 ? (
                      <div className="empty-ticket">
                        <UserCog size={22} strokeWidth={2.1} />
                        <span>No hay usuarios para ese criterio.</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <form
                  className="product-form customer-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void savePortalUser()
                  }}
                >
                  <div className="form-title">
                    <strong>{portalUserForm.id ? 'Editar usuario' : 'Nuevo usuario'}</strong>
                    <span>{portalUserForm.active ? 'Activo' : 'Inactivo'}</span>
                  </div>

                  <label>
                    <span>Nombre</span>
                    <input
                      onChange={(event) => setPortalUserForm((form) => ({ ...form, name: event.target.value }))}
                      required
                      value={portalUserForm.name}
                    />
                  </label>

                  <div className="form-grid-2">
                    <label>
                      <span>Email</span>
                      <input
                        onChange={(event) => setPortalUserForm((form) => ({ ...form, email: event.target.value }))}
                        required
                        type="email"
                        value={portalUserForm.email}
                      />
                    </label>
                    <label>
                      <span>Password inicial</span>
                      <input
                        minLength={8}
                        onChange={(event) => setPortalUserForm((form) => ({ ...form, password: event.target.value }))}
                        placeholder={portalUserForm.id ? 'Sin cambio' : 'Minimo 8 caracteres'}
                        required={!portalUserForm.id}
                        type="password"
                        value={portalUserForm.password}
                      />
                    </label>
                  </div>

                  <fieldset className="admin-access-type portal-access-type">
                    <legend>Tipo de acceso</legend>
                    <label><input checked={portalUserForm.access_type === 'member'} onChange={() => setPortalUserForm((form) => ({ ...form, access_type: 'member' }))} type="radio" /><span><strong>Usuario de sucursal</strong><small>Elige sus sucursales y rol operativo.</small></span></label>
                    <label><input checked={portalUserForm.access_type === 'owner'} onChange={() => setPortalUserForm((form) => ({ ...form, access_type: 'owner', branch_assignments: [] }))} type="radio" /><span><strong>Propietario</strong><small>Acceso global a toda la empresa.</small></span></label>
                  </fieldset>

                  {portalUserForm.access_type === 'member' ? (
                    <div className="admin-branch-access-list">
                      {portalContext?.branches.map((branch) => {
                        const assignment = portalUserForm.branch_assignments.find((item) => item.branch_id === branch.id)
                        return <div className={assignment ? 'selected' : ''} key={branch.id}>
                          <label><input checked={Boolean(assignment)} onChange={() => togglePortalUserBranch(branch.id)} type="checkbox" /><span><strong>{branch.name}</strong><small>{branch.code}</small></span></label>
                          {assignment ? <select value={assignment.role} onChange={(event) => setPortalUserForm((form) => ({ ...form, branch_assignments: form.branch_assignments.map((item) => item.branch_id === branch.id ? { ...item, role: event.target.value as AdminBranchAssignment['role'] } : item) }))}><option value="manager">Gerente</option><option value="cashier">Cajero</option><option value="warehouse">Almacén</option></select> : null}
                        </div>
                      })}
                    </div>
                  ) : <p className="admin-owner-note"><ShieldCheck size={17} /> El propietario tiene acceso a todas las sucursales.</p>}

                  <div className="form-toggles">
                    <label>
                      <input
                        checked={portalUserForm.active}
                        onChange={(event) => setPortalUserForm((form) => ({ ...form, active: event.target.checked }))}
                        type="checkbox"
                      />
                      <span>Activo en este negocio</span>
                    </label>
                  </div>

                  <div className="actions-row form-actions">
                    <button className="ghost-button" onClick={startNewPortalUser} type="button">Limpiar</button>
                    <button className="primary-button" disabled={isSavingPortalUser || !can('manage_users') || (portalUserForm.access_type === 'member' && portalUserForm.branch_assignments.length === 0)} type="submit">
                      {isSavingPortalUser ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                  {saleMessage && activeView === 'Usuarios' && <p className="sale-message form-message">{saleMessage}</p>}
                </form>
              )}
            </article>
          </section>
        ) : null}

        {activeView === 'Proveedores' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="products-command customers-command">
                <div>
                  <p className="eyebrow">Abastecimiento</p>
                  <h2>Proveedores</h2>
                </div>
                {supplierMode === 'list' ? (
                  <button className="primary-button new-product-button" disabled={!can('manage_suppliers')} onClick={startNewSupplier} type="button">
                    <Plus size={17} strokeWidth={2.4} />
                    Nuevo proveedor
                  </button>
                ) : (
                  <button className="secondary-button" onClick={() => setSupplierMode('list')} type="button">
                    Volver al listado
                  </button>
                )}
              </div>

              {supplierMode === 'list' ? (
                <div className="product-list-view">
                  {saleMessage && activeView === 'Proveedores' && <p className="sale-message list-message">{saleMessage}</p>}
                  <label className="search-box products-search">
                    <span>Buscar proveedor</span>
                    <input
                      onChange={(event) => setSupplierQuery(event.target.value)}
                      placeholder="Nombre, contacto, telefono, email o RFC"
                      value={supplierQuery}
                    />
                  </label>
                  <div className="products-command customers-filters">
                    <div className="filter-chips" aria-label="Filtros de proveedores">
                      <button className={supplierFilter === 'all' ? 'active' : ''} onClick={() => setSupplierFilter('all')} type="button">
                        Todos <span>{suppliers.length}</span>
                      </button>
                      <button className={supplierFilter === 'inactive' ? 'active' : ''} onClick={() => setSupplierFilter('inactive')} type="button">
                        Inactivos <span>{suppliers.filter((supplier) => supplier.active === false).length}</span>
                      </button>
                    </div>
                  </div>
                  <div className="product-list-meta">
                    <span>{filteredSuppliers.length} de {suppliers.length} proveedores</span>
                    <button className="icon-button" onClick={() => setSupplierQuery('')} type="button" aria-label="Limpiar busqueda">
                      <MoreHorizontal size={17} strokeWidth={2.4} />
                    </button>
                  </div>
                  <div className="product-card-list">
                    {filteredSuppliers.map((supplier) => (
                      <article className="product-list-card customer-list-card" key={supplier.id}>
                        <div className="product-main">
                          <span>{supplier.delivery_days || 'Sin ruta'}</span>
                          <strong>{supplier.commercial_name}</strong>
                          <small>
                            {[
                              supplier.contact_name,
                              supplier.phone || supplier.whatsapp,
                              supplier.email,
                            ].filter(Boolean).join(' · ') || 'Sin contacto registrado'}
                          </small>
                        </div>
                        <div className="product-facts">
                          <b>{supplier.rfc || '-'}</b>
                          <small>{supplier.active ? 'Activo' : 'Inactivo'}</small>
                        </div>
                        <div className="row-actions">
                          <button aria-label={`Editar ${supplier.commercial_name}`} disabled={!can('manage_suppliers')} onClick={() => editSupplier(supplier)} type="button">
                            <Pencil size={16} strokeWidth={2.3} />
                            <span>Editar</span>
                          </button>
                          <button aria-label={`Cambiar estado ${supplier.commercial_name}`} disabled={!can('manage_suppliers')} onClick={() => void toggleSupplierActive(supplier)} type="button">
                            <MoreHorizontal size={17} strokeWidth={2.4} />
                          </button>
                        </div>
                      </article>
                    ))}
                    {filteredSuppliers.length === 0 ? (
                      <div className="empty-ticket">
                        <ClipboardList size={22} strokeWidth={2.1} />
                        <span>No hay proveedores para ese criterio.</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <form
                  className="product-form customer-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveSupplier()
                  }}
                >
                  <div className="form-title">
                    <strong>{supplierForm.id ? 'Editar proveedor' : 'Nuevo proveedor'}</strong>
                    <span>{supplierForm.active ? 'Activo' : 'Inactivo'}</span>
                  </div>

                  <label>
                    <span>Nombre comercial</span>
                    <input
                      onChange={(event) => setSupplierForm((form) => ({ ...form, commercial_name: event.target.value }))}
                      required
                      value={supplierForm.commercial_name}
                    />
                  </label>

                  <div className="form-grid-2">
                    <label>
                      <span>Contacto</span>
                      <input
                        onChange={(event) => setSupplierForm((form) => ({ ...form, contact_name: event.target.value }))}
                        value={supplierForm.contact_name}
                      />
                    </label>
                    <label>
                      <span>RFC</span>
                      <input
                        onChange={(event) => setSupplierForm((form) => ({ ...form, rfc: event.target.value }))}
                        value={supplierForm.rfc}
                      />
                    </label>
                  </div>

                  <div className="form-grid-2">
                    <label>
                      <span>Telefono</span>
                      <input
                        onChange={(event) => setSupplierForm((form) => ({ ...form, phone: event.target.value }))}
                        value={supplierForm.phone}
                      />
                    </label>
                    <label>
                      <span>WhatsApp</span>
                      <input
                        onChange={(event) => setSupplierForm((form) => ({ ...form, whatsapp: event.target.value }))}
                        value={supplierForm.whatsapp}
                      />
                    </label>
                  </div>

                  <div className="form-grid-2">
                    <label>
                      <span>Email</span>
                      <input
                        onChange={(event) => setSupplierForm((form) => ({ ...form, email: event.target.value }))}
                        type="email"
                        value={supplierForm.email}
                      />
                    </label>
                    <label>
                      <span>Razon social</span>
                      <input
                        onChange={(event) => setSupplierForm((form) => ({ ...form, legal_name: event.target.value }))}
                        value={supplierForm.legal_name}
                      />
                    </label>
                  </div>

                  <div className="form-grid-2">
                    <label>
                      <span>Dias de entrega</span>
                      <input
                        onChange={(event) => setSupplierForm((form) => ({ ...form, delivery_days: event.target.value }))}
                        placeholder="Ej. Lun-Mie-Vie"
                        value={supplierForm.delivery_days}
                      />
                    </label>
                    <label>
                      <span>Condiciones de pago</span>
                      <input
                        onChange={(event) => setSupplierForm((form) => ({ ...form, payment_terms: event.target.value }))}
                        placeholder="Ej. Contado, 15 dias"
                        value={supplierForm.payment_terms}
                      />
                    </label>
                  </div>

                  <label>
                    <span>Direccion</span>
                    <input
                      onChange={(event) => setSupplierForm((form) => ({ ...form, address: event.target.value }))}
                      value={supplierForm.address}
                    />
                  </label>

                  <label>
                    <span>Notas</span>
                    <input
                      onChange={(event) => setSupplierForm((form) => ({ ...form, notes: event.target.value }))}
                      value={supplierForm.notes}
                    />
                  </label>

                  <div className="form-toggles">
                    <label>
                      <input
                        checked={supplierForm.active}
                        onChange={(event) => setSupplierForm((form) => ({ ...form, active: event.target.checked }))}
                        type="checkbox"
                      />
                      <span>Activo</span>
                    </label>
                  </div>

                  <div className="actions-row form-actions">
                    <button className="ghost-button" onClick={startNewSupplier} type="button">Limpiar</button>
                    <button className="primary-button" disabled={isSavingSupplier || !can('manage_suppliers')} type="submit">
                      {isSavingSupplier ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                  {saleMessage && activeView === 'Proveedores' && <p className="sale-message form-message">{saleMessage}</p>}
                </form>
              )}
            </article>
          </section>
        ) : null}

        {activeView === 'Compras' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="products-command customers-command">
                <div>
                  <p className="eyebrow">Entradas con costo</p>
                  <h2>Compras</h2>
                </div>
                {purchaseMode === 'list' ? (
                  <button
                    className="primary-button new-product-button"
                    disabled={!can('manage_purchases') || !hasSuppliers || !hasProducts}
                    onClick={startNewPurchase}
                    type="button"
                  >
                    <Plus size={17} strokeWidth={2.4} />
                    Nueva compra
                  </button>
                ) : (
                  <button className="secondary-button" onClick={() => setPurchaseMode('list')} type="button">
                    Volver al historial
                  </button>
                )}
              </div>

              {purchaseMode === 'list' ? (
                <div className="product-list-view">
                  {saleMessage && activeView === 'Compras' && <p className="sale-message list-message">{saleMessage}</p>}
                  {!hasSuppliers ? (
                    <div className="setup-warning" role="status">
                      <strong>Antes de comprar, crea un proveedor.</strong>
                      <span>La compra es la entrada normal de stock. Si solo vas a arrancar, usa carga inicial desde Inventario.</span>
                    </div>
                  ) : null}
                  {hasSuppliers && !hasProducts ? (
                    <div className="setup-warning" role="status">
                      <strong>Primero necesitas al menos un producto.</strong>
                      <span>La compra recibe productos existentes y actualiza su costo y stock.</span>
                    </div>
                  ) : null}
                  <div className="product-list-meta">
                    <span>{purchases.length} compras registradas</span>
                  </div>
                  <div className="product-card-list">
                    {purchases.map((purchase) => (
                      <article className="product-list-card customer-list-card" key={purchase.id}>
                        <div className="product-main">
                          <span>{purchase.folio}</span>
                          <strong>{purchase.supplier.commercial_name}</strong>
                          <small>
                            {new Date(purchase.purchased_at).toLocaleString('es-MX')} · {purchase.items.length} partidas
                          </small>
                        </div>
                        <div className="product-facts">
                          <b>{formatMoney(purchase.total_cents)}</b>
                          <small>{purchase.status === 'cancelled' ? 'Cancelada' : purchase.invoice_reference || 'Sin factura'}</small>
                        </div>
                        <div className="row-actions">
                          {purchase.status === 'cancelled' ? (
                            <button disabled type="button">
                              <span>Cancelada</span>
                            </button>
                          ) : (
                            <button aria-label={`Anular ${purchase.folio}`} disabled={!can('cancel_purchase')} onClick={() => startCancelPurchase(purchase)} type="button">
                              <span>Anular</span>
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                    {purchases.length === 0 ? (
                      <div className="empty-ticket">
                        <ClipboardList size={22} strokeWidth={2.1} />
                        <span>No hay compras registradas todavia.</span>
                      </div>
                    ) : null}
                  </div>
                  {selectedPurchase ? (
                    <form
                      className="product-form sale-cancel-form"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void cancelSelectedPurchase()
                      }}
                    >
                      <div className="form-title">
                        <strong>Anular compra {selectedPurchase.folio}</strong>
                        <span>
                          {selectedPurchase.status === 'cancelled'
                            ? 'Ya fue cancelada'
                            : 'Solo se permite si el stock actual alcanza para revertirla'}
                        </span>
                      </div>
                      <div className="checkout-summary ticket-summary">
                        <div><span>Proveedor</span><strong>{selectedPurchase.supplier.commercial_name}</strong></div>
                        <div><span>Total</span><strong>{formatMoney(selectedPurchase.total_cents)}</strong></div>
                        <div><span>Fecha</span><strong>{new Date(selectedPurchase.purchased_at).toLocaleString('es-MX')}</strong></div>
                      </div>
                      {selectedPurchase.status === 'cancelled' ? (
                        <div className="checkout-summary ticket-summary">
                          <div><span>Cancelada</span><strong>{selectedPurchase.cancelled_at ? new Date(selectedPurchase.cancelled_at).toLocaleString('es-MX') : 'Sin fecha'}</strong></div>
                          <div><span>Por</span><strong>{selectedPurchase.cancelled_by?.name || 'Sin usuario'}</strong></div>
                          <div><span>Motivo</span><strong>{selectedPurchase.cancellation_reason || 'Sin motivo'}</strong></div>
                        </div>
                      ) : (
                        <>
                          <div className="movement-list">
                            {selectedPurchase.items.map((item) => (
                              <article className="movement-row" key={item.id}>
                                <div>
                                  <span>{item.product.sku}</span>
                                  <strong>{item.product.name}</strong>
                                  <small>{item.quantity} {item.unit}</small>
                                </div>
                                <b className="movement-positive">{formatMoney(item.total_cents)}</b>
                                <small />
                              </article>
                            ))}
                          </div>
                          <label>
                            <span>Motivo de cancelacion</span>
                            <input
                              onChange={(event) => setPurchaseCancelReason(event.target.value)}
                              placeholder="Ej. error de captura, compra duplicada"
                              required
                              value={purchaseCancelReason}
                            />
                          </label>
                        </>
                      )}
                      <div className="actions-row form-actions">
                        <button
                          className="ghost-button"
                          onClick={() => {
                            setSelectedPurchase(null)
                            setPurchaseCancelReason('')
                          }}
                          type="button"
                        >
                          Cerrar
                        </button>
                        {selectedPurchase.status !== 'cancelled' ? (
                          <button className="primary-button" disabled={isCancellingPurchase || !can('cancel_purchase')} type="submit">
                            {isCancellingPurchase ? 'Anulando...' : 'Confirmar anulacion'}
                          </button>
                        ) : null}
                      </div>
                    </form>
                  ) : null}
                </div>
              ) : (
                <form
                  className="product-form customer-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void savePurchase()
                  }}
                >
                  <div className="form-title">
                    <strong>Nueva compra</strong>
                    <span>Total {formatMoney(purchaseTotalCents)}</span>
                  </div>

                  <div className="form-grid-2">
                    <label>
                      <span>Proveedor</span>
                      <select
                        onChange={(event) => setPurchaseForm((form) => ({ ...form, supplier_id: event.target.value }))}
                        required
                        value={purchaseForm.supplier_id}
                      >
                        <option value="">Selecciona proveedor</option>
                        {suppliers.filter((supplier) => supplier.active).map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>{supplier.commercial_name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Fecha y hora</span>
                      <input
                        onChange={(event) => setPurchaseForm((form) => ({ ...form, purchased_at: event.target.value }))}
                        required
                        type="datetime-local"
                        value={purchaseForm.purchased_at}
                      />
                    </label>
                  </div>

                  <div className="form-grid-2">
                    <label>
                      <span>Referencia factura</span>
                      <input
                        onChange={(event) => setPurchaseForm((form) => ({ ...form, invoice_reference: event.target.value }))}
                        value={purchaseForm.invoice_reference}
                      />
                    </label>
                    <label>
                      <span>Notas</span>
                      <input
                        onChange={(event) => setPurchaseForm((form) => ({ ...form, notes: event.target.value }))}
                        value={purchaseForm.notes}
                      />
                    </label>
                  </div>

                  <div className="movement-list">
                    {purchaseForm.items.map((item, index) => (
                      <article className="movement-row purchase-item-row" key={`${index}-${item.product_id}`}>
                        <div className="purchase-item-fields">
                          <select
                            onChange={(event) => updatePurchaseItem(index, { product_id: event.target.value })}
                            value={item.product_id}
                          >
                            <option value="">Selecciona producto</option>
                            {products.filter((product) => product.active !== false).map((product) => (
                              <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>
                            ))}
                          </select>
                          <input
                            min="0.0001"
                            onChange={(event) => updatePurchaseItem(index, { quantity: event.target.value })}
                            placeholder="Cantidad"
                            step="0.0001"
                            type="number"
                            value={item.quantity}
                          />
                          <input
                            min="0.01"
                            onChange={(event) => updatePurchaseItem(index, { unit_cost: event.target.value })}
                            placeholder="Costo unitario"
                            step="0.01"
                            type="number"
                            value={item.unit_cost}
                          />
                        </div>
                        <b className="movement-positive">
                          {formatMoney(Math.round(Number(item.quantity || 0) * moneyInputToCents(item.unit_cost || '0')))}
                        </b>
                        <button className="icon-button" onClick={() => removePurchaseItem(index)} type="button" aria-label="Quitar partida">
                          <Trash2 size={16} strokeWidth={2.3} />
                        </button>
                      </article>
                    ))}
                  </div>

                  <div className="actions-row form-actions purchase-actions">
                    <button className="ghost-button" onClick={addPurchaseItem} type="button">Agregar partida</button>
                    <button className="primary-button" disabled={isSavingPurchase || !can('manage_purchases')} type="submit">
                      {isSavingPurchase ? 'Registrando...' : 'Registrar compra'}
                    </button>
                  </div>
                  {saleMessage && activeView === 'Compras' && <p className="sale-message form-message">{saleMessage}</p>}
                </form>
              )}
            </article>
          </section>
        ) : null}

        {activeView === 'Caja' ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="inventory-command cash-command">
                <div>
                  <p className="eyebrow">Turno actual</p>
                  <h2>Caja operativa</h2>
                </div>
                <div className="filter-chips inventory-tabs" aria-label="Acciones de caja">
                  <button className={cashMode === 'summary' ? 'active' : ''} onClick={() => setCashMode('summary')} type="button">
                    Resumen
                  </button>
                  {!cashSession ? (
                    <button className={cashMode === 'open' ? 'active' : ''} disabled={!can('open_cash_register') || !cashSetupReady} onClick={() => setCashMode('open')} type="button">
                      Abrir
                    </button>
                  ) : null}
                  {cashSession ? (
                    <>
                      {isCashOpen ? (
                        <button className={cashMode === 'movement' ? 'active' : ''} disabled={!can('create_cash_movement')} onClick={() => setCashMode('movement')} type="button">
                          Movimiento
                        </button>
                      ) : null}
                      <button className={cashMode === 'close' ? 'active' : ''} disabled={!can('close_cash_register')} onClick={() => setCashMode('close')} type="button">
                        Cerrar
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {saleMessage && activeView === 'Caja' && <p className="sale-message list-message">{saleMessage}</p>}

              <dl className="cash-summary">
                <div>
                  <dt>Operador</dt>
                  <dd>{operatorName}</dd>
                </div>
                <div>
                  <dt>Folio siguiente</dt>
                  <dd>{formattedFolio}</dd>
                </div>
                <div>
                  <dt>Inicial</dt>
                  <dd>{cashSession ? formatMoney(cashSession.opening_amount_cents) : '$0.00'}</dd>
                </div>
                <div>
                  <dt>Esperado</dt>
                  <dd>{expectedCash}</dd>
                </div>
              </dl>

              {cashMode === 'open' && !cashSession ? (
                <form
                  className="product-form cash-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void openCashSession()
                  }}
                >
                  <div className="form-title">
                    <strong>Abrir caja</strong>
                    <span>{branchName}</span>
                  </div>
                  <label>
                    <span>Fondo inicial</span>
                    <input
                      min="0"
                      onChange={(event) => setCashOpeningAmount(event.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={cashOpeningAmount}
                    />
                  </label>
                  <div className="actions-row form-actions">
                    <button className="ghost-button" onClick={() => setCashMode('summary')} type="button">Volver</button>
                    <button className="primary-button" disabled={isSavingCashAction || !actingUserId || !can('open_cash_register') || !cashSetupReady} type="submit">
                      {isSavingCashAction ? 'Abriendo...' : 'Abrir caja'}
                    </button>
                  </div>
                </form>
              ) : null}

              {cashMode === 'movement' && isCashOpen ? (
                <form
                  className="product-form cash-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveCashMovement()
                  }}
                >
                  <div className="form-title">
                    <strong>Movimiento de caja</strong>
                    <span>{cashRegisterCode}</span>
                  </div>
                  <div className="form-grid-2">
                    <label>
                      <span>Tipo</span>
                      <select
                        onChange={(event) => setCashMovementForm((form) => ({ ...form, movement_type: event.target.value as CashMovementForm['movement_type'] }))}
                        value={cashMovementForm.movement_type}
                      >
                        <option value="cash_out">Salida de efectivo</option>
                        <option value="credit_payment">Abono a credito</option>
                      </select>
                    </label>
                    <label>
                      <span>Importe</span>
                      <input
                        min="0.01"
                        onChange={(event) => setCashMovementForm((form) => ({ ...form, amount: event.target.value }))}
                        required
                        step="0.01"
                        type="number"
                        value={cashMovementForm.amount}
                      />
                    </label>
                  </div>
                  <label>
                    <span>Motivo</span>
                    <input
                      onChange={(event) => setCashMovementForm((form) => ({ ...form, reason: event.target.value }))}
                      placeholder="Ej. compra menor, mensajeria, abono cliente"
                      required
                      value={cashMovementForm.reason}
                    />
                  </label>
                  <div className="actions-row form-actions">
                    <button className="ghost-button" onClick={() => setCashMode('summary')} type="button">Volver</button>
                    <button className="primary-button" disabled={isSavingCashAction || !can('create_cash_movement')} type="submit">
                      {isSavingCashAction ? 'Registrando...' : 'Registrar'}
                    </button>
                  </div>
                </form>
              ) : null}

              {cashMode === 'close' && cashSession ? (
                <form
                  className="product-form cash-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void closeCashSession()
                  }}
                >
                  <div className="form-title">
                    <strong>Cerrar caja</strong>
                    <span>Esperado {expectedCash}</span>
                  </div>
                  <label>
                    <span>Efectivo contado</span>
                    <input
                      min="0"
                      onChange={(event) => setCashCloseForm((form) => ({ ...form, counted_cash: event.target.value }))}
                      required
                      step="0.01"
                      type="number"
                      value={cashCloseForm.counted_cash}
                    />
                  </label>
                  <label>
                    <span>Notas de cierre</span>
                    <input
                      onChange={(event) => setCashCloseForm((form) => ({ ...form, closing_notes: event.target.value }))}
                      placeholder="Opcional"
                      value={cashCloseForm.closing_notes}
                    />
                  </label>
                  {isCashPendingClose ? (
                    <label>
                      <span>Motivo cierre forzado</span>
                      <input
                        onChange={(event) => setCashCloseForm((form) => ({ ...form, force_close_reason: event.target.value }))}
                        placeholder="Ej. responsable ausente, turno omitio cierre"
                        value={cashCloseForm.force_close_reason}
                      />
                    </label>
                  ) : null}
                  <div className="actions-row form-actions">
                    <button className="ghost-button" onClick={() => setCashMode('summary')} type="button">Volver</button>
                    <button className="primary-button" disabled={isSavingCashAction || !can('close_cash_register')} type="submit">
                      {isSavingCashAction ? 'Cerrando...' : 'Cerrar caja'}
                    </button>
                    {isCashPendingClose ? (
                      <button className="secondary-button" disabled={isSavingCashAction || !can('close_cash_register')} onClick={forceCloseCashSession} type="button">
                        {isSavingCashAction ? 'Forzando...' : 'Forzar cierre'}
                      </button>
                    ) : null}
                  </div>
                </form>
              ) : null}

              {cashMode === 'summary' ? (
                <div className="cash-layout">
                  <div className="cash-metrics">
                    <article className="metric-card">
                      <span>Entradas</span>
                      <strong>{formatMoney(cashMovementCounts.inflow)}</strong>
                      <small>{cashMovements.filter((movement) => movement.amount_cents > 0).length} movimientos</small>
                    </article>
                    <article className="metric-card">
                      <span>Salidas</span>
                      <strong>{formatMoney(cashMovementCounts.outflow)}</strong>
                      <small>{cashMovements.filter((movement) => movement.amount_cents < 0).length} movimientos</small>
                    </article>
                    <article className="metric-card">
                      <span>Estado</span>
                      <strong>{cashStatus}</strong>
                      <small>
                        {isCashPendingClose
                          ? 'Bloquea ventas nuevas'
                          : cashSession?.opened_at
                            ? new Date(cashSession.opened_at).toLocaleString('es-MX')
                            : 'Sin turno activo'}
                      </small>
                    </article>
                  </div>

                  <div className="movement-list">
                    {recentCashMovements.map((movement) => (
                      <article className="movement-row" key={movement.id}>
                        <div>
                          <span>{cashMovementLabels[movement.movement_type]}</span>
                          <strong>{movement.created_by?.name || operatorName}</strong>
                          <small>{new Date(movement.created_at).toLocaleString('es-MX')}</small>
                        </div>
                        <b className={movement.amount_cents < 0 ? 'movement-negative' : 'movement-positive'}>
                          {movement.amount_cents < 0 ? '-' : '+'}{formatMoney(Math.abs(movement.amount_cents))}
                        </b>
                        <small>{movement.reason || 'Sin motivo'}</small>
                      </article>
                    ))}
                    {recentCashMovements.length === 0 ? (
                      <div className="empty-ticket cash-empty">
                        <CreditCard size={22} strokeWidth={2.1} />
                        <span>Sin movimientos de caja todavia.</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          </section>
        ) : null}

        {!viewTitles[activeView] ? (
          <section className="module-view">
            <article className="module-card wide-card">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Pendiente</p>
                  <h2>{activeView}</h2>
                </div>
              </div>
              <p className="placeholder-copy">Este modulo estara disponible pronto.</p>
            </article>
          </section>
        ) : null}
      </main>

      <div className={mobileMenuOpen ? 'mobile-drawer open' : 'mobile-drawer'} aria-hidden={!mobileMenuOpen}>
        <button className="drawer-backdrop" onClick={() => setMobileMenuOpen(false)} type="button" />
        <aside className="drawer-panel" aria-label="Menu movil">
          <div className="drawer-header">
            <img src={hululLogo} alt="Hulul" />
            <button aria-label="Cerrar menu" onClick={() => setMobileMenuOpen(false)} type="button">
              <X size={20} strokeWidth={2.4} />
            </button>
          </div>
          <div className={isInternalConsole ? 'tenant-switch drawer-tenant admin-console-identity' : 'tenant-switch drawer-tenant'}>
            {isInternalConsole ? (
              <>
                <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.1} />
                <div>
                  <span>Consola interna</span>
                  <strong>Administracion Hulul</strong>
                </div>
              </>
            ) : canSwitchBusiness ? (
              <>
                <span>Negocio activo</span>
              <select
                aria-label="Cambiar negocio activo"
                onChange={(event) => changeActiveBusiness(event.target.value)}
                value={activeBusinessId}
              >
                {authSession.businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.commercial_name || 'Negocio sin nombre'}{business.status && business.status !== 'active' ? ` (${business.status})` : ''}
                  </option>
                ))}
              </select>
              </>
            ) : (
              <>
                <span>Negocio activo</span>
                <strong>{businessName}</strong>
              </>
            )}
            {!isInternalConsole && activeRole ? <small>{roleLabels[activeRole as UserRole] || activeRole}</small> : null}
            {!isInternalConsole && !businessIsOperational ? <small>{businessStatusLabel}</small> : null}
          </div>
          <button className="text-button drawer-logout" onClick={handleLogout} type="button">Salir</button>
          <nav className="nav-list drawer-nav">
            {visibleNavItems.map(({ label, icon: Icon }) => (
              <button
                className={label === activeView || (label === 'Admin Hulul' && (Boolean(adminBusinessEditorId) || activeView === 'Detalle empresa')) ? 'active' : ''}
                disabled={isNavItemDisabled(label)}
                key={label}
                onClick={() => {
                  setMobileMenuOpen(false)
                  goToView(label)
                }}
                type="button"
              >
                <Icon size={18} strokeWidth={2.2} />
                {isInternalConsole && label === 'Admin Hulul' ? 'Empresas' : renderNavLabel(label)}
              </button>
            ))}
          </nav>
        </aside>
      </div>

      <nav className="mobile-nav" aria-label="Navegacion movil">
        {mobilePrimaryNavItems.map(({ label, icon: Icon }) => (
          <button
            className={label === activeView || (label === 'Admin Hulul' && (Boolean(adminBusinessEditorId) || activeView === 'Detalle empresa')) ? 'active' : ''}
            disabled={isNavItemDisabled(label)}
            key={label}
            onClick={() => goToView(label)}
            type="button"
          >
            <Icon size={18} strokeWidth={2.3} />
            <span>{isInternalConsole && label === 'Admin Hulul' ? 'Empresas' : label}</span>
          </button>
        ))}
        <button
          className={mobileMenuOpen ? 'active' : ''}
          onClick={() => setMobileMenuOpen(true)}
          type="button"
        >
          <MoreHorizontal size={18} strokeWidth={2.3} />
          <span>Mas</span>
        </button>
      </nav>
    </div>
  )
}

export default App
