import React, { useEffect, useState } from "react";
import styled from "styled-components";
import FileUpload from "./FileUpload";
import Message from "./Message";
import { pipeline } from "@xenova/transformers";
import localforage from "localforage";
import Modal from "react-modal";
import { qa } from "./q";
import { findAnswer } from "./lookUp";

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  height: 100vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  background-color: #f0f0f0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 20px;
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: bold;
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: #888;
`;

const ChatArea = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 10px;
  background-color: white;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
`;

const Button = styled.button<{ isLoading: boolean }>`
  padding: 10px 20px;
  border: none;
  outline: none;
  background-color: ${({ isLoading }) => (isLoading ? "#78838e" : "#007bff")};
  color: white;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
`;

const UsernameModal = styled(Modal)`
  position: absolute;
  width: 70%;
  max-width: 550px;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fff;
  border-radius: 8px;
  padding: 10px 20px;
  border: 1px solid #ededed;
  outline: none;
`;

const UsernameInput = styled.input`
  display: block;
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  &:focus {
    outline: none;
  }
`;

const Avatar = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  color: #000000;
  padding: 2px 4px;
  font-size: 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  border-radius: 10px;
  text-align: center;
  border: 2px dashed #cfd15e;
  cursor: pointer;
`;

const OptionsArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 10px;
  background-color: white;
`;

const OptionButton = styled.button`
  background-color: white;
  border: 1px solid #007bff;
  border-radius: 20px;
  color: #007bff;
  padding: 8px 12px;
  margin: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background-color: #007bff;
    color: white;
  }
`;

const options = [
  { icon: "🏠", text: "Accomodation" },
  { icon: "🍲", text: "Food and drinks" },
  { icon: "🏅", text: "Sport life" },
  { icon: "📚", text: "Library" },
  { icon: "🗺️", text: "Map" },
  { icon: "🏥", text: "Health care" },
  { icon: "🎉", text: "Evening events" },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<
    { text: string; isLoading?: boolean; isUser?: boolean }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userMessage = { text: userInput, isLoading: false, isUser: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setUserInput("");

    await generateResponse(userInput);
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      setShowUsernameModal(true);
    }
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleUsernameSubmit = () => {
    if (username) {
      localStorage.setItem("username", username);
      setShowUsernameModal(false);
    }
  };

  const generateResponse = async (query: string) => {
    const storedData = await localforage.getItem<any>("embeddings");

    try {
      const model_name = "deepset/roberta-base-squad2";
      const nlp = await pipeline("question-answering");

      const QA_input = {
        question: query,
        context: storedData,
      };

      const res = await nlp(QA_input.question, QA_input.context);

      const updatedBotMessage = {
        text: res,
        isLoading: false,
      };

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = updatedBotMessage;
        return newMessages;
      });
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: findAnswer(query),
          isLoading: false,
        },
      ]);
    }
  };

  const handleOptionClick = (option: string) => {
    setUserInput(option);
    handleSend();
  };

  return (
    <Container>
      <Header>
        <div>
          <Logo>🎓</Logo>
          <div>
            <Title>Student Support</Title>
            <Subtitle>Online</Subtitle>
          </div>
        </div>

        <FileUpload onFileSelect={handleFileSelect} />
      </Header>
      <ChatArea>
        {messages.map((msg, index) => (
          <Message
            key={index}
            text={msg.text}
            isLoading={msg.isLoading}
            isUser={msg.isUser}
          />
        ))}
      </ChatArea>
      {messages.length === 0 && (
        <OptionsArea>
          {options.map((option, index) => (
            <OptionButton
              key={index}
              onClick={() => handleOptionClick(option.text)}
            >
              {option.icon} {option.text}
            </OptionButton>
          ))}
        </OptionsArea>
      )}
      <InputContainer>
        <Input
          type="text"
          autoFocus
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask a question..."
        />
        <Button
          isLoading={messages.some((msg) => msg.isLoading)}
          disabled={messages.some((msg) => msg.isLoading)}
          onClick={handleSend}
        >
          Send
        </Button>
      </InputContainer>

      {username && (
        <Avatar onClick={() => setShowUsernameModal(true)}>{username}</Avatar>
      )}

      <UsernameModal
        isOpen={showUsernameModal}
        onRequestClose={() => setShowUsernameModal(false)}
        ariaHideApp={false}
      >
        <h3>Enter your username</h3>
        <UsernameInput
          type="text"
          autoFocus
          value={username || ""}
          onChange={handleUsernameChange}
          placeholder="Username"
        />
        <button
          style={{ background: "#007bff", color: "#fff", fontSize: "12px" }}
          onClick={handleUsernameSubmit}
        >
          Proceed
        </button>
      </UsernameModal>
    </Container>
  );
};

export default App;
