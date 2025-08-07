import { useContext, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { CodeSnippet } from "../shared/CodeSnippet";
import { userWalletContext } from "@/context/userWalletContext";
import {
  createSmartQA,
  fetchQuestions,
  fetchResources,
} from "@/services/llmClient";
import { Link } from "react-router-dom";

type ReferenceType =
  | "QA"
  | "Resource"
  | "Documentation"
  | "Article"
  | "Research";

type Reference = {
  title: string;
  author: string;
  category: ReferenceType;
  relevance: number;
  url: string;
};

export function EnhancedAIChat() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: "1",
      content:
        "Hi there! I'm the DevVault AI assistant. How can I help you with your coding questions or project ideas today?",
      role: "assistant",
      timestamp: new Date(),
      formattedContent: (
        <p>
          Hi there! I'm the DevVault AI assistant. How can I help you with your
          coding questions or project ideas today?
        </p>
      ),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signer, accountId, userProfile } = useContext(userWalletContext);

  const askQuestion = async () => {
    if (!inputValue.trim()) return;
    const smartQA = createSmartQA();
    const questions = await fetchQuestions();
    const resources = await fetchResources();

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: inputValue,
        role: "user",
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
    setIsLoading(true);

    setTimeout(async () => {
      const result = await smartQA.getAnswer(
        inputValue,
        questions,
        resources, // Your wallet instance
        signer, // Pass the signer instance
        accountId, // User's account ID
        messages
      );

      const formattedContent = processContent(result.answer);
      const aiResponse = {
        ...result,
        answer: formattedContent,
        content: result.answer,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  // Process content to render markdown and code blocks
  const processContent = (content: string): JSX.Element => {
    // Split by code blocks
    const parts = content.split(/```([\w]*)\n([\s\S]*?)```/g);
    const elements: JSX.Element[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Text content before, between, or after code blocks
        if (parts[i].trim()) {
          const paragraphs = parts[i].split("\n\n");
          paragraphs.forEach((paragraph, pIndex) => {
            if (paragraph.startsWith("# ")) {
              elements.push(
                <h1
                  key={`p-${i}-${pIndex}`}
                  className="text-2xl font-bold mt-4 mb-2"
                >
                  {paragraph.substring(2)}
                </h1>
              );
            } else if (paragraph.startsWith("## ")) {
              elements.push(
                <h2
                  key={`p-${i}-${pIndex}`}
                  className="text-xl font-bold mt-3 mb-2"
                >
                  {paragraph.substring(3)}
                </h2>
              );
            } else if (paragraph.startsWith("### ")) {
              elements.push(
                <h3
                  key={`p-${i}-${pIndex}`}
                  className="text-lg font-bold mt-2 mb-1"
                >
                  {paragraph.substring(4)}
                </h3>
              );
            } else if (paragraph.startsWith("- ")) {
              const listItems = paragraph
                .split("\n- ")
                .map((item) => item.replace("- ", ""));
              elements.push(
                <ul
                  key={`ul-${i}-${pIndex}`}
                  className="list-disc list-inside my-2 ml-4"
                >
                  {listItems.map((item, liIndex) => (
                    <li key={`li-${i}-${pIndex}-${liIndex}`}>{item}</li>
                  ))}
                </ul>
              );
            } else if (paragraph.startsWith("1. ")) {
              const listItems = paragraph
                .split("\n")
                .filter((line) => /^\d+\.\s/.test(line))
                .map((item) => item.replace(/^\d+\.\s/, ""));
              elements.push(
                <ol
                  key={`ol-${i}-${pIndex}`}
                  className="list-decimal list-inside my-2 ml-4"
                >
                  {listItems.map((item, liIndex) => (
                    <li key={`li-${i}-${pIndex}-${liIndex}`}>{item}</li>
                  ))}
                </ol>
              );
            } else if (paragraph.trim()) {
              elements.push(
                <p key={`p-${i}-${pIndex}`} className="my-2">
                  {paragraph.split("\n").map((line, lineIndex) => {
                    // Handle bold text
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    const boldParts = line.split(boldRegex);

                    return (
                      <span key={`line-${i}-${pIndex}-${lineIndex}`}>
                        {boldParts.map((part, partIndex) => {
                          // Every odd index is within ** **
                          return partIndex % 2 === 1 ? (
                            <strong key={`bold-${partIndex}`}>{part}</strong>
                          ) : (
                            part
                          );
                        })}
                        {lineIndex < paragraph.split("\n").length - 1 && <br />}
                      </span>
                    );
                  })}
                </p>
              );
            }
          });
        }
      } else if (i % 3 === 1) {
        // Language identifier (if any)
        // Do nothing here, we'll use it in the next iteration
      } else if (i % 3 === 2) {
        // Code content
        const language = parts[i - 1] || "plaintext";
        elements.push(
          <div key={`code-${i}`} className="my-4">
            <CodeSnippet
              code={parts[i]}
              language={language}
              showLineNumbers={true}
              maxVisibleLines={10}
            />
          </div>
        );
      }
    }

    return <div className="space-y-1">{elements}</div>;
  };

  // Format confidence score color based on percentage
  const getConfidenceColor = (score: number): string => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-lime-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="mr-2">AI Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message?.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[85%] ${
                    message?.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar
                    className={message?.role === "user" ? "ml-2" : "mr-2"}
                  >
                    {message?.role === "assistant" ? (
                      <>
                        <AvatarImage src="/images/AIAvatar.jpg" />
                        <AvatarFallback>AI</AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src={userProfile?.profile_image_url} />
                        <AvatarFallback>U</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div
                    className={`p-4 rounded-lg w-full ${
                      message?.role === "assistant"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message?.answer || <p>{message?.content}</p>}
                    </div>

                    {message?.role === "assistant" && message?.confidence && (
                      <div className="mt-4 pt-3 border-t border-border flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">
                              AI Confidence Level
                            </span>
                            <span
                              className={`text-xs font-bold ${getConfidenceColor(
                                message?.confidence
                              )}`}
                            >
                              {message?.confidence}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                message?.confidence >= 90
                                  ? "bg-green-500"
                                  : message?.confidence >= 80
                                  ? "bg-lime-500"
                                  : message?.confidence >= 70
                                  ? "bg-yellow-500"
                                  : message?.confidence >= 50
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${message?.confidence}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                            <span>Low confidence</span>
                            <span>High confidence</span>
                          </div>
                        </div>

                        {message?.references &&
                          message?.references.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="bg-blue-500/20 dark:bg-blue-400/20 p-1 rounded-full">
                                  <ExternalLink className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                                </div>
                                <h4 className="text-xs font-semibold text-blue-500 dark:text-blue-400">
                                  Sources & References
                                </h4>
                              </div>

                              <div className="border-l-2 border-blue-500/30 dark:border-blue-400/30 pl-3 ml-1.5">
                                <div className="grid gap-2">
                                  {message?.references.map((ref, index) => (
                                    <div
                                      key={index}
                                      className="bg-muted/70 hover:bg-muted/90 border border-border rounded-md p-2.5 text-xs shadow-sm transition-all duration-200"
                                    >
                                      <div className="flex justify-between items-start mb-1.5">
                                        <div className="font-medium text-sm">
                                          {ref.title}
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] h-5 bg-secondary/50"
                                        >
                                          {ref.type}
                                        </Badge>
                                      </div>
                                      <div className="text-muted-foreground mb-2">
                                        by {ref.author?.full_name}
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium">
                                            Relevance:
                                          </span>
                                          <div className="w-32 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full ${
                                                ref.relevance >= 90
                                                  ? "bg-green-500"
                                                  : ref.relevance >= 75
                                                  ? "bg-lime-500"
                                                  : ref.relevance >= 60
                                                  ? "bg-yellow-500"
                                                  : ref.relevance >= 40
                                                  ? "bg-orange-500"
                                                  : "bg-red-500"
                                              }`}
                                              style={{
                                                width: `${ref.relevance}%`,
                                              }}
                                            ></div>
                                          </div>
                                          <span
                                            className={`text-xs font-semibold ${
                                              ref.relevance >= 90
                                                ? "text-green-500"
                                                : ref.relevance >= 75
                                                ? "text-lime-500"
                                                : ref.relevance >= 60
                                                ? "text-yellow-500"
                                                : ref.relevance >= 40
                                                ? "text-orange-500"
                                                : "text-red-500"
                                            }`}
                                          >
                                            {ref.relevance}%
                                          </span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          className="h-7 px-3 text-xs w-full sm:w-auto"
                                          asChild
                                        >
                                          <Link
                                            to={ref.url}
                                            className="flex items-center justify-center gap-1.5"
                                          >
                                            View Source{" "}
                                            <ExternalLink className="h-3 w-3" />
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {message?.references.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs mt-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-500/10 dark:hover:bg-blue-400/10 w-full justify-center"
                                  onClick={() => {
                                    // This would be connected to a state that toggles showing all references
                                    // For now, it's just a visual element
                                  }}
                                >
                                  Show{" "}
                                  {message?.references.length > 3
                                    ? "all"
                                    : "more"}{" "}
                                  references
                                </Button>
                              )}
                            </div>
                          )}
                      </div>
                    )}

                    <div
                      className={`text-xs mt-2 ${
                        message?.role === "assistant"
                          ? "text-secondary-foreground/70"
                          : "text-primary-foreground/70"
                      }`}
                    >
                      {message?.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex">
                  <Avatar className="mr-2">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="p-4 rounded-lg bg-secondary text-secondary-foreground">
                    <div className="flex space-x-2">
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-end space-x-2">
          <Textarea
            className="flex-1 min-h-[80px] resize-none"
            placeholder="Ask about coding, development, or DevVault... (Try questions about JavaScript, React, or DevVault)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                askQuestion();
              }
            }}
          />
          <Button
            size="icon"
            onClick={askQuestion}
            disabled={isLoading || !inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
