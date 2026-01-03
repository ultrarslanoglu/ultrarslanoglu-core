import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  shadow?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  shadow = 'md'
}) => {
  const shadows = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };
  
  const hoverClass = hoverable ? 'hover:shadow-xl hover:scale-105 transition duration-300' : '';
  
  return (
    <div
      className={`bg-white rounded-lg p-6 ${shadows[shadow]} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
