import Dexie, { type Table } from 'dexie';

export interface Customer {
  id?: string; // UUID string
  name: string;
  nameKannada?: string;
  phone?: string;
  village?: string; // Customer village name
  balance: number; // Outstanding balance: positive means they owe money (credit), 0 or negative means no due or overpaid
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id?: string; // UUID string
  customerId: string;
  type: 'credit' | 'payment';
  amount: number;
  description?: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

class DigitalKhataDatabase extends Dexie {
  customers!: Table<Customer, string>;
  transactions!: Table<Transaction, string>;

  constructor() {
    super('DigitalKhataDB');
    this.version(1).stores({
      customers: 'id, name, nameKannada, phone, balance, createdAt, updatedAt',
      transactions: 'id, customerId, type, date, createdAt'
    });
  }
}

export const db = new DigitalKhataDatabase();
