import { MirrorNodeClient } from "@/services/mirrorNodeClient";
import { useCallback, useContext, useEffect, useState } from "react";
import { contentData } from "./ContentData";
import { WalletConnectClient } from "@/client/walletConnectClient";
import { userWalletContext } from "./userWalletContext";
import { TransactionId } from "@hashgraph/sdk";

const ContentDataContext = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contents, setContents] = useState([]);
  const [tokenBalance, setTokenBalance] = useState("0");
  const { accountId } = useContext(userWalletContext);

  const COMMENT_TOPIC_ID = import.meta.env.VITE_COMMENT_TOPIC_ID;
  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    const { getTopicMessages } = await MirrorNodeClient();
    const { messages } = await getTopicMessages();
    const { messages: comments } = await getTopicMessages(COMMENT_TOPIC_ID);
    const messagesWithComments = messages.map((msg) => {
      const commentData = comments.filter(
        (comment) => comment.data.contentId === msg.data.id
      );
      return {
        ...msg,
        comments: commentData.length > 0 ? commentData : [],
      };
    });

    setContents(messagesWithComments);
    setIsLoading(false);
  }, []);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    const { getTopicMessages } = await MirrorNodeClient();
    const { messages } = await getTopicMessages();
    const { messages: comments } = await getTopicMessages(COMMENT_TOPIC_ID);
    const questions = messages.filter((msg) => msg.data.category === "QA");
    const questionsWithComments = questions.map((question) => {
      const questionComments = comments.filter(
        (comment) => comment.data.contentId === question.data.id
      );
      return {
        ...question,
        comments: questionComments,
      };
    });
    setQuestions(questionsWithComments);
    setIsLoading(false);
  }, []);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    const { getTopicMessages } = await MirrorNodeClient();
    const { messages } = await getTopicMessages();
    const { messages: comments } = await getTopicMessages(COMMENT_TOPIC_ID);
    const resources = messages.filter(
      (msg) => msg.data.category === "RESOURCE"
    );
    const resourcesWithComments = resources.map((resource) => {
      const resourceComments = comments.filter(
        (comment) => comment.data.contentId === resource.data.id
      );
      return {
        ...resource,
        comments: resourceComments,
      };
    });

    setResources(resourcesWithComments);
    setIsLoading(false);
  }, []);

  const fetchTokenBalance = useCallback(async () => {
    const { getTokenBalance } = await MirrorNodeClient();
    setTokenBalance(await getTokenBalance(accountId));
  }, [accountId]);

  useEffect(() => {
    fetchContents();
    fetchQuestions();
    fetchResources();
    fetchTokenBalance();
  }, [fetchQuestions, fetchResources, fetchContents, fetchTokenBalance]);

  const uploadContent = async (content, topicId) => {
    const { createTopicMessage } = await WalletConnectClient();
    const status = await createTopicMessage(content, topicId);
    if (status === "SUCCESS") {
      console.log("Content uploaded successfully:", status);

    


      setTimeout(() => {
        fetchContents();
        fetchQuestions();
        fetchResources();
      }, 1000);
    }
  };

  const sendTip = async (userAddress, amount): Promise<any> => {
    const { transferFungibleToken } = await WalletConnectClient();
    const status = await transferFungibleToken(userAddress, amount);
    if (status === "SUCCESS") {
      console.log(`Tip of ${amount} tokens sent to ${userAddress}`);

      setTimeout(() => {
        fetchTokenBalance();
      }, 1000);
    }

    return status;
  };

  return (
    <contentData.Provider
      value={{
        contents,
        questions,
        resources,
        isLoading,
        uploadContent,
        sendTip,
        tokenBalance,
      }}
    >
      {children}
    </contentData.Provider>
  );
};

export default ContentDataContext;
