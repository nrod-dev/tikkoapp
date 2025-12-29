import {
    Briefcase,
    Car,
    CreditCard,
    Film,
    Fuel,
    GraduationCap,
    Home,
    Plane,
    Scissors,
    ShoppingBag,
    ShoppingCart,
    Stethoscope,
    Store,
    Utensils,
    Zap,
    Gamepad2,
    Gift,
    Package
} from "lucide-react";

export type ExpenseStatus = 'approved' | 'rejected' | 'pending' | 'pendiente' | 'processing';

export const EXPENSE_CATEGORIES = [
    "Otros servicios",
    "Hogar",
    "Aeorolinea",
    "Transporte",
    "Alojamiento",
    "Salud",
    "Viajes y Turismo",
    "Electro y Tecnologia",
    "Servicios Financieros",
    "Comercio Minorista",
    "Combustible",
    "Recreacion",
    "Cuidado y Belleza",
    "Gastronomia",
    "Jugueteria",
    "Educación",
    "Supermercado",
    "Servicios Publicos"
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const CATEGORY_ICONS: Record<string, any> = {
    "Otros servicios": Briefcase,
    "Hogar": Home,
    "Aeorolinea": Plane,
    "Transporte": Car,
    "Alojamiento": Home, // Maybe Hotel/Bed if available, using Home as fallback or generic
    "Salud": Stethoscope,
    "Viajes y Turismo": Plane,
    "Electro y Tecnologia": Zap, // Zap or similar
    "Servicios Financieros": CreditCard,
    "Comercio Minorista": Store,
    "Combustible": Fuel,
    "Recreacion": Film, // or Gamepad
    "Cuidado y Belleza": Scissors,
    "Gastronomia": Utensils,
    "Jugueteria": Gamepad2, // Or similar
    "Educación": GraduationCap,
    "Supermercado": ShoppingCart,
    "Servicios Publicos": Zap,
    // Fallbacks
    "default": ShoppingBag
};

export interface Expense {
    id: string;
    merchantName: string;
    merchantLogo: string; // URL or placeholder color
    date: string;
    user: string;
    amount: number;
    currency: string;
    status: ExpenseStatus;
    receiptUrl?: string;
    paymentMethod: string;
    ivaAmount: number | null; // IVA extracted or manual
    category?: string; // Now we could type this optionally as ExpenseCategory | string to allow legacy data briefly
    merchantTaxId?: string;
}

