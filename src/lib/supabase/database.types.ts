export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          broker: string | null;
          account_number: string | null;
          account_type: string;
          starting_balance: number;
          currency: string;
          max_daily_risk_percent: number;
          max_drawdown_percent: number;
          profit_target_percent: number;
          trading_style: string;
          trailing_drawdown: boolean;
          metaapi_account_id: string | null;
          metaapi_token: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          broker?: string | null;
          account_number?: string | null;
          account_type?: string;
          starting_balance?: number;
          currency?: string;
          max_daily_risk_percent?: number;
          max_drawdown_percent?: number;
          profit_target_percent?: number;
          trading_style?: string;
          trailing_drawdown?: boolean;
          metaapi_account_id?: string | null;
          metaapi_token?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          broker?: string | null;
          account_number?: string | null;
          account_type?: string;
          starting_balance?: number;
          currency?: string;
          max_daily_risk_percent?: number;
          max_drawdown_percent?: number;
          profit_target_percent?: number;
          trading_style?: string;
          trailing_drawdown?: boolean;
          metaapi_account_id?: string | null;
          metaapi_token?: string | null;
          is_active?: boolean;
        };
      };
      trades: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          date: string;
          symbol: string;
          direction: string;
          position_size: number;
          entry: number;
          stop_loss: number;
          take_profit: number | null;
          exit: number | null;
          pnl: number | null;
          risk_amount: number | null;
          risk_percent: number | null;
          r_multiple: number | null;
          status: string;
          trading_style: string;
          notes: string;
          tags: string[];
          mt5_ticket: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id: string;
          date: string;
          symbol: string;
          direction: string;
          position_size: number;
          entry: number;
          stop_loss: number;
          take_profit?: number | null;
          exit?: number | null;
          pnl?: number | null;
          risk_amount?: number | null;
          risk_percent?: number | null;
          r_multiple?: number | null;
          status?: string;
          trading_style?: string;
          notes?: string;
          tags?: string[];
          mt5_ticket?: string | null;
          created_at?: string;
        };
        Update: {
          account_id?: string;
          date?: string;
          symbol?: string;
          direction?: string;
          position_size?: number;
          entry?: number;
          stop_loss?: number;
          take_profit?: number | null;
          exit?: number | null;
          pnl?: number | null;
          risk_amount?: number | null;
          risk_percent?: number | null;
          r_multiple?: number | null;
          status?: string;
          trading_style?: string;
          notes?: string;
          tags?: string[];
          mt5_ticket?: string | null;
        };
      };
    };
  };
}
