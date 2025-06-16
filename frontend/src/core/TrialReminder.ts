import { AppError } from '@/utils/errorHandling';

interface TrialStatus {
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  daysRemaining: number;
}

export class TrialReminder {
  private static instance: TrialReminder;
  private trials: Map<string, TrialStatus>;

  private constructor() {
    this.trials = new Map();
  }

  public static getInstance(): TrialReminder {
    if (!TrialReminder.instance) {
      TrialReminder.instance = new TrialReminder();
    }
    return TrialReminder.instance;
  }

  public startTrial(shopId: string, durationInDays: number = 14): void {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationInDays);

    this.trials.set(shopId, {
      startDate,
      endDate,
      isActive: true,
      daysRemaining: durationInDays
    });
  }

  public getTrialStatus(shopId: string): TrialStatus {
    const trial = this.trials.get(shopId);
    if (!trial) {
      throw new AppError('No trial found for this shop', 404);
    }

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trial.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    const updatedStatus = {
      ...trial,
      isActive: daysRemaining > 0,
      daysRemaining
    };

    this.trials.set(shopId, updatedStatus);
    return updatedStatus;
  }

  public endTrial(shopId: string): void {
    const trial = this.trials.get(shopId);
    if (!trial) {
      throw new AppError('No trial found for this shop', 404);
    }

    this.trials.set(shopId, {
      ...trial,
      isActive: false,
      daysRemaining: 0
    });
  }

  public getAllTrials(): Map<string, TrialStatus> {
    return new Map(this.trials);
  }
}
