import { resolve, isAbsolute } from 'path';

/**
 * Resolves HuggingFace home directory for test environments with proper precedence.
 *
 * Priority order:
 * 1. TEST_HF_HOME from .env.test (converts relative paths to absolute)
 * 2. HF_HOME from environment (used as-is, typically already absolute)
 * 3. Fallback to <project>/test_hf_home
 *
 * @param options Configuration options
 * @param options.testDir - __dirname from global-setup.ts (e2e/ directory)
 * @returns Absolute path to HuggingFace home directory
 *
 * Note: Relative TEST_HF_HOME paths are resolved from project root (testDir/..).
 */
export function resolveTestHfHome(options: { testDir: string }): string {
  const { testDir } = options;
  let hfHome: string;

  if (process.env.TEST_HF_HOME) {
    const testHfHome = process.env.TEST_HF_HOME;
    if (isAbsolute(testHfHome)) {
      hfHome = testHfHome;
    } else {
      hfHome = resolve(testDir, '..', testHfHome);
    }
    console.log(`[hf-home-resolver] Using TEST_HF_HOME: ${hfHome}`);
  } else if (process.env.HF_HOME) {
    hfHome = process.env.HF_HOME;
    console.log(`[hf-home-resolver] Using HF_HOME from environment: ${hfHome}`);
  } else {
    hfHome = resolve(testDir, '..', 'test_hf_home');
    console.log(`[hf-home-resolver] Using fallback test_hf_home: ${hfHome}`);
  }

  return hfHome;
}
