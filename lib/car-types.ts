export type Vehicle = {
  id: string;
  name: string;
  registration?: string;
  make: string;
  model: string;
  year?: number;
  fuelType?: string;
  mileage?: number;
  motExpiry?: string;
  taxExpiry?: string;
  insuranceExpiry?: string;
  breakdownExpiry?: string;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  notes?: string;
};

export type VehicleCostType = "Fuel" | "Repair" | "Service" | "Insurance" | "Tax" | "MOT" | "Tyres" | "Breakdown" | "Parking" | "Other";

export type VehicleCost = {
  id: string;
  vehicleId: string;
  type: VehicleCostType;
  amount: number;
  date: string;
  mileage?: number;
  description: string;
};

export type ParkingCase = {
  id: string;
  vehicleId: string;
  issuer: string;
  reference?: string;
  incidentDate: string;
  deadline?: string;
  amount: number;
  status: "Open" | "Appealed" | "Paid" | "Cancelled";
  notes?: string;
};

export type CarData = {
  vehicles: Vehicle[];
  costs: VehicleCost[];
  parkingCases: ParkingCase[];
};
