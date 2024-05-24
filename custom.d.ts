declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

// png
declare module '*.png' {
  const value: string;
  export default value;
}
