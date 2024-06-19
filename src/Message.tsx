// src/components/Message.tsx
import React from "react";
import styled from "styled-components";
import TypingEffect from "./Typing";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { LuBot } from "react-icons/lu";
import { FaUserCircle } from "react-icons/fa";

const MessageContainer = styled.div`
  display: flex;
  max-width: 600px;
  flex-direction: column;
  width: fit-content;
  padding: 10px 15px;
  margin: 10px 0;
  background-color: #f0f0f0;
  border-radius: 20px;
  border: 1px solid #ededed;
`;

const AvatarContainer = styled.div`
  margin-right: 10px;
`;

const LoadingIcon = styled(AiOutlineLoading3Quarters)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
`;

const MessageText = styled.div`
  flex: 1;
`;

interface MessageProps {
  text: string;
  isLoading?: boolean;
  isUser?: boolean;
}

const Message: React.FC<MessageProps> = ({
  text,
  isLoading = false,
  isUser = false,
}) => {
  return (
    <MessageContainer>
      <AvatarContainer>
        {isUser ? <FaUserCircle size={24} /> : <LuBot size={24} />}
      </AvatarContainer>
      <MessageText>
        {isLoading ? (
          <LoadingIcon size={24} />
        ) : (
          <TypingEffect text={text} isUser={isUser} />
        )}
      </MessageText>
    </MessageContainer>
  );
};

export default Message;
