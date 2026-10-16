// `require.context` est fourni par webpack (bundler de Remotion).
declare const require: {
  context(
    dir: string,
    recursive: boolean,
    filter: RegExp,
  ): {keys(): string[]; (key: string): {default?: unknown}};
};
