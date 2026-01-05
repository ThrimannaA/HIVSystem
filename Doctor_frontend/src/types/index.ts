export type Customer = {
id?: string;
name: string;
address: string;
contactNumber: string;
customerType: 'residential' | 'commercial';
createdAt?: any;
};


export type BillReading = {
id?: string;
billId?: string;
customerId: string;
readingValue: number;
previousReading?: number | null;
consumption?: number | null;
amountDue: number;
readingDate?: any;
createdAt?: any;
};

type MenuButtonProps = {
  iconName: string;
  label: string;
  onPress: () => void;
};

type MenuScreenProps = {
  navigation: any; // You can replace `any` with proper navigation type later
};