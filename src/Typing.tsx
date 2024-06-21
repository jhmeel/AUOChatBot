// src/components/TypingEffect.tsx
import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaRegCopy, FaRegHeart, FaHeart } from "react-icons/fa";
import {toast} from 'react-hot-toast'
import { readTextOut } from "./lookUp";
import { RiSpeakLine } from "react-icons/ri";
const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const Cursor = styled.span`
  font-weight: bold;
  animation: ${blink} 1s infinite;
`;

const IconTray = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.3rem;
  margin-top: 0.5rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: color 0.2s;
  outline: none;

  &:hover {
    color: #333;
    border: none;
    outline: none;
  }
`;

interface TypingEffectProps {
  text: string;
  isUser: boolean;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, isUser }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    let index = 0;
    if (isUser) {
      setDisplayedText(text);
      setIsTypingComplete(true);
      return;
    }
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTypingComplete(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text, isUser]);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div>
      <span>
        {displayedText}
        {!isTypingComplete && <Cursor>|</Cursor>}
      </span>
      {isTypingComplete && !isUser && (
        <IconTray>
          <IconButton onClick={handleLike}>
            {isLiked ? <FaHeart /> : <FaRegHeart />}
          </IconButton>
          <IconButton onClick={handleCopy}>
            <FaRegCopy />
          </IconButton>
          <IconButton onClick={()=> readTextOut(displayedText)}>
          <RiSpeakLine  />
          </IconButton>
        </IconTray>
      )}
    </div>
  );
};

export default TypingEffect;
