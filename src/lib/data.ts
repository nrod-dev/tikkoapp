
export type ExpenseStatus = 'approved' | 'rejected' | 'pending';

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
    taxAmount: number; // IVA
}


