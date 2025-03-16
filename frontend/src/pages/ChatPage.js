import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon, DocumentIcon, XCircleIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState([]);
  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState([]);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Fetch conversations and knowledge bases on component mount
  useEffect(() => {
    fetchConversations();
    fetchKnowledgeBases();
  }, []);
  
  // Fetch messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/conversation/conversations');
      setConversations(response.data.items);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };
  
  const fetchKnowledgeBases = async () => {
    try {
      const response = await axios.get('/api/kb/documents');
      setAvailableKnowledgeBases(response.data.items);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    }
  };
  
  const fetchMessages = async (convoId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/conversation/conversations/${convoId}`);
      setMessages(response.data.messages || []);
      
      // Update selected knowledge bases if available
      if (response.data.knowledge_base_ids) {
        setSelectedKnowledgeBases(response.data.knowledge_base_ids);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateConversation = async () => {
    try {
      const response = await axios.post('/api/conversation/conversations', {
        title: 'New Conversation',
        knowledge_base_ids: selectedKnowledgeBases.length ? selectedKnowledgeBases : undefined
      });
      
      // Update conversations list and navigate to the new conversation
      fetchConversations();
      navigate(`/chat/${response.data.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  const handleDeleteConversation = async (convoId) => {
    try {
      await axios.delete(`/api/conversation/conversations/${convoId}`);
      
      // Update conversations list
      setConversations(conversations.filter(convo => convo.id !== convoId));
      
      // Navigate away if the deleted conversation is the current one
      if (conversationId === convoId) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    // Add user message immediately for better UX
    const userMessage = {
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsStreamingResponse(true);
    
    try {
      const response = await axios.post('/api/conversation/query', {
        query: newMessage,
        conversation_id: conversationId,
        knowledge_base_ids: selectedKnowledgeBases.length ? selectedKnowledgeBases : undefined
      });
      
      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        sources: response.data.sources
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // If this is a new conversation (no conversationId yet), navigate to the new one
      if (!conversationId && response.data.conversation_id) {
        navigate(`/chat/${response.data.conversation_id}`);
        fetchConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreamingResponse(false);
    }
  };
  
  const toggleKnowledgeBase = (kbId) => {
    setSelectedKnowledgeBases(prev =>
      prev.includes(kbId)
        ? prev.filter(id => id !== kbId)
        : [...prev, kbId]
    );
  };
  
  return (
    <div className="h-[calc(100vh-9rem)] flex">
      {/* Left sidebar - Conversations */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleCreateConversation}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            New Conversation
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(convo => (
            <div
              key={convo.id}
              className={`flex justify-between items-center p-2 text-sm rounded-md cursor-pointer ${conversationId === convo.id ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
              onClick={() => navigate(`/chat/${convo.id}`)}
            >
              <div className="truncate">{convo.title}</div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConversation(convo.id); }}
                className="text-gray-400 hover:text-red-600"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center text-gray-500 text-sm p-4">
              No conversations yet
            </div>
          )}
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user' ? 'message-user' : 'message-assistant'} ${message.error ? 'bg-red-100 text-red-800' : ''}`}
                >
                  <div className="markdown-content">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-200">
                      <div>Sources:</div>
                      <ul className="list-disc pl-4">
                        {message.sources.map((source, idx) => (
                          <li key={idx}>{source.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium">Start a new conversation</h3>
              <p className="mt-1 max-w-sm">
                Ask questions based on your knowledge base or start a general conversation.
              </p>
            </div>
          )}
          
          {/* Loading indicator for streaming response */}
          {isStreamingResponse && (
            <div className="flex justify-start">
              <div className="message-assistant max-w-[80%] rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Knowledge base selector */}
        {availableKnowledgeBases.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Knowledge bases:</div>
            <div className="flex flex-wrap gap-1">
              {availableKnowledgeBases.map(kb => (
                <button
                  key={kb.id}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${selectedKnowledgeBases.includes(kb.id) ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  onClick={() => toggleKnowledgeBase(kb.id)}
                >
                  <DocumentIcon className="h-3 w-3 mr-1" />
                  {kb.title}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Message input */}
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              className="flex-1 focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md sm:text-sm border-gray-300"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isStreamingResponse}
            />
            <button
              type="submit"
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={!newMessage.trim() || isStreamingResponse}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
