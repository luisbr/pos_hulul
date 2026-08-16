import {
  BarChart3,
  Boxes,
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
  ShoppingCart,
  Tags,
  Trash2,
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
  { label: 'Proveedores', icon: ClipboardList },
  { label: 'Compras', icon: ClipboardList },
  { label: 'Caja', icon: CreditCard },
  { label: 'Configuracion', icon: Settings },
  { label: 'Reportes', icon: BarChart3 },
]

type BusinessSummary = {
  id: string
  commercial_name?: string
  role?: string
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
    license_status: string
  }
  setup: {
    complete: boolean
    missing: string[]
  }
  branch: {
    id: string
    name: string
    code: string
    address?: string | null
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
    status: 'open' | 'closed'
    opened_at?: string
    closed_at?: string | null
    opening_amount_cents: number
    expected_cash_cents: number
    counted_cash_cents?: number | null
    difference_cents?: number | null
    closing_notes?: string | null
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
  key: 'company' | 'unit' | 'category' | 'product' | 'supplier' | 'stock' | 'cash'
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
  movement_type: 'opening' | 'sale_cash_payment' | 'credit_payment' | 'cash_out' | 'refund' | 'closing_adjustment'
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
}

const emptyCashMovementForm: CashMovementForm = {
  movement_type: 'cash_out',
  amount: '',
  reason: '',
}

const emptyCashCloseForm: CashCloseForm = {
  counted_cash: '',
  closing_notes: '',
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

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null

    try {
      return JSON.parse(stored) as AuthSession
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

  const apiFetch = useCallback((path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    if (authSession?.token) headers.set('Authorization', `Bearer ${authSession.token}`)

    return fetch(path, {
      ...init,
      headers,
    })
  }, [authSession])

  const resetPortalState = useCallback(() => {
    setPortalContext(null)
    setCustomers([])
    setSuppliers([])
    setPurchases([])
    setSelectedPurchase(null)
    setPurchaseCancelReason('')
    setProducts([])
    setCatalogs({ categories: [], brands: [], units: [] })
    setSettingsForm(emptySettingsForm)
    setInventoryMovements([])
    setCashMovements([])
    setSales([])
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

  const loadPortalData = useCallback(async () => {
    if (!authSession) throw new Error('No active session')

    const business = authSession.businesses.find((item) => item.id === authSession.default_business_id) || authSession.businesses[0]
    if (!business) throw new Error('No business assigned')

    const contextResponse = await apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/context`)
    if (contextResponse.status === 401 || contextResponse.status === 403 || contextResponse.status === 404) {
      throw new Error(STALE_SESSION_ERROR)
    }
    if (!contextResponse.ok) throw new Error('Could not load portal context')

    const context = (await contextResponse.json()) as PortalContext
    const cashMovementsUrl = context.cash_register_session
      ? `${API_BASE_URL}/api/portal/businesses/${business.id}/cash_movements?cash_register_session_id=${context.cash_register_session.id}`
      : `${API_BASE_URL}/api/portal/businesses/${business.id}/cash_movements`

    const [customersResponse, suppliersResponse, purchasesResponse, productsResponse, catalogsResponse, movementsResponse, cashMovementsResponse, salesResponse] = await Promise.all([
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/customers`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/suppliers`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/purchases`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/products`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/catalogs`),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/inventory_movements`),
      apiFetch(cashMovementsUrl),
      apiFetch(`${API_BASE_URL}/api/portal/businesses/${business.id}/sales`),
    ])
    if (!customersResponse.ok) throw new Error('Could not load customers')
    if (!suppliersResponse.ok) throw new Error('Could not load suppliers')
    if (!purchasesResponse.ok) throw new Error('Could not load purchases')
    if (!productsResponse.ok) throw new Error('Could not load products')
    if (!catalogsResponse.ok) throw new Error('Could not load catalogs')
    if (!movementsResponse.ok) throw new Error('Could not load inventory movements')
    if (!cashMovementsResponse.ok) throw new Error('Could not load cash movements')
    if (!salesResponse.ok) throw new Error('Could not load sales')

    const loadedCustomers = (await customersResponse.json()) as Customer[]
    const loadedSuppliers = (await suppliersResponse.json()) as Supplier[]
    const loadedPurchases = (await purchasesResponse.json()) as Purchase[]
    const loadedProducts = (await productsResponse.json()) as Product[]
    const loadedCatalogs = (await catalogsResponse.json()) as Catalogs
    const loadedMovements = (await movementsResponse.json()) as InventoryMovement[]
    const loadedCashMovements = (await cashMovementsResponse.json()) as CashMovement[]
    const loadedSales = (await salesResponse.json()) as CompletedSale[]

    return {
      context,
      customers: loadedCustomers,
      suppliers: loadedSuppliers,
      purchases: loadedPurchases,
      products: loadedProducts,
      catalogs: loadedCatalogs,
      inventoryMovements: loadedMovements,
      cashMovements: loadedCashMovements,
      sales: loadedSales,
    }
  }, [apiFetch, authSession])

  useEffect(() => {
    if (!authSession) {
      setApiStatus('loading')
      return
    }

    let cancelled = false

    async function loadPortalContext() {
      try {
        const {
          context,
          customers: loadedCustomers,
          suppliers: loadedSuppliers,
          purchases: loadedPurchases,
          products: loadedProducts,
          catalogs: loadedCatalogs,
          inventoryMovements: loadedMovements,
          cashMovements: loadedCashMovements,
          sales: loadedSales,
        } = await loadPortalData()
        if (!cancelled) {
          setPortalContext(context)
          setCustomers(loadedCustomers)
          setSuppliers(loadedSuppliers)
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
            context.setup.complete &&
            loadedCatalogs.units.length > 0 &&
            loadedCatalogs.categories.length > 0 &&
            loadedProducts.length > 0 &&
            loadedProducts.some((product) => Number(product.stock_quantity) > 0 && product.active !== false) &&
            context.cash_register_session?.status === 'open'
          setActiveView((currentView) => (onboardingReady ? currentView : 'Configuracion'))
          if (!onboardingReady) setSaleMessage('Completa la configuracion operativa antes de vender.')
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
  }, [authSession, invalidateStoredSession, loadPortalData])

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

      const nextSession = body as AuthSession
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
      setAuthSession(nextSession)
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

  const businessName = portalContext?.business.commercial_name?.trim() || 'Negocio sin configurar'
  const branchName = portalContext?.branch?.name?.trim() || 'Sucursal sin configurar'
  const branchCode = portalContext?.branch?.code ?? 'TOL'
  const cashRegisterCode = portalContext?.cash_register?.code ?? '001'
  const nextFolio = portalContext?.cash_register?.current_folio_number ?? 43
  const formattedFolio = `${branchCode}-${cashRegisterCode}-${String(nextFolio).padStart(6, '0')}`
  const cashSession = portalContext?.cash_register_session
  const cashStatus = cashSession?.status === 'open' ? 'Abierta' : 'Cerrada'
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
      : ticketItems.length === 0
        ? 'Agrega al menos un producto.'
        : !cashSession || cashSession.status !== 'open'
          ? 'Abre una caja antes de cobrar.'
          : hasStockIssue
            ? 'Corrige el stock antes de cobrar.'
            : null
  const isCheckoutActionDisabled = isCharging || apiStatus === 'loading'
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
    Inicio: 'Resumen operativo',
    Venta: 'Punto de venta',
    Productos: 'Productos',
    Catalogos: 'Catalogos base',
    Inventario: 'Inventario',
    Clientes: 'Clientes',
    Proveedores: 'Proveedores',
    Compras: 'Compras',
    Caja: 'Caja',
    Configuracion: 'Configuracion de empresa',
  }
  const isCashOpen = cashSession?.status === 'open'
  const hasUnits = catalogs.units.length > 0
  const hasCategories = catalogs.categories.length > 0
  const hasSuppliers = suppliers.some((supplier) => supplier.active)
  const hasProducts = products.length > 0
  const hasSellableStock = products.some((product) => Number(product.stock_quantity) > 0 && product.active !== false)
  const onboardingSteps: OnboardingStep[] = [
    {
      key: 'company',
      label: 'Empresa configurada',
      complete: portalContext?.setup.complete ?? false,
      actionLabel: 'Completar empresa',
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
      label: 'Caja abierta',
      complete: isCashOpen,
      actionLabel: 'Abrir caja',
      view: 'Caja',
    },
  ]
  const onboardingLocked = portalContext != null && onboardingSteps.some((step) => !step.complete)
  const firstPendingStep = onboardingSteps.find((step) => !step.complete) || null
  const pendingOnboardingCount = onboardingSteps.filter((step) => !step.complete).length
  const onboardingAllowedViews = new Set(['Configuracion', 'Catalogos', 'Productos', 'Proveedores', 'Compras', 'Inventario', 'Caja'])
  const isProductWorkspace = activeView === 'Productos' || activeView === 'Catalogos'
  const isSalePosView = saleView === 'pos'
  const currentTitle = viewTitles[activeView] ?? activeView
  const mobilePrimaryNavItems = onboardingLocked
    ? navItems.filter((item) => onboardingAllowedViews.has(item.label))
    : navItems.filter((item) => ['Inicio', 'Venta', 'Productos', 'Inventario'].includes(item.label))
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
    if (apiStatus !== 'ready') {
      setSaleMessage(apiStatus === 'loading' ? 'Espera a que cargue el POS.' : 'Sin conexion con el servidor.')
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
      setCashMode('open')
    }
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

  async function saveSettings() {
    if (!portalContext?.business.id || !portalContext.branch?.id) return

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
          branch: {
            name: settingsForm.branch_name,
            address: settingsForm.branch_address,
          },
        }),
      })

      const body = (await response.json()) as PortalContext & { errors?: string[] }
      if (!response.ok) throw new Error(body.errors?.join(', ') ?? 'No se pudo guardar la configuracion.')

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
      setSaleMessage(body.setup.complete ? 'Configuracion guardada. Ya puedes operar.' : 'Configuracion guardada.')
      if (body.setup.complete) setActiveView('Inicio')
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo guardar la configuracion.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  function goToView(label: string) {
    if (onboardingLocked && !onboardingAllowedViews.has(label)) {
      setActiveView('Configuracion')
      setSaleMessage(`Antes de continuar: ${firstPendingStep?.label || 'completa la configuracion operativa'}.`)
      return
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
    setCatalogForm(emptyCatalogForm)
    setSaleMessage(null)
  }

  function startNewCustomer() {
    setCustomerForm(emptyCustomerForm)
    setCustomerMode('form')
    setSaleMessage(null)
  }

  function startNewSupplier() {
    setSupplierForm(emptySupplierForm)
    setSupplierMode('form')
    setSaleMessage(null)
  }

  function startNewPurchase() {
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

  async function saveProduct(form = productForm) {
    if (!portalContext?.business.id) return
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
      })
      setSaleMessage(`Caja cerrada. Diferencia ${formatMoney(body.difference_cents || 0)}.`)
    } catch (error) {
      setSaleMessage(error instanceof Error ? error.message : 'No se pudo cerrar caja.')
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
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand">
          <img src={hululLogo} alt="Hulul" />
        </div>
        <div className="tenant-switch">
          <span>Negocio activo</span>
          <strong>{businessName}</strong>
        </div>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              className={label === activeView ? 'active' : ''}
              disabled={onboardingLocked && !onboardingAllowedViews.has(label)}
              key={label}
              onClick={() => goToView(label)}
              type="button"
            >
              <Icon size={18} strokeWidth={2.2} />
              {renderNavLabel(label)}
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
            <span>{businessName}</span>
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
            <p className="eyebrow">{businessName}</p>
            <h1>{currentTitle}</h1>
          </div>
          <div className="status-strip">
            <span className={apiStatus === 'ready' ? 'status online' : 'status warning'}>
              {apiStatus === 'ready' ? 'En linea' : apiStatus === 'loading' ? 'Cargando' : 'Sin conexion'}
            </span>
            <span className="status">{branchName}</span>
            <button className="user-chip user-chip-button" type="button" title={authSession.user.email}>
              {userInitials}
            </button>
          </div>
        </header>

        {onboardingLocked ? (
          <section className="setup-banner" role="status">
            <div>
              <strong>Configuracion pendiente</strong>
              <span>
                Faltan {pendingOnboardingCount} puntos. Actual: {firstPendingStep?.label || 'Configuracion pendiente'}
              </span>
            </div>
            <button className="secondary-button" onClick={() => goToView('Configuracion')} type="button">
              Revisar
            </button>
          </section>
        ) : null}

        {!isProductWorkspace && !onboardingLocked && activeView !== 'Configuracion' ? (
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
                        <strong>Caja cerrada</strong>
                        <span>Abre caja para buscar productos y empezar a vender.</span>
                      </div>
                      <button className="primary-button" onClick={openCashFromPos} type="button">
                        Abrir caja
                      </button>
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
		                      <button className="primary-button" disabled={isCancellingSale} type="submit">
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
                      <button className="primary-button new-product-button" onClick={startNewProduct} type="button">
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
                        <button className="primary-button" disabled={isSavingProduct} type="submit">
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
                              <button aria-label={`Editar ${product.name}`} onClick={() => editProduct(product)} type="button">
                                <Pencil size={16} strokeWidth={2.3} />
                                <span>Editar</span>
                              </button>
                              <button aria-label={`Mas acciones ${product.name}`} onClick={() => void toggleProductActive(product)} type="button">
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
                        <button className="primary-button" disabled={isPreviewingImport || !importFile} type="submit">
                          {isPreviewingImport ? 'Leyendo...' : 'Ver preview'}
                        </button>
                      </div>
                    </form>

                    <div className="product-list-view">
                      <div className="product-list-meta">
                        <span>{importPreviewRows.length} filas leidas</span>
                        <button className="primary-button" disabled={!importFile || importPreviewErrors.length > 0 || isImportingProducts || importPreviewRows.length === 0} onClick={() => void commitImportFile()} type="button">
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
                  <button className="primary-button new-product-button" onClick={startNewCatalog} type="button">
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
                      <button className="primary-button" disabled={isSavingCatalog} type="submit">
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
                          <button onClick={() => editCatalog(option)} type="button">
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
                <button className="primary-button new-product-button" onClick={() => startInventoryMovement()} type="button">
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
                        <button aria-label={`Movimiento ${product.name}`} onClick={() => startInventoryMovement(product)} type="button">
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
                    <button className="primary-button" disabled={isSavingInventoryMovement} type="submit">
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

              <form
                className="product-form settings-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void saveSettings()
                }}
              >
                <div className="form-title">
                  <strong>Datos minimos para operar</strong>
                  <span>{onboardingLocked ? 'Pendiente' : 'Listo para operar'}</span>
                </div>
                {onboardingLocked ? (
                  <div className="setup-warning" role="status">
                    <strong>Completa esta configuracion operativa antes de vender.</strong>
                    <span>Paso actual: {firstPendingStep?.label || 'Configuracion pendiente'}</span>
                  </div>
                ) : null}

                <div className="onboarding-checklist" aria-label="Checklist de arranque">
                  {onboardingSteps.map((step) => (
                    <article className="onboarding-step" key={step.key}>
                      <div>
                        <strong>{step.label}</strong>
                        <small>{step.complete ? 'Listo' : 'Pendiente'}</small>
                      </div>
                      {step.complete ? (
                        <span className="status success">Listo</span>
                      ) : (
                        <button className="secondary-button" onClick={() => goToOnboardingTarget(step)} type="button">
                          {step.actionLabel}
                        </button>
                      )}
                    </article>
                  ))}
                </div>

                <div className="form-grid-2">
                  <label>
                    <span>Nombre comercial</span>
                    <input
                      onChange={(event) => setSettingsForm((form) => ({ ...form, commercial_name: event.target.value }))}
                      required
                      value={settingsForm.commercial_name}
                    />
                  </label>
                  <label>
                    <span>Razon social</span>
                    <input
                      onChange={(event) => setSettingsForm((form) => ({ ...form, legal_name: event.target.value }))}
                      required
                      value={settingsForm.legal_name}
                    />
                  </label>
                </div>

                <div className="form-grid-2">
                  <label>
                    <span>RFC</span>
                    <input
                      onChange={(event) => setSettingsForm((form) => ({ ...form, rfc: event.target.value }))}
                      required
                      value={settingsForm.rfc}
                    />
                  </label>
                  <label>
                    <span>Contacto principal</span>
                    <input
                      onChange={(event) => setSettingsForm((form) => ({ ...form, primary_contact_name: event.target.value }))}
                      required
                      value={settingsForm.primary_contact_name}
                    />
                  </label>
                </div>

                <div className="form-grid-2">
                  <label>
                    <span>Telefono</span>
                    <input
                      onChange={(event) => setSettingsForm((form) => ({ ...form, phone: event.target.value }))}
                      required
                      value={settingsForm.phone}
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      onChange={(event) => setSettingsForm((form) => ({ ...form, email: event.target.value }))}
                      required
                      type="email"
                      value={settingsForm.email}
                    />
                  </label>
                </div>

                <div className="form-grid-2">
                  <label>
                    <span>WhatsApp</span>
                    <input
                      onChange={(event) => setSettingsForm((form) => ({ ...form, whatsapp: event.target.value }))}
                      value={settingsForm.whatsapp}
                    />
                  </label>
                  <label>
                    <span>Nombre de sucursal</span>
                    <input
                      onChange={(event) => setSettingsForm((form) => ({ ...form, branch_name: event.target.value }))}
                      required
                      value={settingsForm.branch_name}
                    />
                  </label>
                </div>

                <label>
                  <span>Direccion de sucursal</span>
                  <input
                    onChange={(event) => setSettingsForm((form) => ({ ...form, branch_address: event.target.value }))}
                    value={settingsForm.branch_address}
                  />
                </label>

                <div className="actions-row form-actions">
                  <button className="primary-button" disabled={isSavingSettings} type="submit">
                    {isSavingSettings ? 'Guardando...' : 'Guardar configuracion'}
                  </button>
                </div>
                {saleMessage && activeView === 'Configuracion' ? <p className="sale-message form-message">{saleMessage}</p> : null}
              </form>
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
                  <button className="primary-button new-product-button" onClick={startNewCustomer} type="button">
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
                          <button aria-label={`Editar ${customer.commercial_name}`} onClick={() => editCustomer(customer)} type="button">
                            <Pencil size={16} strokeWidth={2.3} />
                            <span>Editar</span>
                          </button>
                          <button
                            aria-label={`Cambiar estado ${customer.commercial_name}`}
                            disabled={customer.public_customer}
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
                    <button className="primary-button" disabled={isSavingCustomer} type="submit">
                      {isSavingCustomer ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                  {saleMessage && activeView === 'Clientes' && <p className="sale-message form-message">{saleMessage}</p>}
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
                  <button className="primary-button new-product-button" onClick={startNewSupplier} type="button">
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
                          <button aria-label={`Editar ${supplier.commercial_name}`} onClick={() => editSupplier(supplier)} type="button">
                            <Pencil size={16} strokeWidth={2.3} />
                            <span>Editar</span>
                          </button>
                          <button aria-label={`Cambiar estado ${supplier.commercial_name}`} onClick={() => void toggleSupplierActive(supplier)} type="button">
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
                    <button className="primary-button" disabled={isSavingSupplier} type="submit">
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
                    disabled={!hasSuppliers || !hasProducts}
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
                            <button aria-label={`Anular ${purchase.folio}`} onClick={() => startCancelPurchase(purchase)} type="button">
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
                          <button className="primary-button" disabled={isCancellingPurchase} type="submit">
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
                    <button className="primary-button" disabled={isSavingPurchase} type="submit">
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
                    <button className={cashMode === 'open' ? 'active' : ''} onClick={() => setCashMode('open')} type="button">
                      Abrir
                    </button>
                  ) : null}
                  {cashSession ? (
                    <>
                      <button className={cashMode === 'movement' ? 'active' : ''} onClick={() => setCashMode('movement')} type="button">
                        Movimiento
                      </button>
                      <button className={cashMode === 'close' ? 'active' : ''} onClick={() => setCashMode('close')} type="button">
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
                    <button className="primary-button" disabled={isSavingCashAction || !actingUserId} type="submit">
                      {isSavingCashAction ? 'Abriendo...' : 'Abrir caja'}
                    </button>
                  </div>
                </form>
              ) : null}

              {cashMode === 'movement' && cashSession ? (
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
                    <button className="primary-button" disabled={isSavingCashAction} type="submit">
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
                  <div className="actions-row form-actions">
                    <button className="ghost-button" onClick={() => setCashMode('summary')} type="button">Volver</button>
                    <button className="primary-button" disabled={isSavingCashAction} type="submit">
                      {isSavingCashAction ? 'Cerrando...' : 'Cerrar caja'}
                    </button>
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
                      <small>{cashSession?.opened_at ? new Date(cashSession.opened_at).toLocaleString('es-MX') : 'Sin turno activo'}</small>
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
          <div className="tenant-switch drawer-tenant">
            <span>Negocio activo</span>
            <strong>{businessName}</strong>
          </div>
          <button className="text-button drawer-logout" onClick={handleLogout} type="button">Salir</button>
          <nav className="nav-list drawer-nav">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                className={label === activeView ? 'active' : ''}
                disabled={onboardingLocked && !onboardingAllowedViews.has(label)}
                key={label}
                onClick={() => {
                  setMobileMenuOpen(false)
                  goToView(label)
                }}
                type="button"
              >
                <Icon size={18} strokeWidth={2.2} />
                {renderNavLabel(label)}
              </button>
            ))}
          </nav>
        </aside>
      </div>

      <nav className="mobile-nav" aria-label="Navegacion movil">
        {mobilePrimaryNavItems.map(({ label, icon: Icon }) => (
          <button
            className={label === activeView ? 'active' : ''}
            disabled={onboardingLocked && !onboardingAllowedViews.has(label)}
            key={label}
            onClick={() => goToView(label)}
            type="button"
          >
            <Icon size={18} strokeWidth={2.3} />
            <span>{label}</span>
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
