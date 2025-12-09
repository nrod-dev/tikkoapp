
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
}

export const expenses: Expense[] = [
    {
        id: '1',
        merchantName: 'YPF',
        merchantLogo: 'Y',
        date: '19/11/2025',
        user: 'Tobias Savich',
        amount: 30770.55,
        currency: 'ARS',
        status: 'pending',
        paymentMethod: 'Mendel física',
    },
    {
        id: '2',
        merchantName: 'EST.DE SERVICIO GIUFRA',
        merchantLogo: 'E',
        date: '17/11/2025',
        user: 'Tomas Estruga',
        amount: 3400.00,
        currency: 'ARS',
        status: 'pending',
        paymentMethod: 'Mendel física',
    },
    {
        id: '3',
        merchantName: 'DiDi',
        merchantLogo: 'D',
        date: '22/10/2025',
        user: 'Tobias Savich',
        amount: 5640.00,
        currency: 'ARS',
        status: 'pending',
        paymentMethod: 'Mendel física',
    },
    {
        id: '4',
        merchantName: 'EARLY BIRD',
        merchantLogo: 'E',
        date: '20/10/2025',
        user: 'Tomas Estruga',
        amount: 5500.00,
        currency: 'ARS',
        status: 'pending',
        paymentMethod: 'Mendel física',
    },
    {
        id: '5',
        merchantName: 'YPF',
        merchantLogo: 'Y',
        date: '13/10/2025',
        user: 'Tomas Estruga',
        amount: 15000.05,
        currency: 'ARS',
        status: 'pending',
        paymentMethod: 'Mendel física',
    },
    {
        id: '6',
        merchantName: 'DiDi',
        merchantLogo: 'D',
        date: '06/10/2025',
        user: 'Victoria Propato',
        amount: 8290.00,
        currency: 'ARS',
        status: 'pending',
        paymentMethod: 'Mendel virtual',
    },
];
