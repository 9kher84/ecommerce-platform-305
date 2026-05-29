import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Send, ArrowRight, Loader2, MessageCircle } from "lucide-react";
import apiService from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const ChatPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiService.getChatHistory(requestId);
        setMessages(response.data.messages || []);
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Socket.IO Setup
    const socketInstance = io(
      process.env.REACT_APP_API_URL || "http://localhost:5000",
      {
        auth: { userId: user.id },
        query: { userId: user.id },
      },
    );

    socketInstance.emit("join_request", { requestId });

    socketInstance.on("new_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketInstance.on("joined_request", (data) => {
      console.log("Joined room:", data.requestId);
      if (data.messages) setMessages(data.messages);
    });

    socketInstance.on("error", (err) => {
      alert(err.message);
      navigate(-1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [requestId, user.id, navigate]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit("send_message", {
      requestId,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center border-b">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2 rounded-full mr-3">
            <MessageCircle className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">محادثة الصفقة</h2>
            <p className="text-xs text-gray-500">طلب رقم #{requestId}</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center mt-10 text-gray-500">
            <p>ابدأ المحادثة الآن..</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                  msg.senderId === user.id
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-gray-800 rounded-tl-none border border-gray-200"
                }`}
              >
                <p className="text-sm font-semibold mb-1 opacity-70">
                  {msg.sender?.name}
                </p>
                <p className="leading-relaxed">{msg.content}</p>
                <p className="text-[10px] mt-1 text-right opacity-60">
                  {new Date(msg.sentAt).toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white p-4 border-t flex items-center space-x-2 rtl:space-x-reverse"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-md"
        >
          <Send className="w-5 h-5 transform rotate-180" />
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
