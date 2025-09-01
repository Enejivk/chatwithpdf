import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { BsFillFilePdfFill } from "react-icons/bs";
import { documentService } from "../../services/api";
import type { DocumentList, UploadDocumentProps } from "../../types";
import { toast, Toaster } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

const UploadDocument: React.FC<UploadDocumentProps> = ({
  setSelectedFileIds,
  selectedFileIds = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<DocumentList>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();

  const getIdFromUrl = () => {
    const pathParts = location.pathname.split("/");
    return pathParts[pathParts.length - 1];
  };

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const chatId = getIdFromUrl();

      if (chatId && chatId !== "" && chatId !== "chat") {
        const documentList = await documentService.getChatDocuments(chatId);
        setDocuments(documentList);
      } else {
        setDocuments([]);
        console.log("No valid chat ID found in URL");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Fetching documents for chat ID:", getIdFromUrl());
    fetchDocuments();
  }, [location.pathname]);

  const isNewChat = getIdFromUrl() === "new" || getIdFromUrl() === "chat";
  const uploadFileToBackend = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("document", file);
    if (!isNewChat) {
      formData.append("chat_id", getIdFromUrl());
    }
    try {
      setIsUploading(true);
      const response = await documentService.uploadPdf(formData);
      if (isNewChat) {
        navigate(`/chat/${response.chat_id}`);
      } else {
        setDocuments((prevDocs) => [response.document, ...prevDocs]);
      }

      setFile(null);
      toast.success("File uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (file) {
      uploadFileToBackend(file);
    }
  }, [file]);

  const selectAllDocuments = () => {
    console.log("Selecting all documents");
    const allDocumentIds = documents.map((doc) => doc.id);
    console.log("All document IDs:", allDocumentIds);
    setSelectedFileIds(allDocumentIds);
  };

  const toggleDocumentSelection = (documentId: string) => {
    console.log("Toggling document with ID:", documentId);
    console.log("Current selected IDs:", selectedFileIds);

    if (selectedFileIds.includes(documentId)) {
      // Deselect this document
      const newSelectedIds = selectedFileIds.filter((id) => id !== documentId);
      console.log("After deselection:", newSelectedIds);
      setSelectedFileIds(newSelectedIds);
    } else {
      // Select this document
      const newSelectedIds = [...selectedFileIds, documentId];
      console.log("After selection:", newSelectedIds);
      setSelectedFileIds(newSelectedIds);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <Toaster position="top-right" richColors />
      <div className="p-3 md:p-5 flex-1 overflow-hidden flex flex-col">
        <div className="mb-3 md:mb-4 flex-shrink-0 flex flex-col gap-2 items-center">
          <input
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
            accept=".pdf"
            className="hidden"
            type="file"
            id="upload-pdf"
          />
          <label
            className="flex items-center justify-center gap-2 
            rounded-xl bg-[#DD5953] hover:bg-[#c74c47] text-white py-2 md:py-3 px-3 md:px-4 cursor-pointer 
            transition-all duration-300 ease-in-out shadow-md font-medium w-[80%] md:w-3/4 mx-auto text-sm md:text-base"
            htmlFor="upload-pdf"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FaPlus className="text-sm" />
                <span>Upload PDF</span>
              </>
            )}
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-center gap-2 p-2 md:p-3 mb-2 md:mb-3 bg-gray-700/30 rounded-xl flex-shrink-0 w-[80%] mx-auto md:w-full md:mx-0">
            <BsFillFilePdfFill className="text-red-500 text-lg flex-shrink-0" />
            <h2 className="text-xs md:text-sm font-medium text-gray-200 truncate">
              {file.name}
            </h2>
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#DD5953] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-400 text-sm">
              Loading documents...
            </span>
          </div>
        ) : documents.length > 0 ? (
          <div className="mt-3 md:mt-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <h3 className="text-xs md:text-sm font-medium text-gray-400 flex-shrink-0 text-center md:text-left">
                Your Documents
              </h3>
              <div className="flex items-center">
                {selectedFileIds.length > 0 ? (
                  <div className="flex items-center">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full mr-2">
                      {selectedFileIds.length} selected
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFileIds([]);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAllDocuments();
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Select All
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2 overflow-y-auto pr-2 flex-1 flex flex-col items-center md:items-start">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => toggleDocumentSelection(doc.id)}
                  className={`cursor-pointer flex items-center p-3 rounded-xl transition-all duration-200 w-[90%] md:w-full
                  ${
                    selectedFileIds.includes(doc.id)
                      ? "bg-gray-700 border-l-4 border-[#DD5953]"
                      : "bg-gray-700/30 hover:bg-gray-700/50"
                  }`}
                  data-document-id={doc.id}
                >
                  <div className="flex-shrink-0 mr-3 flex items-center justify-center">
                    <BsFillFilePdfFill className="text-red-500 text-xl" />
                  </div>
                  <div className="flex flex-col flex-grow overflow-hidden">
                    <span className="text-gray-200 text-sm font-medium truncate">
                      {doc.title || doc.filename}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Uploaded: {formatDate(doc.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center text-center">
            <BsFillFilePdfFill className="text-gray-500 text-4xl mb-2" />
            <p className="text-gray-400 text-sm">
              No documents found. Upload a PDF to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocument;
