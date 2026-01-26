/**
 * Creator Payment & Invoicing Service
 * 
 * Comprehensive payment processing and invoice management for creators.
 * Handles payments, invoices, earnings tracking, and financial reporting.
 */

import { db } from './apiService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit,
  Timestamp
} from '../services/firestoreCompat';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  creatorId: string;
  creatorName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  projectId?: string;
  projectName?: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  creatorId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'OTHER';
  transactionId?: string;
  processedAt?: Timestamp;
  failureReason?: string;
  createdAt: Timestamp;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  averageInvoiceValue: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

/**
 * Generate unique invoice number
 */
const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
};

/**
 * Create new invoice
 */
export const createInvoice = async (
  creatorId: string,
  creatorName: string,
  clientId: string,
  clientName: string,
  clientEmail: string,
  items: InvoiceItem[],
  dueDate: Date,
  taxRate: number = 0,
  notes?: string,
  projectId?: string,
  projectName?: string
): Promise<{ success: boolean; invoiceId?: string; error?: string }> => {
  try {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const invoice = {
      invoiceNumber: generateInvoiceNumber(),
      creatorId,
      creatorName,
      clientId,
      clientName,
      clientEmail,
      projectId,
      projectName,
      status: 'DRAFT' as const,
      items,
      subtotal,
      tax,
      taxRate,
      total,
      currency: 'USD',
      dueDate: Timestamp.fromDate(dueDate),
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'creatorInvoices'), invoice);
    
    return { success: true, invoiceId: docRef.id };
  } catch (error) {
    console.error('[PaymentService] Error creating invoice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get invoices for creator
 */
export const getCreatorInvoices = async (
  creatorId: string,
  status?: Invoice['status']
): Promise<Invoice[]> => {
  try {
    const invoicesRef = collection(db, 'creatorInvoices');
    let q = query(
      invoicesRef,
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    if (status) {
      q = query(
        invoicesRef,
        where('creatorId', '==', creatorId),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invoice));
  } catch (error) {
    console.error('[PaymentService] Error getting invoices:', error);
    return [];
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (
  invoiceId: string,
  status: Invoice['status'],
  paidDate?: Date
): Promise<{ success: boolean; error?: string }> => {
  try {
    const invoiceRef = doc(db, 'creatorInvoices', invoiceId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'PAID' && paidDate) {
      updateData.paidDate = Timestamp.fromDate(paidDate);
    }

    await updateDoc(invoiceRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('[PaymentService] Error updating invoice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Send invoice to client
 */
export const sendInvoice = async (invoiceId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const invoiceRef = doc(db, 'creatorInvoices', invoiceId);
    await updateDoc(invoiceRef, {
      status: 'SENT',
      updatedAt: serverTimestamp()
    });
    
    // TODO: Send email notification to client
    // This would integrate with SendGrid, AWS SES, or similar
    
    return { success: true };
  } catch (error) {
    console.error('[PaymentService] Error sending invoice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Record payment for invoice
 */
export const recordPayment = async (
  invoiceId: string,
  creatorId: string,
  clientId: string,
  amount: number,
  paymentMethod: Payment['paymentMethod'],
  transactionId?: string
): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  try {
    const payment = {
      invoiceId,
      creatorId,
      clientId,
      amount,
      currency: 'USD',
      status: 'COMPLETED' as const,
      paymentMethod,
      transactionId,
      processedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'creatorPayments'), payment);
    
    // Update invoice status to PAID
    await updateInvoiceStatus(invoiceId, 'PAID', new Date());
    
    return { success: true, paymentId: docRef.id };
  } catch (error) {
    console.error('[PaymentService] Error recording payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get earnings summary for creator
 */
export const getEarningsSummary = async (creatorId: string): Promise<EarningsSummary> => {
  try {
    const invoicesRef = collection(db, 'creatorInvoices');
    const q = query(invoicesRef, where('creatorId', '==', creatorId));
    const snapshot = await getDocs(q);
    
    const invoices = snapshot.docs.map(doc => doc.data() as Invoice);
    
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
    const pendingInvoices = invoices.filter(inv => inv.status === 'SENT');
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status !== 'SENT') return false;
      const dueDate = inv.dueDate.toDate();
      return dueDate < new Date();
    });

    const totalEarnings = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const pendingEarnings = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const thisMonthEarnings = paidInvoices
      .filter(inv => inv.paidDate && inv.paidDate.toDate() >= thisMonthStart)
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const lastMonthEarnings = paidInvoices
      .filter(inv => {
        if (!inv.paidDate) return false;
        const paidDate = inv.paidDate.toDate();
        return paidDate >= lastMonthStart && paidDate <= lastMonthEnd;
      })
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const averageInvoiceValue = invoices.length > 0 
      ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length 
      : 0;

    return {
      totalEarnings,
      pendingEarnings,
      paidEarnings: totalEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      averageInvoiceValue,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      overdueInvoices: overdueInvoices.length
    };
  } catch (error) {
    console.error('[PaymentService] Error getting earnings summary:', error);
    return {
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      thisMonthEarnings: 0,
      lastMonthEarnings: 0,
      averageInvoiceValue: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      overdueInvoices: 0
    };
  }
};

/**
 * Delete invoice (only DRAFT status)
 */
export const deleteInvoice = async (invoiceId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Note: Should check if status is DRAFT before allowing deletion
    const invoiceRef = doc(db, 'creatorInvoices', invoiceId);
    await updateDoc(invoiceRef, {
      status: 'CANCELLED',
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('[PaymentService] Error deleting invoice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (creatorId: string): Promise<Payment[]> => {
  try {
    const paymentsRef = collection(db, 'creatorPayments');
    const q = query(
      paymentsRef,
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  } catch (error) {
    console.error('[PaymentService] Error getting payment history:', error);
    return [];
  }
};
