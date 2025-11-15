import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/ChatMessage";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send POST request to n8n webhook with JSON body
      const response = await fetch("https://your-n8n-webhook-url.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from webhook");
      }

      const data = await response.json();
      
      // Assuming the webhook returns an object with an 'answer' field
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer || data.response || "I received your message!",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      
      // Add error message to chat
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!showChat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary p-4">
        <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
              Welcome to Our Bakery
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Ask me about our fresh bread, opening hours, or get personalized recommendations
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={() => setShowChat(true)}
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-medium shadow-warm hover:scale-105 transition-all duration-300"
            >
              Start Chat
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
            <div className="p-6 bg-card rounded-2xl shadow-soft border border-border hover:shadow-warm transition-all duration-300">
              <h3 className="font-semibold text-foreground mb-2">Fresh Daily</h3>
              <p className="text-sm text-muted-foreground">
                All our bread is baked fresh every morning
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl shadow-soft border border-border hover:shadow-warm transition-all duration-300">
              <h3 className="font-semibold text-foreground mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Get instant answers about availability and recommendations
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl shadow-soft border border-border hover:shadow-warm transition-all duration-300">
              <h3 className="font-semibold text-foreground mb-2">Quick Service</h3>
              <p className="text-sm text-muted-foreground">
                Fast responses to help you plan your visit
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 shadow-soft">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Bakery Assistant</h1>
            <p className="text-sm text-muted-foreground">Here to help with your questions</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-1">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground text-lg">
                Ask me anything about our bakery!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try: "Is a baguette available? When do you close?"
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <ChatMessage key={index} role={message.role} content={message.content} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-card text-card-foreground rounded-2xl rounded-bl-sm px-5 py-3 shadow-sm border border-border">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border px-4 py-4 shadow-soft">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about bread availability, hours, or get recommendations..."
            disabled={isLoading}
            className="flex-1 rounded-2xl bg-background border-border focus-visible:ring-primary text-base py-6 px-5 resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="rounded-2xl px-6 py-6 shadow-warm hover:scale-105 transition-all duration-300"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3 max-w-4xl mx-auto">
          Powered by AI • Responses may vary
        </p>
      </div>
    </div>
  );
};

export default Index;
