// src/components/FileUpload.tsx
import React, { ChangeEvent, useState } from "react";
import styled from "styled-components";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { AiOutlineFile } from "react-icons/ai";
import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist";
import localforage from "localforage";

pdfjs.GlobalWorkerOptions.workerSrc =
  "//mozilla.github.io/pdf.js/build/pdf.worker.mjs";
const UploadContainer = styled.div`
  margin: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const UploadInput = styled.input`
  display: none;
`;

const UploadLabel = styled.label<{ isLoading: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 10px 20px;
  background-color: ${({ isLoading }) => (isLoading ? "#0056b3" : "#007bff")};
  color: white;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
  opacity: ${({ isLoading }) => (isLoading ? 0.7 : 1)};
  pointer-events: ${({ isLoading }) => (isLoading ? "none" : "auto")};
`;

const LoadingIcon = styled(AiOutlineLoading3Quarters)`
  margin-left: 10px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
`;

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);
      setIsLoading(true);

      try {
        let fileContent = "";

        if (file.type === "text/plain") {
          // Parse text file
          fileContent = await readFileAsText(file);
        } else if (file.type === "application/pdf") {
          // Parse PDF file
          fileContent = await parsePdf(file);
        } else if (
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.type === "application/msword"
        ) {
          // Parse DOC or DOCX file
          fileContent = await parseDoc(file);
        } else {
          console.log("Unsupported file type");
          setIsLoading(false);
          return;
        }

        await insertTextToDb(fileContent);

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const parseDoc = async (file: File): Promise<string> => {
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value;
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsText(file);
    });
  };

  const parsePdf = async (file: File): Promise<string> => {
    const loadingTask = pdfjs.getDocument(URL.createObjectURL(file));
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let pdfText = "";

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join("\n");
      pdfText += pageText + "\n"; // Concatenate page text
    }

    return pdfText;
  };
  const insertTextToDb = async (text: string) => {
    try {
      await localforage.setItem("embeddings", text);
    } catch (error) {
      console.error("Error inserting text to database:", error);
    }
  };

  
  return (
    <UploadContainer>
      <UploadInput id="file-upload" type="file" onChange={handleFileChange} />
      <UploadLabel htmlFor="file-upload" isLoading={isLoading}>
        {isLoading ? (
          <>
            Loading...
            <LoadingIcon size={24} />
          </>
        ) : (
          <>
            <AiOutlineFile style={{ marginRight: "8px" }} />
            {selectedFile ? selectedFile.name : "Select Document"}
          </>
        )}
      </UploadLabel>
    </UploadContainer>
  );
};

export default FileUpload;
