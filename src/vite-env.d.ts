/// <reference types="vite/client" />
/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    'lov-mermaid': {
      children?: React.ReactNode;
      [key: string]: any;
    };
  }
}
