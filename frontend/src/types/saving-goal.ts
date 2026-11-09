export interface SavingGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null; 
  is_completed: boolean;
}