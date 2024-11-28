import React from 'react'

interface FooterProps {
  textColor: string;
}

export function Footer({ textColor }: FooterProps) {
  return (
    <footer className={`text-center py-6 text-sm ${textColor}`}>
      <a
        href="https://creativeclub.ie/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
        onClick={(e) => {
          e.preventDefault();
          window.open('https://creativeclub.ie/', '_blank', 'noopener,noreferrer');
        }}
      >
        Made by Creative Club ❤
      </a>
    </footer>
  )
}

