/**
 * File Upload Component for brand kit extraction
 */

import React, { useRef } from "react";
import { Button } from "@swc-react/button";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    acceptedTypes?: string;
    disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, acceptedTypes = "image/*,.pdf", disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={disabled}
            />
            <Button size="m" onClick={handleClick} disabled={disabled}>
                Upload Screenshot or PDF
            </Button>
        </>
    );
};
