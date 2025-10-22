#!/usr/bin/env node
interface RustleEngineConfig {
    sourceLanguage: string;
    targetLanguages: string[];
    srcDir: string;
    outputDir: string;
    filePatterns: string[];
    excludePatterns: string[];
    debug: boolean;
}
/**
 * CLI Entry Point
 */
export declare function runRustleEngine(config?: Partial<RustleEngineConfig>): Promise<void>;
export {};
//# sourceMappingURL=rustleEngine.d.ts.map