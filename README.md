import React, { useState, useEffect, useRef } from 'react';
import { create, insert, search } from '@orama/orama';
import localforage from 'localforage';
import mammoth from 'mammoth';
import styled from 'styled-components';
import { AiOutlineSend, AiOutlineMenu, AiOutlineClose, AiOutlineRobot } from 'react-icons/ai';
import { pipeline } from '@xenova/transformers';

interface Message {
  content: string;
  fromUser: boolean;
}

const Bot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [db, setDb] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeDb = async () => {
      const oramaDb = await create({
        schema: {
          text: 'string',
        },
      });
      setDb(oramaDb);
    };

    initializeDb();
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const docxData = await mammoth.extractRawText({ arrayBuffer });
          const parsedText = docxData.value;
          if (parsedText) {
            await insertTextToDb(parsedText);
            setMessages((prev) => [...prev, { content: 'Document uploaded successfully', fromUser: false }]);
          } else {
            setMessages((prev) => [...prev, { content: 'Failed to parse document', fromUser: false }]);
          }
        } catch (error) {
          console.error('Error parsing DOCX file:', error);
          setMessages((prev) => [...prev, { content: 'Failed to parse document', fromUser: false }]);
        }
        setDocumentLoading(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const insertTextToDb = async (text: string) => {
    if (db) {
      try {
        const serializedText = JSON.stringify(text); // Serialize the text before inserting
        await insert(db, { text: serializedText });
      } catch (error) {
        console.error('Error inserting text to database:', error);
      }
    }
  };
  
  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage: Message = { content: input, fromUser: true };
    setMessages([...messages, newMessage]);
    setInput('');
    setLoading(true);

    const storedDb = await localforage.getItem<any>('oramaDb');
    if (!storedDb) {
      setMessages((prev) => [...prev, { content: 'No document uploaded', fromUser: false }]);
      setLoading(false);
      return;
    }

    const results = await search(storedDb, { term: input, properties: ['text'] });
    let response = '';

    if (results) {
      response = await generateResponse(input, results);
    } else {
      response = "Hmm, I don't see anything about that in this document.";
    }

    setMessages((prev) => [...prev, { content: response, fromUser: false }]);
    setLoading(false);
  };

  const generateResponse = async (query: string, doc: string) => {
  
    try {
      const model = await pipeline('text-generation', 'xenova/xgpt-1.8.0');
      const prompt = `
        <document>
          ${doc}
        </document>
        
        <user>
          ${query}
        </user>
      `;
      const response = await model(prompt, { max_length: 200 });
  
      return response.generated_text || "I don't have an idea about that.";
    } catch (error) {
      console.error('Error generating response:', error);
      return "I'm having trouble generating a response right now.";
    }
  };

  return (
    <Container>
      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen}>
        <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
        </SidebarToggle>
        {sidebarOpen && (
          <SidebarContent>
            {messages.map((msg, index) => (
              <SidebarMessage key={index} fromUser={msg.fromUser}>
                {msg.content.length > 20 ? msg.content.slice(0, 20) + '...' : msg.content}
              </SidebarMessage>
            ))}
          </SidebarContent>
        )}
      </Sidebar>

      {/* Main Content Component */}
      <MainContent>
        {/* File Upload Component */}
        <FileInputContainer>
          <FileInput type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} id="file-input" />
          <FileUploadLabel htmlFor="file-input">
            {documentLoading ? <DocumentLoader /> : 'Upload Document'}
          </FileUploadLabel>
        </FileInputContainer>

        {/* Chat History Component */}
        <ChatHistory ref={chatHistoryRef}>
          {messages.map((msg, index) => (
            <MessageContainer key={index} fromUser={msg.fromUser}>
              {msg.fromUser ? msg.content : <TypingMessage message={msg.content} />}
            </MessageContainer>
          ))}
          {loading && (
            <TypingMessageContainer>
              <AiOutlineRobot style={{ marginRight: '10px' }} />
              <span>Generating response...</span>
              <ChatLoader />
            </TypingMessageContainer>
          )}
        </ChatHistory>

        {/* Chat Input Component */}
        <ChatInputContainer>
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <IconContainer onClick={handleSend}>
            <AiOutlineSend />
          </IconContainer>
        </ChatInputContainer>
      </MainContent>
    </Container>
  );
};

// TypingMessage component
const TypingMessage: React.FC<{ message: string }> = ({ message }) => {
  const [displayedText, setDisplayedText] = useState('');
  const index = useRef(0);

  useEffect(() => {
    if (index.current < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + message[index.current]);
        index.current += 1;
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, message]);

  return <span>{displayedText}</span>;
};

// Styled Components
const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: #1a1a1a;
  flex-direction: column;
  font-family: 'Roboto', sans-serif;
`;

const Sidebar = styled.div<{ isOpen: boolean }>`
  width: ${(props) => (props.isOpen ? '250px' : '0')};
  transition: width 0.3s;
  background-color: #2f2f2f;
  color: white;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
`;

const SidebarToggle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  background-color: #444;
`;

const SidebarContent = styled.div`
  padding: 10px;
  height: calc(100vh - 60px);
  overflow-y: auto;
`;

const SidebarMessage = styled.div<{ fromUser: boolean }>`
  padding: 5px;
  border-bottom: 1px solid #444;
  color: ${(props) => (props.fromUser ? '#4caf50' : '#f44336')};
  font-size: 0.9em;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  color: #fff;
`;

const FileInputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #2f2f2f;
  border-bottom: 1px solid #444;
`;

const FileInput = styled.input`
  display: none;
`;

const FileUploadLabel = styled.label`
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #388e3c;
  }
`;

const ChatHistory = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const ChatInputContainer = styled.div`
  display: flex;
  padding: 10px;
  background-color: #2f2f2f;
  align-items: center;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 16px;
  outline: none;
  background-color: #1a1a1a;
  color: #fff;
  transition: border-color 0.2s ease-in-out;

  &:focus {
    border-color: #4caf50;
  }
`;

const IconContainer = styled.div`
  margin-left: 10px;
  cursor: pointer;
  color: #4caf50;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #388e3c;
  }
`;

const MessageContainer = styled.div<{ fromUser: boolean }>`
  background-color: ${(props) => (props.fromUser ? '#2f2f2f' : '#444')};
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
  align-self: ${(props) => (props.fromUser ? 'flex-end' : 'flex-start')};
  max-width: 70%;
  word-wrap: break-word;
  display: flex;
  align-items: center;
`;

const TypingMessageContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #2f2f2f;
`;

const ChatLoader = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(to right, #4caf50, #2f2f2f);
  animation: chat-loader 1s infinite linear;

  @keyframes chat-loader {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const DocumentLoader = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(to right, #aab8aa, #2f2f2f);
  animation: document-loader 1s infinite linear;

  @keyframes document-loader {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default Bot;
