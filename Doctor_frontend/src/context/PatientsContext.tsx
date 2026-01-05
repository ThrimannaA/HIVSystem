import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Patient {
  id: string;
  age: number;
  sex: string;
  PI_MU: number;
  NRTI_MU: number;
  NNRTI_MU: number;
  totalMutations: number;
  riskScore: number;
  riskLevel: string;
  viralLoad: string;
  artDuration: string;
  timeAgo: string;
  recommendation: string;
}

interface PatientsContextType {
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
}

const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

const samplePatients: Patient[] = [
  {
    id: 'P12345',
    age: 42,
    sex: 'Male',
    PI_MU: 3,
    NRTI_MU: 5,
    NNRTI_MU: 2,
    totalMutations: 10,
    riskScore: 0.78,
    riskLevel: 'High Risk',
    viralLoad: '85000',
    artDuration: '24',
    timeAgo: '2 hours ago',
    recommendation: 'CHANGE ART REGIMEN',
  },
  {
    id: 'P12344',
    age: 35,
    sex: 'Female',
    PI_MU: 1,
    NRTI_MU: 2,
    NNRTI_MU: 0,
    totalMutations: 3,
    riskScore: 0.25,
    riskLevel: 'Low Risk',
    viralLoad: '12000',
    artDuration: '18',
    timeAgo: '5 hours ago',
    recommendation: 'CONTINUE CURRENT ART',
  },
  {
    id: 'P12343',
    age: 28,
    sex: 'Male',
    PI_MU: 0,
    NRTI_MU: 1,
    NNRTI_MU: 0,
    totalMutations: 1,
    riskScore: 0.12,
    riskLevel: 'Low Risk',
    viralLoad: '8000',
    artDuration: '12',
    timeAgo: '1 day ago',
    recommendation: 'CONTINUE CURRENT ART',
  },
];

export const PatientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(samplePatients);

  const addPatient = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  };

  return (
    <PatientsContext.Provider value={{ patients, setPatients, addPatient }}>
      {children}
    </PatientsContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientsContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }
  return context;
};

