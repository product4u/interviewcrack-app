import { useEffect, useState } from "react";

interface TypingTextProps {
  texts?: string[];
}

const defaultTexts = [
  "Quick start your quiz",
  "Multiple topics available",
  "AI-powered question generation",
];

export const TypingText = ({ texts = defaultTexts }: TypingTextProps) => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const typingSpeed = 50;
    const pauseAfterComplete = 1500;

    if (charIndex < texts[textIndex].length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + texts[textIndex][charIndex]);
        setCharIndex((prev) => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setDisplayText("");
        setCharIndex(0);
        setTextIndex((prev) => (prev + 1) % texts.length);
      }, pauseAfterComplete);

      return () => clearTimeout(timeout);
    }
  }, [charIndex, textIndex, texts]);

  return (
    <p className="text-sm opacity-80 min-h-[20px]">
      {displayText}
      <span className="animate-pulse">|</span>
    </p>
  );
};
