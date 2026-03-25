// ── Auth ─────────────────────────────────────────────────────
export const MOCK_LOGIN_RESPONSE = {
  token: "mock-jwt-token-abc123",
  admin: {
    id: "admin-001",
    email: "admin@tokia-loh.com",
    firstName: "Admin",
    lastName: "Tokia",
    phone: "+225 07 00 11 22",
    city: "Abidjan",
  },
};

// ── Dashboard ────────────────────────────────────────────────
export const MOCK_DASHBOARD = {
  total_orders: 142,
  total_revenue: 1_850_000,
  total_clients: 98,
  total_products: 34,
  recent_orders: [
    {
      id: "ord-001",
      client: "Kouamé Jean",
      total: 25000,
      status: "pending",
      created_at: "2025-03-10T09:00:00Z",
    },
    {
      id: "ord-002",
      client: "Awa Traoré",
      total: 47500,
      status: "delivered",
      created_at: "2025-03-09T14:30:00Z",
    },
    {
      id: "ord-003",
      client: "Moussa Koné",
      total: 12000,
      status: "cancelled",
      created_at: "2025-03-09T11:00:00Z",
    },
    {
      id: "ord-004",
      client: "Fatou Diallo",
      total: 89000,
      status: "pending",
      created_at: "2025-03-08T16:00:00Z",
    },
    {
      id: "ord-005",
      client: "Ibrahim Soro",
      total: 33500,
      status: "delivered",
      created_at: "2025-03-07T10:00:00Z",
    },
  ],
  sales_chart: [
    { date: "2025-03-04", revenue: 120000, orders: 8 },
    { date: "2025-03-05", revenue: 95000, orders: 6 },
    { date: "2025-03-06", revenue: 210000, orders: 14 },
    { date: "2025-03-07", revenue: 175000, orders: 11 },
    { date: "2025-03-08", revenue: 305000, orders: 20 },
    { date: "2025-03-09", revenue: 260000, orders: 17 },
    { date: "2025-03-10", revenue: 390000, orders: 25 },
  ],
  top_cities: [
    { city: "Abidjan", orders: 89 },
    { city: "Bouaké", orders: 24 },
    { city: "Daloa", orders: 12 },
    { city: "Yamoussoukro", orders: 9 },
    { city: "San-Pédro", orders: 8 },
  ],
  low_stock: [
    { id: "prod-003", name: "Casque Bluetooth JBL", stock: 2, image: null },
    { id: "prod-007", name: "Montre Connectée", stock: 1, image: null },
    { id: "prod-011", name: "Enceinte Portable", stock: 3, image: null },
  ],
};

// ── Catégories ───────────────────────────────────────────────
export const MOCK_CATEGORIES = [
  {
    id: "cat-001",
    name: "Électronique",
    icon: null,
    is_active: true,
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "cat-002",
    name: "Mode & Vêtements",
    icon: null,
    is_active: true,
    created_at: "2025-01-11T00:00:00Z",
  },
  {
    id: "cat-003",
    name: "Beauté",
    icon: null,
    is_active: false,
    created_at: "2025-01-12T00:00:00Z",
  },
  {
    id: "cat-004",
    name: "Maison & Cuisine",
    icon: null,
    is_active: true,
    created_at: "2025-01-13T00:00:00Z",
  },
  {
    id: "cat-005",
    name: "Sport",
    icon: null,
    is_active: true,
    created_at: "2025-01-14T00:00:00Z",
  },
];

// ── Produits ─────────────────────────────────────────────────
export const MOCK_PRODUCTS = [
  {
    id: "prod-001",
    name: "iPhone 15 Pro",
    price: "850000.00",
    stock: 10,
    description: "Dernier modèle Apple avec puce A17 Pro.",
    image:
      "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=400",
    others_details: ["256GB", "Titanium", "1 an de garantie"],
    category: "cat-001",
    is_active: true,
    videos: [],
    created_at: "2025-02-01T00:00:00Z",
  },
  {
    id: "prod-002",
    name: "Samsung Galaxy S24",
    price: "620000.00",
    stock: 7,
    description: "Flagship Samsung avec Galaxy AI.",
    image:
      "https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-s921-sm-s921bzadeub-thumb-539573052?$650_519_PNG$",
    others_details: ["128GB", "Phantom Black"],
    category: "cat-001",
    is_active: true,
    videos: [],
    created_at: "2025-02-05T00:00:00Z",
  },
  {
    id: "prod-003",
    name: "Casque Bluetooth JBL",
    price: "45000.00",
    stock: 2,
    description: "Casque sans fil avec réduction de bruit active.",
    image: null,
    others_details: ["Bluetooth 5.0", "30h autonomie"],
    category: "cat-001",
    is_active: true,
    videos: [],
    created_at: "2025-02-10T00:00:00Z",
  },
  {
    id: "prod-004",
    name: "Robe Africaine Wax",
    price: "15000.00",
    stock: 25,
    description: "Robe élégante en tissu wax 100% coton.",
    image: null,
    others_details: ["Taille M", "Lavable en machine"],
    category: "cat-002",
    is_active: true,
    videos: [],
    created_at: "2025-02-15T00:00:00Z",
  },
  {
    id: "prod-005",
    name: "Crème Hydratante Shea",
    price: "8500.00",
    stock: 40,
    description: "Crème au beurre de karité pour peaux sèches.",
    image: null,
    others_details: ["200ml", "Sans paraben"],
    category: "cat-003",
    is_active: false,
    videos: [],
    created_at: "2025-02-20T00:00:00Z",
  },
];

// ── Clients ──────────────────────────────────────────────────
export const MOCK_CLIENTS = [
  {
    id: "64f83386-652c-4ec1-ab5e-feecd027851a",
    first_name: "Kouamé",
    last_name: "Jean",
    phone: "+22507001122",
    city: "Abidjan",
    is_active: true,
    is_blocked: false,
    created_at: "2025-01-15T00:00:00Z",
    orders_count: 8,
    total_spent: 185000,
  },
  {
    id: "client-002",
    first_name: "Awa",
    last_name: "Traoré",
    phone: "+22507334455",
    city: "Bouaké",
    is_active: true,
    is_blocked: false,
    created_at: "2025-01-20T00:00:00Z",
    orders_count: 3,
    total_spent: 67500,
  },
  {
    id: "client-003",
    first_name: "Moussa",
    last_name: "Koné",
    phone: "+22505112233",
    city: "Daloa",
    is_active: false,
    is_blocked: true,
    created_at: "2025-02-01T00:00:00Z",
    orders_count: 1,
    total_spent: 12000,
  },
];

// ── Publicités ───────────────────────────────────────────────
export const MOCK_PUBS = [
  {
    id: "5872b86f-9dad-48a4-b566-dd6bc35f1e7d",
    title: "Soldes d'été — jusqu'à -50%",
    content:
      "Profitez de nos offres exceptionnelles sur toute la gamme électronique.",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
    is_active: true,
    created_at: "2025-03-01T00:00:00Z",
  },
  {
    id: "pub-002",
    title: "Nouveautés Mode",
    content:
      "Découvrez notre nouvelle collection de vêtements wax pour femmes.",
    image: null,
    is_active: false,
    created_at: "2025-03-05T00:00:00Z",
  },
];
