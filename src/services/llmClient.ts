import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DynamicTool } from "@langchain/core/tools";
import { MirrorNodeClient } from "./mirrorNodeClient";

const PLATFORM_TOKEN_ID = import.meta.env.VITE_TOKEN_ID;
const COMMENT_TOPIC_ID = import.meta.env.VITE_COMMENT_TOPIC_ID;

// Custom Hedera tools for browser/wallet environment
const createBrowserHederaTools = (walletSigner, accountId) => {
  const tools = [];

  // Get Account Balance Tool
  tools.push(
    new DynamicTool({
      name: "get_account_balance",
      description: "Get HBAR balance for the connected account",
      func: async () => {
        try {
          if (!walletSigner || !accountId) {
            return "No wallet connected. Please connect your wallet first.";
          }

          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
          );
          const accountData = await response.json();
          const hbarBalance = (accountData.balance.balance / 100000000).toFixed(
            4
          );

          return `Your account ${accountId} has a balance of ${hbarBalance} HBAR.`;
        } catch (error) {
          return `Error fetching balance: ${error.message}`;
        }
      },
    })
  );

  // Get Token Balance Tool
  tools.push(
    new DynamicTool({
      name: "get_token_balance",
      description:
        "Get token balance for a specific token ID. Input should be a JSON string with tokenId property.",
      func: async (input) => {
        try {
          const { tokenId } = JSON.parse(input);

          if (!accountId) {
            return "No wallet connected. Please connect your wallet first.";
          }

          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`
          );
          const tokenData = await response.json();

          if (tokenData.tokens && tokenData.tokens.length > 0) {
            const balance = tokenData.tokens[0].balance;
            return `Your balance for token ${tokenId} is ${balance} tokens.`;
          } else {
            return `You don't have any balance for token ${tokenId}.`;
          }
        } catch (error) {
          return `Error fetching token balance: ${error.message}`;
        }
      },
    })
  );

  // Get Account Info Tool
  tools.push(
    new DynamicTool({
      name: "get_account_info",
      description: "Get detailed account information for the connected wallet",
      func: async () => {
        try {
          if (!accountId) {
            return "No wallet connected. Please connect your wallet first.";
          }

          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
          );
          const accountData = await response.json();

          return `Account Information:
- Account ID: ${accountData.account}
- Balance: ${(accountData.balance.balance / 100000000).toFixed(4)} HBAR
- Auto Renew Period: ${accountData.auto_renew_period} seconds
- Key Type: ${accountData.key ? accountData.key.key_type : "Not available"}
- Created: ${new Date(accountData.created_timestamp * 1000).toLocaleString()}`;
        } catch (error) {
          return `Error fetching account info: ${error.message}`;
        }
      },
    })
  );

  // Submit Topic Message Tool
  tools.push(
    new DynamicTool({
      name: "submit_topic_message",
      description:
        "Submit a message to a Hedera Consensus Service topic. Input should be JSON with topicId and message properties.",
      func: async (input) => {
        try {
          const { topicId, message } = JSON.parse(input);

          if (!walletSigner) {
            return "No wallet connected. Please connect your wallet to submit messages.";
          }

          return `Message submission to topic ${topicId} would require wallet signature. Message: "${message}"`;
        } catch (error) {
          return `Error submitting message: ${error.message}`;
        }
      },
    })
  );

  // Get Topic Messages Tool
  tools.push(
    new DynamicTool({
      name: "get_topic_messages",
      description:
        "Get messages from a Hedera Consensus Service topic. Input should be JSON with topicId and optional limit properties.",
      func: async (input) => {
        try {
          const { topicId, limit = 10 } = JSON.parse(input);

          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=${limit}`
          );
          const topicData = await response.json();

          if (topicData.messages && topicData.messages.length > 0) {
            const messages = topicData.messages
              .map((msg, index) => {
                const decodedMessage = atob(msg.message);
                return `Message ${index + 1}: ${decodedMessage} (Sequence: ${
                  msg.sequence_number
                })`;
              })
              .join("\n");

            return `Recent messages from topic ${topicId}:\n${messages}`;
          } else {
            return `No messages found for topic ${topicId}.`;
          }
        } catch (error) {
          return `Error fetching topic messages: ${error.message}`;
        }
      },
    })
  );

  // Get Transaction Info Tool
  tools.push(
    new DynamicTool({
      name: "get_transaction_info",
      description:
        "Get information about a Hedera transaction. Input should be JSON with transactionId property.",
      func: async (input) => {
        try {
          const { transactionId } = JSON.parse(input);

          const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/transactions/${transactionId}`
          );
          const txData = await response.json();

          if (txData.transactions && txData.transactions.length > 0) {
            const tx = txData.transactions[0];
            return `Transaction Information:
- Transaction ID: ${tx.transaction_id}
- Type: ${tx.name}
- Result: ${tx.result}
- Consensus Timestamp: ${new Date(
              tx.consensus_timestamp * 1000
            ).toLocaleString()}
- Charged Fee: ${tx.charged_tx_fee / 100000000} HBAR`;
          } else {
            return `Transaction ${transactionId} not found.`;
          }
        } catch (error) {
          return `Error fetching transaction info: ${error.message}`;
        }
      },
    })
  );

  return tools;
};

// Enhanced QA Assistant with Browser-Compatible Hedera Integration
const createHederaQAAssistant = () => {
  const state = {
    llm: null,
    mirrorClient: null,
    agentExecutor: null,
    walletSigner: null,
    accountId: null,
    isReady: false,
  };

  // Initialize the assistant
  const init = async (walletSigner = null, accountId = null) => {
    try {
      // Initialize Gemini LLM
      state.llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      });

      // Store wallet info
      state.walletSigner = walletSigner;
      state.accountId = accountId;

      // Initialize Mirror Node client for platform data
      state.mirrorClient = await MirrorNodeClient();

      // Create browser-compatible Hedera tools
      const hederaTools = createBrowserHederaTools(walletSigner, accountId);

      // Create enhanced prompt template for Q&A platform
      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `You are an expert technical assistant for a developer collaboration platform built on Hedera.
        
You have access to:
1. Hedera network information through browser-compatible tools (balances, account info, topic messages, etc.)
2. Platform-specific Q&A discussions and developer resources
3. User account information when wallet is connected

When answering questions:
- Use Hedera tools for blockchain-related queries (balances, transactions, topics, etc.)
- Reference platform content when relevant to technical questions
- Provide accurate, helpful responses with proper citations
- If wallet is not connected and blockchain operation is requested, suggest connecting wallet
- Suggest posting new questions when no relevant content exists

Always be precise about what information you're using and from which source.`,
        ],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
      ]);

      // Create the agent
      const agent = createToolCallingAgent({
        llm: state.llm,
        tools: hederaTools,
        prompt,
      });

      // Create agent executor
      state.agentExecutor = new AgentExecutor({
        agent,
        tools: hederaTools,
        verbose: import.meta.env.DEV, // Verbose in development only
      });

      state.isReady = true;
      console.log("Enhanced Hedera QA Assistant initialized");
      console.log(
        `Available tools: ${hederaTools.map((t) => t.name).join(", ")}`
      );
      console.log(`Wallet connected: ${!!walletSigner}`);
      console.log(`Account ID: ${accountId || "Not connected"}`);
    } catch (error) {
      console.error("Failed to initialize Hedera QA assistant:", error);
      throw error;
    }
  };

  // Enhanced matching for developer content (keeping existing logic)
  const findBestMatches = (userQuestion, data, type) => {
    const userWords = userQuestion
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .filter(
        (w) =>
          ![
            "what",
            "how",
            "why",
            "when",
            "where",
            "the",
            "and",
            "for",
            "with",
            "can",
            "will",
            "is",
            "are",
          ].includes(w)
      );

    if (userWords.length === 0) return [];

    const techKeywords = [
      "javascript",
      "python",
      "java",
      "react",
      "node",
      "api",
      "database",
      "sql",
      "html",
      "css",
      "function",
      "class",
      "method",
      "variable",
      "array",
      "object",
      "hedera",
      "blockchain",
      "smart",
      "contract",
      "token",
      "nft",
      "hts",
      "hcs",
      "error",
      "bug",
      "debug",
      "performance",
      "optimization",
      "security",
      "test",
      "topic",
      "consensus",
      "hashgraph",
      "sdk",
      "mirror",
      "node",
      "wallet",
      "signer",
    ];

    const matches = data
      .map((item) => {
        const title = item.data?.title || "";
        const content = item.data?.content || "";
        const tags = item.data?.tags || [];
        const comments = item.comments || [];

        const searchText = `${title} ${content} ${tags.join(" ")} ${comments
          .map((c) => c.data?.content || "")
          .join(" ")}`.toLowerCase();

        let score = 0;
        let exactMatches = 0;
        let techTermMatches = 0;

        userWords.forEach((word) => {
          if (searchText.includes(word)) {
            let wordScore = word.length > 4 ? 3 : 2;

            if (techKeywords.includes(word)) {
              wordScore += 5;
              techTermMatches++;
            }

            score += wordScore;
            exactMatches++;
          }

          if (title.toLowerCase().includes(word)) {
            score += 8;
          }

          if (tags.some((tag) => tag.toLowerCase().includes(word))) {
            score += 6;
          }
        });

        const totalVotes = comments.reduce(
          (sum, c) => sum + (c.data?.votes || 0),
          0
        );
        if (totalVotes > 0) score += Math.min(totalVotes, 10);

        const overlapPercentage = exactMatches / userWords.length;
        const normalizedScore = score / (userWords.length * 5);

        return {
          item,
          score: normalizedScore,
          exactMatches,
          techTermMatches,
          overlapPercentage,
          type,
          title,
          content,
          comments,
          totalVotes,
          tags,
        };
      })
      .filter((match) => {
        return (
          match.exactMatches >= Math.min(2, userWords.length) &&
          match.overlapPercentage >= 0.3 &&
          match.score >= 0.4
        );
      })
      .sort((a, b) => {
        if (a.techTermMatches !== b.techTermMatches) {
          return b.techTermMatches - a.techTermMatches;
        }
        if (Math.abs(a.overlapPercentage - b.overlapPercentage) > 0.1) {
          return b.overlapPercentage - a.overlapPercentage;
        }
        return b.score - a.score;
      })
      .slice(0, 3);

    return matches;
  };

  // Build context for the agent
  const buildPlatformContext = (qaMatches, resourceMatches) => {
    let context = "";
    let hasRelevantContent = false;

    if (qaMatches.length > 0) {
      hasRelevantContent = true;
      context += "\n=== RELEVANT PLATFORM Q&A DISCUSSIONS ===\n";
      qaMatches.forEach((match, index) => {
        const item = match.item;
        context += `\nQ&A_${index + 1} (${(match.score * 100).toFixed(
          1
        )}% relevance):\n`;
        context += `Title: ${match.title}\n`;
        context += `Question: ${match.content}\n`;
        context += `Tags: ${match.tags.join(", ")}\n`;
        context += `ID: ${item.data?.id}\n`;

        if (match.comments.length > 0) {
          context += `Answers (${match.comments.length} total):\n`;
          match.comments
            .sort((a, b) => (b.data?.votes || 0) - (a.data?.votes || 0))
            .slice(0, 2)
            .forEach((comment, idx) => {
              context += `  Answer ${idx + 1} (${
                comment.data?.votes || 0
              } votes): ${comment.data?.content}\n`;
            });
        }
      });
    }

    if (resourceMatches.length > 0) {
      hasRelevantContent = true;
      context += "\n=== RELEVANT PLATFORM RESOURCES ===\n";
      resourceMatches.forEach((match, index) => {
        const item = match.item;
        context += `\nRESOURCE_${index + 1} (${(match.score * 100).toFixed(
          1
        )}% relevance):\n`;
        context += `Title: ${match.title}\n`;
        context += `Content: ${match.content}\n`;
        context += `Tags: ${match.tags.join(", ")}\n`;
        context += `URL: ${item.data?.url || "Internal resource"}\n`;
      });
    }

    return { context, hasRelevantContent };
  };

  // Update wallet connection
  const updateWallet = async (walletSigner, accountId) => {
    state.walletSigner = walletSigner;
    state.accountId = accountId;

    if (state.isReady && state.agentExecutor) {
      // Recreate tools with new wallet info
      const hederaTools = createBrowserHederaTools(walletSigner, accountId);

      // Update agent executor with new tools
      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `You are an expert technical assistant for a developer collaboration platform built on Hedera.
        
You have access to:
1. Hedera network information through browser-compatible tools (balances, account info, topic messages, etc.)
2. Platform-specific Q&A discussions and developer resources
3. User account information when wallet is connected

When answering questions:
- Use Hedera tools for blockchain-related queries (balances, transactions, topics, etc.)
- Reference platform content when relevant to technical questions
- Provide accurate, helpful responses with proper citations
- If wallet is not connected and blockchain operation is requested, suggest connecting wallet
- Suggest posting new questions when no relevant content exists

Always be precise about what information you're using and from which source.`,
        ],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
      ]);

      const agent = createToolCallingAgent({
        llm: state.llm,
        tools: hederaTools,
        prompt,
      });

      state.agentExecutor = new AgentExecutor({
        agent,
        tools: hederaTools,
        verbose: import.meta.env.DEV,
      });
    }
  };

  // Main question processing function
  const askQuestion = async (
    userQuestion,
    questionsData = [],
    resourcesData = [],
    chatHistory = []
  ) => {
    if (!state.isReady) {
      throw new Error("Assistant not initialized. Call init() first.");
    }

    try {
      // Find relevant platform content
      const qaMatches = findBestMatches(userQuestion, questionsData, "qa");
      const resourceMatches = findBestMatches(
        userQuestion,
        resourcesData,
        "resource"
      );
      const { context, hasRelevantContent } = buildPlatformContext(
        qaMatches,
        resourceMatches
      );

      // Prepare enhanced input with platform context
      let enhancedInput = userQuestion;

      if (hasRelevantContent) {
        enhancedInput = `PLATFORM CONTEXT:
${context}

USER QUESTION: ${userQuestion}

Please answer using the platform context when relevant, and use Hedera tools when blockchain operations are needed. If wallet connection is required for an operation, let the user know.`;
      }

      // Use the agent executor to process the question
      const response = await state.agentExecutor.invoke({
        input: enhancedInput,
        chat_history: chatHistory,
      });

      // Parse and format the response
      const formattedResponse = formatAgentResponse(
        response,
        qaMatches,
        resourceMatches,
        hasRelevantContent
      );

      return formattedResponse;
    } catch (error) {
      console.error("Error processing question:", error);
      return {
        answer:
          "I encountered an error processing your question. Please try again.",
        sources: [],
        confidence: 0,
        type: "error",
        error: error.message,
      };
    }
  };

  // Format the agent response
  const formatAgentResponse = (
    agentResponse,
    qaMatches,
    resourceMatches,
    hasRelevantContent
  ) => {
    const sources = [];

    // Add platform sources if relevant content was used
    if (hasRelevantContent) {
      [...qaMatches, ...resourceMatches]
        .filter((match) => match.score >= 0.5)
        .slice(0, 3)
        .forEach((match) => {
          const item = match.item;
          sources.push({
            type: match.type === "qa" ? "Q&A Discussion" : "Developer Resource",
            title: match.title,
            id: item.data?.id,
            url: `/post/${item.data?.id}`,
            relevance: Math.round(match.score * 100),
            overlap: Math.round(match.overlapPercentage * 100),
            hasDiscussion: match.comments.length > 0,
            commentCount: match.comments.length,
            tags: match.tags,
            author: item.data?.author || item.author || "Unknown",
            verified: true,
          });
        });
    }

    // Determine response type and confidence
    let responseType = "general_knowledge";
    let confidence = 0.75;

    if (hasRelevantContent && sources.length > 0) {
      responseType = "platform_content";
      confidence = 0.9;
    }

    // Check if Hedera tools were used
    if (
      agentResponse.intermediateSteps &&
      agentResponse.intermediateSteps.length > 0
    ) {
      responseType = "hedera_agent_tools";
      confidence = 0.95;
    }

    return {
      answer: agentResponse.output || agentResponse.text || agentResponse,
      sources,
      confidence: Math.round(confidence * 100),
      type: responseType,
      hasReferences: sources.length > 0,
      agentSteps: agentResponse.intermediateSteps || [],
      walletConnected: !!state.walletSigner,
      accountId: state.accountId,
      suggestion:
        !hasRelevantContent && responseType === "general_knowledge"
          ? "No existing platform content found. Consider posting this as a new question to help other developers!"
          : null,
    };
  };

  // Enhanced validation
  const validateQuestion = (question) => {
    if (!question || question.trim().length < 5) {
      return {
        valid: false,
        reason: "Question is too short. Please provide more details.",
      };
    }

    if (question.length > 1000) {
      return {
        valid: false,
        reason:
          "Question is too long (max 1000 characters). Please be more concise.",
      };
    }

    return { valid: true };
  };

  // Get trending questions
  const getTrendingQuestions = (questionsData = [], limit = 5) => {
    return questionsData
      .filter((q) => q.comments && q.comments.length > 0)
      .sort((a, b) => {
        const aActivity =
          a.comments.length +
          a.comments.reduce((sum, c) => sum + (c.data?.votes || 0), 0);
        const bActivity =
          b.comments.length +
          b.comments.reduce((sum, c) => sum + (c.data?.votes || 0), 0);
        return bActivity - aActivity;
      })
      .slice(0, limit)
      .map((q) => ({
        id: q.data?.id,
        title: q.data?.title,
        content: q.data?.content?.substring(0, 120) + "...",
        url: `/qa/${q.data?.id}`,
        answers: q.comments.length,
        votes: q.comments.reduce((sum, c) => sum + (c.data?.votes || 0), 0),
        tags: q.data?.tags || [],
      }));
  };

  return {
    askQuestion,
    validateQuestion,
    getTrendingQuestions,
    init,
    updateWallet,

    // Expose the agent executor for direct access if needed
    get agentExecutor() {
      return state.agentExecutor;
    },

    get isReady() {
      return state.isReady;
    },

    get walletConnected() {
      return !!state.walletSigner;
    },

    get accountId() {
      return state.accountId;
    },
  };
};

// Simplified wrapper maintaining your existing API
const createSmartQA = () => {
  const qa = createHederaQAAssistant();

  const getAnswer = async (
    question,
    questionsData,
    resourcesData,
    walletSigner = null,
    accountId = null,
    chatHistory = []
  ) => {
    try {
      // Initialize if not ready
      if (!qa.isReady) {
        await qa.init(walletSigner, accountId);
      } else if (walletSigner && accountId) {
        // Update wallet if provided
        await qa.updateWallet(walletSigner, accountId);
      }

      const validation = qa.validateQuestion(question);
      if (!validation.valid) {
        return {
          answer: validation.reason,
          references: [],
          confidence: "0%",
          type: "validation_error",
          error: validation.reason,
        };
      }

      const result = await qa.askQuestion(
        question,
        questionsData,
        resourcesData,
        chatHistory
      );

      // Format for frontend compatibility
      return {
        answer: result.answer,
        type: result.type,
        references:
          result.sources?.map((source) => ({
            title: source.title,
            type: source.type,
            url: source.url,
            externalUrl: source.externalUrl,
            relevance: `${source.relevance}`,
            overlap: `${source.overlap}% overlap`,
            hasDiscussion: source.hasDiscussion,
            commentCount: source.commentCount,
            tags: source.tags,
            author: source.author,
            verified: source.verified,
          })) || [],
        confidence: `${result.confidence}`,
        hasReferences: result["hasReferences"],
        suggestion: result["suggestion"],
        agentSteps: result["agentSteps"],
        walletConnected: result["walletConnected"],
        accountId: result["accountId"],
      };
    } catch (error) {
      return {
        answer:
          "I encountered an error processing your question. Please try again.",
        references: [],
        confidence: "0%",
        type: "error",
        error: error.message,
      };
    }
  };

  return { getAnswer, qa };
};

// Keep your existing data fetching functions
const fetchQuestions = async () => {
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

  return questionsWithComments;
};

const fetchResources = async () => {
  const { getTopicMessages } = await MirrorNodeClient();
  const { messages } = await getTopicMessages();
  const { messages: comments } = await getTopicMessages(COMMENT_TOPIC_ID);

  const resources = messages.filter((msg) => msg.data.category === "RESOURCE");
  const resourcesWithComments = resources.map((resource) => {
    const resourceComments = comments.filter(
      (comment) => comment.data.contentId === resource.data.id
    );
    return {
      ...resource,
      comments: resourceComments,
    };
  });

  return resourcesWithComments;
};

export {
  createHederaQAAssistant,
  createSmartQA,
  fetchQuestions,
  fetchResources,
};
