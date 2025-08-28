import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { BsFillFilePdfFill } from "react-icons/bs";
import { documentService, documentUtils } from "../../services/api";
import type { UploadDocumentProps } from "../../types";

/**
 * UploadDocument Component
 * Handles PDF document uploads and displays document selection interface
 */
const UploadDocument: React.FC<UploadDocumentProps> = ({
  setFileName,
  fileName,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [collectionName, setCollectionName] = useState<string[]>([]);

  /**
   * Fetch all available document collections from the backend
   */
  const fetchCollectionNames = async () => {
    try {
      const collections = await documentService.getCollections();
      setCollectionName(collections);
    } catch (error) {
      console.error("Error fetching collection names:", error);
    }
  };

  // Load document collections on component mount
  useEffect(() => {
    fetchCollectionNames();
  }, []);

  /**
   * Upload a file to the backend server
   * @param file - The PDF file to upload
   */
  const uploadFileToBackend = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      await documentService.uploadPdf(file);

      const processedFileName = documentUtils.removePdfExtension(file.name);
      setCollectionName((prevNames) => {
        if (!prevNames.includes(processedFileName)) {
          return [...prevNames, processedFileName];
        }
        return prevNames;
      });

      setFileName(file.name);
      alert("File uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Upload file when it changes
  useEffect(() => {
    if (file) {
      uploadFileToBackend(file);
    }
  }, [file]);

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">


      <div className="p-3 md:p-5 flex-1 overflow-hidden flex flex-col">
        <div className="mb-3 md:mb-4 flex-shrink-0 flex justify-center">
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

        {collectionName.length > 0 && (
          <div className="mt-3 md:mt-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xs md:text-sm font-medium text-gray-400 mb-2 md:mb-3 flex-shrink-0 text-center md:text-left">
              Your Documents
            </h3>
            <div className="space-y-2 overflow-y-auto pr-2 flex-1 flex flex-col items-center md:items-start">
              {collectionName.map((name) => (
                <div
                  key={name}
                  onClick={() => setFileName(name)}
                  className={`cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 w-[80%] md:w-full
                  ${
                    fileName === name
                      ? "bg-gray-700 border-l-4 border-[#DD5953]"
                      : "bg-gray-700/30 hover:bg-gray-700/50"
                  }`}
                >
                  <BsFillFilePdfFill className="text-red-500 text-lg flex-shrink-0" />
                  <span className="text-gray-200 text-sm truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocument;
