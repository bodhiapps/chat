# E2E Tests

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Download test model:**
   ```bash
   make download-model
   ```
   Downloads `google_gemma-3-1b-it-Q4_K_M.gguf` (~2GB) to `test_hf_home/`.

3. **Configure test environment:**
   ```bash
   cp e2e/.env.test.example e2e/.env.test.local
   # Edit e2e/.env.test.local with actual credentials
   ```

   Required credentials:
   - `INTEG_TEST_CLIENT_SECRET` - Resource client secret
   - `INTEG_TEST_USERNAME` - Test user email
   - `INTEG_TEST_PASSWORD` - Test user password

   Pre-configured (no changes needed):
   - `INTEG_TEST_AUTH_URL=https://main-id.getbodhi.app`
   - `INTEG_TEST_AUTH_REALM=bodhi`
   - `INTEG_TEST_CLIENT_ID=resource-ff72ac9a-6c93-4777-902c-dc9f6f9db677`

## Running Tests

**Local (headed mode):**
```bash
npm run e2e
```

**CI mode:**
```bash
npm run ci:test:e2e
```

**With UI:**
```bash
npm run e2e:ui
```

## Test Infrastructure

- **Backend server:** Port 22222 (started in global-setup)
- **Frontend dev server:** Port 15173 (auto-started by Playwright)
- **Model cache:** `test_hf_home/` (override with `TEST_HF_HOME` env var)

## GitHub Actions Setup

Configure these repository secrets in **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Source |
|-------------|-------------|--------|
| `INTEG_TEST_CLIENT_SECRET` | Resource client secret for BodhiServer | Copy from bodhi-browser repo |
| `INTEG_TEST_USERNAME` | Test user email for OAuth login | Copy from bodhi-browser repo |
| `INTEG_TEST_PASSWORD` | Test user password for OAuth login | Copy from bodhi-browser repo |
| `HF_TOKEN` | HuggingFace token for model download | Copy from bodhi-browser repo |

**Notes:**
- Non-secret config (AUTH_URL, AUTH_REALM, CLIENT_ID) is hardcoded in `.github/workflows/ci.yml`
- Models are cached at `~/.cache/huggingface` with key `hf-cache-${{ runner.os }}-gemma3-1b-it`
- First CI run downloads model (~2GB), subsequent runs use cache
