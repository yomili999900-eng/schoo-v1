import axios from 'axios';

export interface PaymentSessionResponse {
  statut: boolean;
  token: string;
  message: string;
  url: string;
}

export async function initiatePayment(data: {
  userId: string;
  amount: number;
  phoneNumber: string;
  customerName?: string;
  planId?: string;
}): Promise<PaymentSessionResponse> {
  try {
    const response = await axios.post('/api/payments/initiate', data);
    return response.data;
  } catch (error: any) {
    console.error("Payment initiation failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error || "Échec de l'initialisation du paiement");
  }
}

export async function checkPaymentStatus(token: string) {
  try {
    const response = await axios.get(`https://www.pay.moneyfusion.net/paiementNotif/${token}`);
    return response.data;
  } catch (error) {
    console.error("Status check failed:", error);
    throw error;
  }
}
