import React, { useEffect, useState } from "react";
import styled from "styled-components";
import FileUpload from "./FileUpload";
import Message from "./Message";
import { pipeline } from "@xenova/transformers";
import localforage from "localforage";
import Modal from "react-modal";

const ChatContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  main {
    position: relative;
    width: 600px;
    overflow-y: scroll;
    min-height: 100vh;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  }
`;

const InputContainer = styled.div`
  display: flex;
  position: fixed;
  bottom: 5px;
  transform: translateX(50%);
  margin-top: 10px;
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
  background-color: #96a2b0;
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
`;

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

    if (!storedData) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "I don't have an idea about that.", isLoading: false },
      ]);
      return;
    }

    try {
      const model_name = "deepset/roberta-base-squad2";
      const nlp = await pipeline("question-answering");

      const QA_input = {
        question: query,
        context: storedData,
      };

      const res =
        (await nlp(QA_input.question, QA_input.context)) ||
        "I don't have an idea about that.";

      console.log(res);

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
          text: "I'm having trouble generating a response right now.",
          isLoading: false,
        },
      ]);
    }
  };

  return (
    <ChatContainer>
      <main>
        <FileUpload onFileSelect={handleFileSelect} />
        {messages.map((msg, index) => (
          <Message
            key={index}
            text={msg.text}
            isLoading={msg.isLoading}
            isUser={msg.isUser}
          />
        ))}
        <InputContainer>
          <Input
            type="text"
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
      </main>
    </ChatContainer>
  );
};

export default App;
