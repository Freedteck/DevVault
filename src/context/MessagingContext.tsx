import { useContext, useCallback, useState, useEffect } from "react";
import {
  createConversation,
  getAllProfiles,
  getExistingConversation,
  getUserConversationsWithPartners,
} from "@/lib/supabase";
import { WalletConnectClient } from "@/client/walletConnectClient";
import { MirrorNodeClient } from "@/services/mirrorNodeClient";
import { MessageContext } from "./messageContext";
import { userWalletContext } from "./userWalletContext";

export const MessagingProvider = ({ children, isActive = false }) => {
  const [activeConversation, setActiveConversation] = useState();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const { accountId, userProfile } = useContext(userWalletContext);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState();

  const fetchAllProfiles = useCallback(async () => {
    if (!isActive) return;

    try {
      const { data: profiles } = await getAllProfiles();
      setAllProfiles(profiles || []);
    } catch (error) {
      console.error("Error fetching all profiles:", error);
    }
  }, [isActive]);

  const fetchConversations = useCallback(async () => {
    if (!accountId || !isActive) return;

    try {
      const data = await getUserConversationsWithPartners(accountId);
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, [accountId, isActive]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!isActive) return;

      try {
        const { getTopicMessages } = await MirrorNodeClient();

        const conversation = conversations?.find(
          (c) => c?.conversation_id === conversationId
        );

        if (conversation) {
          const { messages } = await getTopicMessages(
            conversation?.hedera_topic_id
          );
          setMessages(messages.reverse() || []);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    [conversations, isActive]
  );

  const handleConversationClick = async (conversationId: any) => {
    if (!isActive) return;
    setActiveConversation(conversationId);
    await fetchMessages(conversationId);
  };

  const initializeConversation = async (partnerAccountId: string) => {
    if (!accountId || !isActive) return;

    try {
      const { createTopic } = await WalletConnectClient();
      const hederaTopicId = await createTopic();
      const response = await createConversation(
        hederaTopicId.toString(),
        accountId,
        partnerAccountId
      );

      if (response) {
        await fetchConversations();
      }
    } catch (error) {
      console.error("Error initializing conversation:", error);
    }
  };

  const handleSendMessage = async (messageInput: string) => {
    if (messageInput.trim() === "" || !activeConversation || !isActive) return;

    try {
      const { createTopicMessage } = await WalletConnectClient();
      const activeConversationData = conversations.find(
        (c) => c?.conversation_id === activeConversation
      );

      if (!activeConversationData) return;

      const messageData = {
        content: messageInput,
        sender: userProfile,
        receiver: activeConversationData?.partner,
        timestamp: new Date().toISOString(),
      };

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const loadingMessage = {
        data: messageData,
        isLoading: true,
        tempId: tempId,
      };

      setMessages((prevMessages) => [...prevMessages, loadingMessage]);

      const response = await createTopicMessage(
        messageData,
        activeConversationData?.hedera_topic_id
      );

      if (response) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, isLoading: false, tempId: undefined }
              : msg
          )
        );
      } else {
        console.error("Failed to send message");
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.tempId !== tempId)
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.isLoading && msg.tempId == null)
      );
    }
  };

  const checkExistingConversations = useCallback(
    async (userId?: string) => {
      if (!accountId || !isActive) return;

      try {
        let id = "";
        if (userId) {
          id = userId;
        } else {
          if (conversations.length > 0) {
            const firstConversation = conversations[0];
            id = firstConversation?.partner?.account_id;
          }
        }

        if (id) {
          const response = await getExistingConversation(accountId, id);

          if (response) {
            setActiveConversation(response.conversation_id);
            if (conversations.length > 0) {
              await fetchMessages(response.conversation_id);
            }
          } else {
            const { data: allProfiles } = await getAllProfiles();

            const partnerProfiles = allProfiles?.filter(
              (profile) => profile?.account_id !== accountId
            );

            const partnerProfile = partnerProfiles?.find(
              (profile) => profile?.account_id === id
            );
            if (partnerProfile) {
              setNewMessage(partnerProfile);
            } else {
            }
            setAllProfiles(partnerProfiles || []);
          }
        }
      } catch (error) {
        console.error("Error checking existing conversations:", error);
      }
    },
    [accountId, conversations, fetchMessages, isActive]
  );

  // Initialize data when becoming active
  useEffect(() => {
    if (isActive && accountId) {
      fetchConversations();
      fetchAllProfiles();
    }
  }, [isActive, accountId, fetchConversations, fetchAllProfiles]);

  // Reset state when becoming inactive
  useEffect(() => {
    if (!isActive) {
      setActiveConversation(undefined);
      setConversations([]);
      setMessages([]);
      setAllProfiles([]);
      setNewMessage(undefined);
    }
  }, [isActive]);

  return (
    <MessageContext.Provider
      value={{
        activeConversation,
        conversations,
        messages,
        newMessage,
        allProfiles,
        handleConversationClick,
        handleSendMessage,
        initializeConversation,
        checkExistingConversations,
        fetchConversations,
        fetchAllProfiles,
        isActive, // Expose the active state
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};
