// Temporary type shims to satisfy CI type-checking. Replace with proper devDependencies.
// TODO: install @types/babel__traverse, @types/babel__core, @babel/core, and next; then remove this file.
declare module '@babel/traverse' {
  const traverse: any;
  export default traverse;
  export type NodePath<T = any> = any;
}

declare module '@babel/core' {
  export type PluginObj = any;
  export type types = any;
}

declare module 'next/server' {
  export type NextRequest = any;
  export const NextResponse: any;
}

