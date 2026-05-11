import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PackageSearch,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import myLogo from "../../assets/pscwhitelogo.png";

const quickReplies = ["Track my order", "Return policy", "Cancel order"];

const initialMessages = [
  {
    role: "assistant",
    text: "Hi! I am your Support Assistant. Ask me about orders, returns, delivery, payments, or products.",
  },
];

function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [supportFlow, setSupportFlow] = useState({
    mode: null,
    orderId: "",
  });
  const messagesEndRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, isOpen]);

  async function sendMessage(messageText) {
    const cleanMessage = messageText.trim();
    if (!cleanMessage || isLoading) return;

    setMessages((current) => [...current, { role: "user", text: cleanMessage }]);
    setInput("");

    if (supportFlow.mode && !supportFlow.orderId) {
      setSupportFlow((current) => ({ ...current, orderId: cleanMessage }));
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `Thanks. Please tell me the reason for this ${supportFlow.mode} request.`,
        },
      ]);
      return;
    }

    if (supportFlow.mode && supportFlow.orderId) {
      setIsLoading(true);

      try {
        const response = await axios.post(
          "http://localhost:5000/api/support/create-ticket",
          {
            orderId: supportFlow.orderId,
            type: supportFlow.mode,
            message: cleanMessage,
          },
          { withCredentials: true }
        );

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text:
              response.data?.message ||
              `Your ${supportFlow.mode} request has been created.`,
          },
        ]);
        setSupportFlow({ mode: null, orderId: "" });
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text:
              error.response?.data?.message ||
              "Please contact support team",
          },
        ]);
      } finally {
        setIsLoading(false);
      }

      return;
    }

    if (/cancel order/i.test(cleanMessage)) {
      setSupportFlow({ mode: "cancel", orderId: "" });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I can help with that. Please share your order ID.",
        },
      ]);
      return;
    }

    if (/return order|return policy/i.test(cleanMessage)) {
      if (/return policy/i.test(cleanMessage)) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: "Returns are allowed within 4 days after delivery for delivered orders. If you want to create a return request, send Return Order.",
          },
        ]);
        return;
      }

      setSupportFlow({ mode: "return", orderId: "" });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Sure. Please share your order ID so I can create the return request.",
        },
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/chat", {
        message: cleanMessage,
        userId: user?.id,
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            response.data?.data ||
            response.data?.message ||
            "Please contact support team",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            error.response?.data?.message ||
            "Please contact support team",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen ? (
        <section className="mb-4 flex h-[560px] w-[calc(100vw-40px)] max-w-[390px] flex-col overflow-hidden rounded-lg border bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <header className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <img src={myLogo} alt="Support logo" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Support Assistant</h2>
                <p className="flex items-center gap-1 text-xs text-slate-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-300" />
                  Online support
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setMessages(initialMessages);
                  setSupportFlow({ mode: null, orderId: "" });
                }}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reset chat</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close chat</span>
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[86%] gap-2 ${
                        isUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isUser
                            ? "bg-amber-100 text-amber-700"
                            : "bg-white text-slate-700 shadow-sm"
                        }`}
                      >
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? "rounded-tr-sm bg-slate-950 text-white"
                            : "rounded-tl-sm border bg-white text-slate-800"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    Bot typing...
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t bg-white p-3">
            {supportFlow.mode ? (
              <div className="mb-3 flex items-center gap-2 border-2 border-black bg-orange-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-800">
                {supportFlow.orderId ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <PackageSearch className="h-4 w-4 text-orange-600" />
                )}
                {supportFlow.orderId
                  ? `Order ${supportFlow.orderId} captured`
                  : `Creating ${supportFlow.mode} request`}
              </div>
            ) : null}
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {quickReplies.map((reply) => (
                <Button
                  key={reply}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full text-xs"
                  disabled={isLoading}
                  onClick={() => sendMessage(reply)}
                >
                  {reply}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your question..."
                disabled={isLoading}
                maxLength={1000}
                className="bg-slate-100"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="shrink-0 bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </section>
      ) : null}

      <Button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="h-14 w-14 rounded-full bg-slate-950 text-white shadow-2xl transition-transform hover:scale-105 hover:bg-slate-800"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        <span className="sr-only">Open support chat</span>
      </Button>
    </div>
  );
}

export default ChatAssistant;
