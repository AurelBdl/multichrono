'use client';

import { ReactNode, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnClickOutside } from 'usehooks-ts';

type FloatingButtonProps = {
  className?: string;
  children: ReactNode;
  triggerContent: ReactNode;
};

type FloatingButtonItemProps = {
  children: ReactNode;
};

const list = {
  visible: {
    opacity: 1,
    display: 'flex',
    transition: {
      staggerChildren: 0.1,
      staggerDirection: -1
    }
  },
  hidden: {
    opacity: 0,
    display: 'none',
    transition: {
      when: 'afterChildren',
      staggerChildren: 0.1
    }
  }
};

const item = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 5 }
};

const btn = {
  visible: { rotate: '180deg', transition: { duration: 0.3 } },
  hidden: { rotate: 0, transition: { duration: 0.3 } }
};

function FloatingButton({ className, children, triggerContent }: FloatingButtonProps) {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClickable, setIsClickable] = useState(true);

  useOnClickOutside(ref, (event: MouseEvent | TouchEvent | FocusEvent) => {
    const target = event.target as HTMLElement;
  
    if (target && target.id !== 'confirm-delete' && !target.closest('#confirm-delete')) {
      setIsOpen(false);
    }
  });

  const handleClick = () => {
    if (!isClickable) return;
    setIsOpen(prev => !prev);
    setIsClickable(false);
    setTimeout(() => setIsClickable(true), 300);
  };

  return (
    <div className="visible sm:hidden fixed bottom-0 right-0">
      <AnimatePresence>
        <motion.ul
          key='children'
          className="flex flex-col justify-end items-end absolute bottom-24 right-8 gap-2"
          initial="hidden"
          animate={isOpen ? 'visible' : 'hidden'}
          variants={list}>
          {children}
        </motion.ul>
        <motion.div
          ref={ref} 
          className="flex flex-col items-center absolute bottom-8 right-8 visible"
          key='triggerButton'
          variants={btn}
          animate={isOpen ? 'visible' : 'hidden'}
          onClick={handleClick}>
          {triggerContent}
        </motion.div>
      </AnimatePresence>
      </div>
  );
}

function FloatingButtonItem({ children }: FloatingButtonItemProps) {
  return <motion.li variants={item}>{children}</motion.li>;
}

export { FloatingButton, FloatingButtonItem };
