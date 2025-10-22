'use client';

import React from 'react';

/**
 * Loading state configuration types
 */
export interface LoadingConfig {
  enabled?: boolean;
  type?: 'skeleton' | 'spinner' | 'fade' | 'custom';
  duration?: number;
  customLoader?: React.ComponentType<LoadingProps>;
  skeletonProps?: SkeletonProps;
}

export interface LoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  originalText?: string;
  targetLocale?: string;
}

export interface SkeletonProps {
  height?: string | number;
  width?: string | number;
  borderRadius?: string | number;
  backgroundColor?: string;
  animationDuration?: string;
  className?: string;
}

/**
 * Word-by-word skeleton loader for realistic text appearance
 */
export function WordSkeletonLoader({
  originalText = '',
  height = '1em',
  backgroundColor = '#e2e8f0',
  animationDuration = '1.2s',
  className = ''
}: SkeletonProps & { originalText?: string }) {
  // Generate word-like skeleton blocks based on original text
  const generateWordSkeletons = (text: string) => {
    if (!text) {
      // Default pattern if no text provided
      return [60, 80, 45, 90, 70]; // Pixel widths for default words
    }

    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.map(word => {
      // Calculate width based on word length with some variation
      const baseWidth = Math.max(20, Math.min(120, word.length * 8 + Math.random() * 10));
      return Math.round(baseWidth);
    });
  };

  const wordWidths = generateWordSkeletons(originalText);

  const skeletonStyle: React.CSSProperties = {
    display: 'inline-block',
    height,
    borderRadius: '3px',
    backgroundColor,
    animation: `rustle-skeleton-pulse ${animationDuration} ease-in-out infinite`,
    verticalAlign: 'middle',
    marginRight: '0.3em'
  };

  return (
    <>
      <style>
        {`
          @keyframes rustle-skeleton-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          .rustle-skeleton-word:last-child {
            margin-right: 0;
          }
        `}
      </style>
      <span className={`rustle-skeleton-container ${className}`}>
        {wordWidths.map((width, index) => (
          <span
            key={index}
            className="rustle-skeleton rustle-skeleton-word"
            style={{
              ...skeletonStyle,
              width: `${width}px`,
              animationDelay: `${index * 0.1}s`
            }}
            aria-label="Loading word..."
          />
        ))}
      </span>
    </>
  );
}

/**
 * Default skeleton loader component
 */
export function SkeletonLoader({ 
  height = '1em', 
  width = '100%', 
  borderRadius = '4px',
  backgroundColor = '#e2e8f0',
  animationDuration = '1.5s',
  className = ''
}: SkeletonProps) {
  const skeletonStyle: React.CSSProperties = {
    display: 'inline-block',
    height,
    width,
    borderRadius,
    backgroundColor,
    animation: `rustle-skeleton-pulse ${animationDuration} ease-in-out infinite`,
    verticalAlign: 'middle'
  };

  return (
    <>
      <style>
        {`
          @keyframes rustle-skeleton-pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
      <span 
        className={`rustle-skeleton ${className}`}
        style={skeletonStyle}
        aria-label="Loading translation..."
      />
    </>
  );
}

/**
 * Spinner loader component
 */
export function SpinnerLoader({ className = '' }: { className?: string }) {
  const spinnerStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '1em',
    height: '1em',
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'rustle-spinner-spin 1s linear infinite',
    verticalAlign: 'middle'
  };

  return (
    <>
      <style>
        {`
          @keyframes rustle-spinner-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <span 
        className={`rustle-spinner ${className}`}
        style={spinnerStyle}
        aria-label="Loading translation..."
      />
    </>
  );
}

/**
 * Fade loader component
 */
export function FadeLoader({ 
  children, 
  isLoading, 
  className = '' 
}: { 
  children: React.ReactNode; 
  isLoading: boolean; 
  className?: string; 
}) {
  const fadeStyle: React.CSSProperties = {
    opacity: isLoading ? 0.5 : 1,
    transition: 'opacity 0.2s ease-in-out'
  };

  return (
    <span 
      className={`rustle-fade ${className}`}
      style={fadeStyle}
    >
      {children}
    </span>
  );
}

/**
 * Main loading wrapper component
 */
export function LoadingWrapper({
  isLoading,
  children,
  config = {},
  originalText,
  targetLocale
}: LoadingProps & { config?: LoadingConfig }) {
  // If loading is disabled, return children as-is
  if (!config.enabled || !isLoading) {
    return <>{children}</>;
  }

  // Handle custom loader
  if (config.type === 'custom' && config.customLoader) {
    const CustomLoader = config.customLoader;
    return (
      <CustomLoader 
        isLoading={isLoading}
        originalText={originalText}
        targetLocale={targetLocale}
      >
        {children}
      </CustomLoader>
    );
  }

  // Handle built-in loaders
  switch (config.type) {
    case 'spinner':
      return <SpinnerLoader />;

    case 'fade':
      return (
        <FadeLoader isLoading={isLoading}>
          {children}
        </FadeLoader>
      );

    case 'skeleton':
    default:
      // Use word skeleton loader if we have original text, otherwise use regular skeleton
      if (originalText && originalText.trim()) {
        return (
          <WordSkeletonLoader
            originalText={originalText}
            {...config.skeletonProps}
          />
        );
      } else {
        return <SkeletonLoader {...config.skeletonProps} />;
      }
  }
}

/**
 * Hook to manage loading states for translations
 */
export function useTranslationLoading(config: LoadingConfig = {}) {
  const [loadingStates, setLoadingStates] = React.useState<Map<string, boolean>>(new Map());

  const setLoading = React.useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      if (isLoading) {
        newMap.set(key, true);
      } else {
        newMap.delete(key);
      }
      return newMap;
    });
  }, []);

  const isLoading = React.useCallback((key: string) => {
    return loadingStates.get(key) || false;
  }, [loadingStates]);

  const clearAll = React.useCallback(() => {
    setLoadingStates(new Map());
  }, []);

  return {
    setLoading,
    isLoading,
    clearAll,
    hasAnyLoading: loadingStates.size > 0
  };
}

/**
 * Default loading configuration - optimized for fast, lightweight loading
 */
export const defaultLoadingConfig: LoadingConfig = {
  enabled: true,
  type: 'skeleton', // Will use WordSkeletonLoader when originalText is available
  duration: 0, // No artificial delay - show immediately when needed
  skeletonProps: {
    height: '1em',
    width: '100%',
    borderRadius: '3px',
    backgroundColor: '#e2e8f0',
    animationDuration: '1.2s' // Faster animation for better UX
  }
};

/**
 * Utility to create loading config with overrides
 */
export function createLoadingConfig(overrides: Partial<LoadingConfig> = {}): LoadingConfig {
  return {
    ...defaultLoadingConfig,
    ...overrides,
    skeletonProps: {
      ...defaultLoadingConfig.skeletonProps,
      ...overrides.skeletonProps
    }
  };
}
