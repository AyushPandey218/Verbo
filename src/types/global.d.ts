
/// <reference types="node" />

import { ReactNode } from 'react';

// Augment the BadgeProps to include children property
declare module '@/components/ui/badge' {
  interface BadgeProps {
    children?: ReactNode;
  }
}

// Add any other missing type declarations here
