import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi there! I'm the DevVault AI assistant. How can I help you with your coding questions or project ideas today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Simulate AI response (in real app, this would call an API)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getSimulatedResponse(inputValue),
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  // Simulate responses - in a real app this would be replaced with an actual LLM API call
  const getSimulatedResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("javascript") || lowerQuery.includes("js")) {
      return "JavaScript is a high-level programming language that follows the ECMAScript standard. It's commonly used for web development alongside HTML and CSS. If you have a specific JavaScript question, feel free to provide more details!";
    } else if (lowerQuery.includes("react")) {
      return "React is a JavaScript library for building user interfaces, particularly single-page applications. It's maintained by Meta and a community of developers. React allows you to compose complex UIs from small, isolated pieces of code called 'components'.";
    } else if (lowerQuery.includes("devvault") || lowerQuery.includes("dvt")) {
      return "DevVault is a next-generation developer platform designed to reward knowledge sharing and foster collaboration among developers. It combines Q&A functionality with content sharing and includes a token-based tipping system to incentivize quality contributions.";
    } else {
      return "That's an interesting question! In a real implementation, I would connect to an LLM API to provide detailed answers. For now, could you try asking something about JavaScript, React, or DevVault?";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="mr-2">AI Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 border rounded-md">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className={message.role === "user" ? "ml-2" : "mr-2"}>
                  {message.role === "assistant" ? (
                    <>
                      <AvatarImage src="/images/AIAvatar.jpg" />
                      <AvatarFallback>AI</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src="/assets/user-avatar.png" />
                      <AvatarFallback>U</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "assistant"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p>{message.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === "assistant"
                        ? "text-secondary-foreground/70"
                        : "text-primary-foreground/70"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
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
                <div className="p-3 rounded-lg bg-secondary text-secondary-foreground">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="flex items-end space-x-2">
          <Textarea
            className="flex-1 min-h-[80px] resize-none"
            placeholder="Ask the AI assistant anything about coding, development, or DevVault..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}