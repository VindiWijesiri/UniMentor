export type PlanCode = 'free' | 'plus' | 'pro';

export interface PlanOffer {
  code: PlanCode;
  name: string;
  priceLkr: number;
  period: string;
  tagline: string;
  features: string[];
}

export interface ChosenPlan {
  code: PlanCode;
  name: string;
  priceLkr: number;
  chosenAt?: string;
  updatedAt?: string;
}

export interface PlanFeed {
  plans: PlanOffer[];
  current: ChosenPlan | null;
}
