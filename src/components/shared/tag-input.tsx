import { useState, useRef, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add tag...",
  maxTags = 5,
  className = "",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const val = inputValue.trim();
    
    // Add tag on enter, comma, or space
    if (
      (e.key === "Enter" || e.key === "," || e.key === " ") && 
      val !== "" &&
      !value.includes(val.toLowerCase()) && 
      value.length < maxTags
    ) {
      e.preventDefault();
      onChange([...value, val.toLowerCase()]);
      setInputValue("");
    }
    
    // Remove last tag on backspace if input is empty
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      e.preventDefault();
      const newTags = [...value];
      newTags.pop();
      onChange(newTags);
    }
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
    inputRef.current?.focus();
  };

  return (
    <div
      className={`flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <Badge key={index} variant="secondary" className="flex items-center">
          {tag}
          <button
            type="button"
            className="ml-1 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => removeTag(index)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="sr-only">Remove tag</span>
          </button>
        </Badge>
      ))}
      
      {value.length < maxTags && (
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-grow border-0 p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      )}
    </div>
  );
}