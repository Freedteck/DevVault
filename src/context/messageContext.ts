import { createContext } from "react";

export const MessageContext = createContext({
  conversations: [],
  messages: [],
  allProfiles: [],
  newMessage: null,
  activeConversation: null,
  fetchConversations: () => {},
  fetchAllProfiles: () => {},
  handleConversationClick: (conversationId: string) => {},
  handleSendMessage: (messageInput: string) => {},
  initializeConversation: (partnerAccountId?: string) => {},
  checkExistingConversations: (userId?: string) => {},
  isActive: false, // New property to track active state
});
