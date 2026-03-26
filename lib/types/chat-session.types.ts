export type ChatSessionStatus = "waiting" | "active" | "ended";

export interface ChatSession {
  id: string;
  shopId: string;
  clientName: string;
  status: ChatSessionStatus;
  createdAt: any;
  lastMessageAt?: any;
  employeeId?: string;
  employeeName?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "client" | "employee";
  senderName: string;
  createdAt: any;
}
