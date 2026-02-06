import React, { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { showError } from "../service/toast";
import "../styles/dragDropUpload.css";

const DragDropUpload = ({
    onFileSelect,
    accept = ".pdf,application/pdf",
    maxSize = 50 * 1024 * 1024, // 50MB default
    label = "Click to upload or drag and drop",
    subLabel = "PDF up to 50MB",
    icon,
    className = "",
    currentFile = null,
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDragEnter = useCallback((e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, [disabled]);

    const handleDragOver = useCallback((e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
    }, [disabled]);

    const validateFile = (file) => {
        // Check type
        if (accept) {
            const acceptedTypes = accept.split(",").map(t => t.trim());
            const fileType = file.type;
            const fileName = file.name.toLowerCase();

            const isValidType = acceptedTypes.some(type => {
                if (type.startsWith(".")) {
                    return fileName.endsWith(type.toLowerCase());
                }
                return fileType === type;
            });

            if (!isValidType) {
                showError("Invalid file type. Please upload a supported format.");
                return false;
            }
        }

        // Check size
        if (file.size > maxSize) {
            showError(`File size exceeds the limit of ${Math.round(maxSize / 1024 / 1024)}MB.`);
            return false;
        }

        return true;
    };

    const handleDrop = useCallback((e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                onFileSelect(file);
            }
        }
    }, [onFileSelect, accept, maxSize, disabled]);

    const handleFileInput = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                onFileSelect(file);
            }
        }
    }, [onFileSelect, accept, maxSize]);

    const handleClick = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    // Default icon if none provided
    const IconComponent = icon || Upload;

    return (
        <div
            className={`drag-drop-upload ${isDragging ? "is-dragging" : ""} ${currentFile ? "has-file" : ""} ${disabled ? "disabled" : ""} ${className}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileInput}
                hidden
                disabled={disabled}
            />

            {currentFile ? (
                <div className="drag-drop-file-info">
                    <CheckCircle className="drag-drop-icon" size={48} />
                    <p className="drag-drop-filename">{currentFile.name}</p>
                    <span className="drag-drop-subtitle">
                        {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="drag-drop-change">{disabled ? "Processing..." : "Click or drop to change file"}</span>
                </div>
            ) : (
                <div className="drag-drop-content">
                    <IconComponent className="drag-drop-icon" size={48} />
                    <p className="drag-drop-title">{label}</p>
                    <p className="drag-drop-subtitle">{subLabel}</p>
                </div>
            )}
        </div>
    );
};

export default DragDropUpload;
