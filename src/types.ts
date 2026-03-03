export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  image: string;
  description: string;
  features: string[];
}

export const MOCK_CARS: Car[] = [
  {
    id: '1',
    brand: 'Toyota',
    model: 'Corolla Cross',
    year: 2024,
    price: 175000,
    mileage: 0,
    fuel: 'Híbrido',
    transmission: 'Automático',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800',
    description: 'O SUV híbrido mais confiável do mercado, unindo economia e conforto.',
    features: ['Teto Solar', 'Câmera 360', 'Piloto Automático Adaptativo']
  },
  {
    id: '2',
    brand: 'BMW',
    model: '320i M Sport',
    year: 2023,
    price: 320000,
    mileage: 5000,
    fuel: 'Gasolina',
    transmission: 'Automático',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800',
    description: 'Puro prazer de dirigir com o pacote M Sport completo.',
    features: ['Som Harman Kardon', 'Head-up Display', 'Bancos em Couro']
  },
  {
    id: '3',
    brand: 'Porsche',
    model: '911 Carrera S',
    year: 2022,
    price: 980000,
    mileage: 2500,
    fuel: 'Gasolina',
    transmission: 'PDK',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
    description: 'O ícone dos carros esportivos em sua melhor forma.',
    features: ['Sport Chrono', 'Escapamento Esportivo', 'Rodas 20/21']
  },
  {
    id: '4',
    brand: 'Jeep',
    model: 'Compass Longitude',
    year: 2024,
    price: 195000,
    mileage: 0,
    fuel: 'Diesel',
    transmission: 'Automático',
    image: 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?auto=format&fit=crop&q=80&w=800',
    description: 'Capacidade off-road com o luxo urbano que você merece.',
    features: ['Tração 4x4', 'Central Multimídia 10"', 'Painel Digital']
  },
  {
    id: '5',
    brand: 'Tesla',
    model: 'Model 3 Performance',
    year: 2023,
    price: 450000,
    mileage: 1200,
    fuel: 'Elétrico',
    transmission: 'Automático',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800',
    description: 'Aceleração instantânea e tecnologia de ponta.',
    features: ['Autopilot', 'Aceleração 0-100 em 3.3s', 'Teto de Vidro']
  },
  {
    id: '6',
    brand: 'Audi',
    model: 'RS e-tron GT',
    year: 2024,
    price: 1100000,
    mileage: 0,
    fuel: 'Elétrico',
    transmission: 'Automático',
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800',
    description: 'O futuro da performance elétrica da Audi.',
    features: ['Suspensão a Ar', 'Faróis Matrix LED', 'Interior em Alcântara']
  }
];
