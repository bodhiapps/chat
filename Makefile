.PHONY: download-model

download-model:
	@echo "==> Installing huggingface_hub if needed..."
	@python3 -c "import huggingface_hub" 2>/dev/null || python3 -m pip install -U huggingface_hub
	@echo "==> Downloading test model to test_hf_home/..."
	@mkdir -p test_hf_home
	@HF_HOME=$(PWD)/test_hf_home python3 -c "from huggingface_hub import hf_hub_download; hf_hub_download('bartowski/google_gemma-3-1b-it-GGUF', 'google_gemma-3-1b-it-Q4_K_M.gguf', revision='116f76234503685a98f572982177b11d44ec8ff1')"
	@echo "==> Model downloaded successfully"
