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
      const response = await fetch(
        "https://primary-production-b57a.up.railway.app/webhook/chatbot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: userMessage.content,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from webhook");
      }

      const data = await response.json();

      // Handle various possible response formats from n8n
      const assistantMessage: Message = {
        role: "assistant",
        content:
          data.answer ||
          data.response ||
          data.output.answer ||
          data.output ||
          "Failed to find proper answer in Object",
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
              안녕하세요. <br />
              빵빵 베이커리 입니다.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              맛있는 빵의 재고 정보와 가게 정보, 저희의 추천 상품을
              안내드립니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={() => setShowChat(true)}
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-medium shadow-warm hover:scale-105 transition-all duration-300"
            >
              채팅 시작
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
            <div className="p-6 bg-card rounded-2xl shadow-soft border border-border hover:shadow-warm transition-all duration-300">
              <h3 className="font-semibold text-foreground mb-2">
                매일 굽는 신선한 빵
              </h3>
              <p className="text-sm text-muted-foreground">
                매일 아침에 구워 <br /> 더 맛있는 빵
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl shadow-soft border border-border hover:shadow-warm transition-all duration-300">
              <h3 className="font-semibold text-foreground mb-2">AI 챗봇</h3>
              <p className="text-sm text-muted-foreground">
                방문 전에 재고를 확인하세요
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl shadow-soft border border-border hover:shadow-warm transition-all duration-300">
              <h3 className="font-semibold text-foreground mb-2">
                실시간 정보
              </h3>
              <p className="text-sm text-muted-foreground">
                실시간 가게 정보가 내손안에
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              빵집 챗봇
            </h1>
            <p className="text-sm text-muted-foreground">
              질문에 바로 응답해드립니다.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            메인으로
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-1">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground text-lg">
                저희 빵집에 대해 아무거나 질문해주세요!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                "딸기 케이크 있나요? 몇시에 영업 마감하나요?" 라고 쳐보세요!
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
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
            placeholder="빵의 재고, 영업 시간, 혹은 메뉴 추천에 관한 질문에 답해드립니다."
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
          AI 응답입니다. • 동일한 질문에 동일한 답변을 주지 않을 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default Index;
