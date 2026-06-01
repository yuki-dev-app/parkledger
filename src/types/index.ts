export type GarageStatus = 'vacant' | 'occupied' | 'maintenance';
export type PaymentStatus = 'paid' | 'unpaid' | 'late';
export type InquiryStatus = 'new' | 'in_progress' | 'resolved';

export type Garage = {
  id: number;
  number: string;
  status: GarageStatus;
  monthly_fee: number;
  notes: string;
  contractor_name?: string;
};

export type Contractor = {
  id: number;
  garage_id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  vehicle_type: string;
  vehicle_number: string;
  vehicle_chassis: string;
  emergency_contact: string;
  contract_start: string;
  contract_end: string;
  notes: string;
  garage_number: string;
  monthly_fee: number;
};

export type Payment = {
  contractor_id: number;
  contractor_name: string;
  garage_number: string;
  amount: number;
  payment_id: number | null;
  status: PaymentStatus;
  paid_date: string;
};

export type Inquiry = {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  notes: string;
};

export type CleaningLog = {
  id: number;
  cleaned_date: string;
  person: string;
  notes: string;
  created_at: string;
};

export type Settings = {
  business_name: string;
  business_address: string;
  business_phone: string;
  parking_name: string;
  parking_address: string;
  receipt_no_prefix: string;
  cleaning_persons: string;
};
