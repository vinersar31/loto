export type DrawData = {
  date: string;
  numbers: number[];
  joker?: number;
};

export type SimulationStats = {
  totalDrawsSimulated: number;
  totalTicketsGenerated: number;
  wins: Record<string, number>;
  totalCost: number;
  estimatedWin: number;
  timestamp: number;
};

export type LotoData = {
  loto649: DrawData[];
  joker: DrawData[];
};
