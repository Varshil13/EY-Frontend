import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../../types';
import { buildApiUrl, API_CONFIG } from '../../config/api';
import { supabase } from '../../lib/supabase';

// Helper function to format time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your AI-powered loan assistant. I can help you apply for loans, check eligibility, and answer your questions. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  // Note: Chat message saving removed since chat_messages table doesn't exist

  // Function to save loan recommendations to user_loan_reco table
  const saveLoanRecommendations = async (loans: any[]) => {
    try {
      if (!user?.profile_id || !loans?.length) {
        console.log('❌ No user profile_id or loans, skipping recommendation save');
        return;
      }

      console.log('💾 Saving loan recommendations to database...');
      console.log('👤 Profile ID:', user.profile_id);
      console.log('📋 Loans to save:', loans.length);

      const recommendationsToSave = loans
        .filter(loan => !loan.already_recommended) // Only save new recommendations
        .map((loan, index) => ({
          reco_id: `RECO_${user.profile_id}_${loan.loan_id}_${Date.now()}_${index}`, // Generate unique reco_id
          profile_id: user.profile_id,
          loan_id: loan.loan_id,
          eligibility_score: 85, // Default eligibility score
          recommended_amount: loan.max_amount || 500000, // Use loan max amount or default
          recommended_tenure: loan.tenure || 24, // Use loan tenure or default
          estimated_emi: Math.round((loan.max_amount || 500000) * 0.02), // Simple EMI calculation
          recommendation_reason: 'AI recommended based on user profile',
          created_at: new Date().toISOString()
        }));

      if (recommendationsToSave.length === 0) {
        console.log('ℹ️ No new recommendations to save (all were previously recommended)');
        return;
      }

      console.log('💾 Inserting recommendations:', recommendationsToSave);

      const { data, error } = await supabase
        .from('user_loan_reco')
        .insert(recommendationsToSave)
        .select(); // Add select to return the inserted data

      if (error) {
        console.error('❌ Error saving loan recommendations:', error);
      } else {
        console.log('✅ Loan recommendations saved successfully:', recommendationsToSave.length);
        console.log('📊 Saved data:', data);
      }
    } catch (err) {
      console.error('❌ Exception saving loan recommendations:', err);
    }
  };

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ---------------------------
  // ✅ GEMINI API CALL
  // ---------------------------
  // --- ONLY THIS FUNCTION IS UPDATED ---

async function generateOpenAIResponse(userInput: string) {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", 
        messages: [
          { role: "system", content: "You are an AI loan assistant." },
          { role: "user", content: userInput }
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    console.log("OpenAI Output:", data);

    if (data.error) {
      return "❌ API Error: " + data.error.message;
    }

    return (
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't process that."
    );
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Oops! Something went wrong connecting to OpenAI.";
  }
}

  // ---------------------------
  // SEND MESSAGE HANDLER
  // ---------------------------
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Try loan recommendation backend first (returns structured loan list)
      try {
        console.log('🤖 Sending message to AI backend...');
        const profileId = user?.profile_id || 'U001';
        console.log('👤 Profile ID:', profileId);
        console.log('💬 Message:', input);
        console.log('🌐 API URL:', buildApiUrl(API_CONFIG.ENDPOINTS.CHAT));
        
        const recoRes = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: profileId, message: input }),
        });

        console.log('📡 Backend response status:', recoRes.status, recoRes.ok);

        if (recoRes.ok) {
          const recoData = await recoRes.json();
          console.log('📊 Backend response data:', recoData);
          console.log('💾 Recommendations saved:', recoData.recommendations_saved);
          console.log('📋 Saved count:', recoData.saved_count);
          
          if (recoData.loans && recoData.loans.length > 0) {
            console.log('✅ Found loans in response:', recoData.loans.length);
            // Build textual reply summarizing loans with timing info
            let replyText = recoData.reply || 'Here are the matching loans:';
            replyText += '\n\n';
            
            recoData.loans.forEach((l: any) => {
              replyText += `💰 ${l.loan_name}\n`;
              replyText += `   Interest Rate: ${l.interest}%\n`;
              replyText += `   Amount: ₹${l.min_amount?.toLocaleString('en-IN')} - ₹${l.max_amount?.toLocaleString('en-IN')}\n`;
              replyText += `   Tenure: Up to ${l.tenure} months\n`;
              
              // Add timing information
              if (l.already_recommended && l.original_recommendation_time) {
                const recommendedDate = new Date(l.original_recommendation_time);
                const timeAgo = getTimeAgo(recommendedDate);
                replyText += `   ⏰ Previously recommended ${timeAgo}\n`;
              } else {
                replyText += `   🆕 Just recommended for you\n`;
              }
              replyText += '\n';
            });

            const assistantMessage: any = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: replyText,
              timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            
            // Save loan recommendations to user_loan_reco table (frontend backup)
            await saveLoanRecommendations(recoData.loans);
            
            // Notify recommendations page to refresh
            if (recoData.recommendations_saved) {
              console.log('🔔 AI saved new recommendations, triggering refresh');
              window.dispatchEvent(new CustomEvent('aiRecommendationReceived', { 
                detail: { count: recoData.saved_count } 
              }));
            }
            
            // Always trigger refresh to show timing updates
            console.log('🔄 Triggering refresh for timing updates');
            window.dispatchEvent(new CustomEvent('aiRecommendationReceived', { 
              detail: { count: recoData.loans.length } 
            }));
            
            setLoading(false);
            return; // handled by recommendation backend
          } else {
            console.log('❌ No loans found in backend response');
            console.log('📊 Response data:', recoData);
          }
        } else {
          console.log('❌ Backend response not OK:', recoRes.status);
          const errorText = await recoRes.text();
          console.log('🔍 Error response:', errorText);
        }
      } catch (err) {
        console.error('❌ Loan recommendation backend error:', err);
        // Fall through to OpenAI response
      }

      const aiResponse = await generateOpenAIResponse(input);


      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Error interacting with Gemini API.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <Bot className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Loan Assistant</h2>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '500px' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-fadeIn ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-blue-600'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-500'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[70%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-gray-100 text-gray-900 rounded-tl-none'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-2 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Animation */}
        {loading && (
          <div className="flex gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={loading}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.05] active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          AI-powered responses. Your data is secure.
        </p>
      </div>
    </div>
  );
}