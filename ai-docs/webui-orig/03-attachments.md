# Feature: File Attachments

> Priority: 3 | Status: Core Feature | **Implementation: ❌ Not Started**

---

## Overview

File attachment system enables users to upload images, PDFs, audio files, and text documents with chat messages. Supports drag-drop, paste, and button upload with automatic format conversion and capability validation.

---

## Functional Requirements

### User Should Be Able To

1. ❌ **Upload Files**
   - ❌ Click attachment button → select files from dialog
   - ❌ Drag files onto chat area
   - ❌ Paste files from clipboard (Ctrl/Cmd+V)
   - ❌ Paste images directly from screenshots
   - ❌ Record audio (microphone button)

2. ❌ **Preview Attachments**
   - ❌ See image thumbnails (before send)
   - ❌ See text file previews (first 150 chars)
   - ❌ See PDF icon with page count
   - ❌ See audio player controls
   - ❌ Click thumbnail for full preview dialog

3. ❌ **Manage Attachments**
   - ❌ Remove individual attachments (X button)
   - ❌ Remove all attachments (clear button)
   - ❌ View in single-row scrollable list
   - ❌ See file size per attachment

4. ❌ **View Full Previews**
   - ❌ Images: Full-size with zoom
   - ❌ PDFs: Text view OR pages view (toggle)
   - ❌ Text: Syntax-highlighted code
   - ❌ Audio: Playable with controls

---

## System Should

1. ❌ **Validate Capability**
   - ❌ Disable image upload if model lacks vision
   - ❌ Disable audio upload if model lacks audio support
   - ❌ Show warning icon for incompatible files
   - ❌ Suggest vision model for PDFs with images

2. ❌ **Process Files**
   - ❌ Convert SVG → PNG (white background)
   - Convert WebP → PNG
   - Extract text from PDFs (pdfjs-dist)
   - Convert PDF pages to images (for vision models)
   - Generate base64 data URLs for preview

3. **Handle Formats**
   - Images: JPEG, PNG, GIF, WebP, SVG → convert to PNG/JPEG
   - Audio: MP3, WAV, WebM (from recording)
   - PDFs: Text extraction or image conversion
   - Text: 25+ formats (code, markdown, logs, etc.)

---

## Supported File Types

### Images (5 formats)
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`) - converts to PNG
- SVG (`.svg`) - converts to PNG with white background

### Audio (3 formats)
- MP3 (`.mp3`)
- WAV (`.wav`)
- WebM (`audio/webm`) - from live recording

### PDFs (1 format)
- PDF (`.pdf`) - text extraction OR image conversion

### Text (25+ formats)
Plain text, Markdown, JavaScript, TypeScript, Python, Java, C++, Go, Rust, Shell, JSON, YAML, XML, HTML, CSS, SQL, and more.

---

## UI Components Needed

### Attachment Button
- Paperclip icon
- Opens dropdown menu:
  - "Images" (disabled if no vision)
  - "Audio Files" (disabled if no audio)
  - "Text Files" (always enabled)
  - "PDF Files" (with warning if no vision)
- Shows count badge when files attached

### Microphone Button
- Microphone icon
- Toggle recording on/off
- Red indicator when recording
- Disabled if no audio support
- Browser permission required

### Attachment List (Pre-send)
- Horizontal scrollable row
- Thumbnail per file (64px height)
- Remove button (X) on hover
- Chevron scroll buttons (left/right)
- "View all" expands to full view

### Image Thumbnail
- Rounded corners with shadow
- Base64 preview
- Aspect ratio preserved
- Click opens full preview

### File Thumbnail
- Type badge (PDF, TXT, etc.)
- File name (truncated)
- Text preview (first 150 chars with fade)
- File size

### Full Preview Dialog
- Modal overlay
- Image: Full-size with object-contain
- PDF: Toggle tabs (Text/Pages)
- Text: Syntax-highlighted with language detection
- Audio: HTML5 audio player
- Close button (X)

---

## Upload Methods

### 1. Button Click
```typescript
// Invisible file input
<input type="file" 
  accept="image/*" 
  multiple 
  onChange={handleFiles} 
  ref={fileInputRef} 
/>

// Trigger via dropdown
function handleImageClick() {
  fileInputRef.current?.click();
}
```

### 2. Drag & Drop
```typescript
function handleDrop(event: DragEvent) {
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files);
  processFiles(files);
}
```

### 3. Paste from Clipboard
```typescript
function handlePaste(event: ClipboardEvent) {
  const items = event.clipboardData.items;
  const files = Array.from(items)
    .filter(item => item.kind === 'file')
    .map(item => item.getAsFile())
    .filter((file): file is File => file !== null);
  
  if (files.length > 0) {
    event.preventDefault();
    processFiles(files);
  }
}
```

### 4. Audio Recording
```typescript
// Start recording
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});
const recorder = new MediaRecorder(stream);

// Stop & save
recorder.stop();
const audioBlob = await getRecordedBlob();
const wavBlob = await convertToWav(audioBlob);
const file = new File([wavBlob], `recording-${Date.now()}.wav`);
```

---

## File Processing Pipeline

### Images
1. Read file as data URL: `FileReader.readAsDataURL()`
2. Check format: SVG or WebP?
3. If SVG: Convert to PNG via canvas
4. If WebP: Convert to PNG via canvas
5. Store: `{ preview: base64DataUrl, file: File }`

**SVG Conversion**:
```typescript
const img = new Image();
img.src = svgDataUrl;
img.onload = () => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 300;
  canvas.height = img.naturalHeight || 300;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white'; // Background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  resolve(canvas.toDataURL('image/png'));
};
```

### PDFs
**Text Extraction**:
```typescript
import * as pdfjs from 'pdfjs-dist';

const arrayBuffer = await file.arrayBuffer();
const pdf = await pdfjs.getDocument(arrayBuffer).promise;
let text = '';

for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const textContent = await page.getTextContent();
  text += textContent.items.map(item => item.str).join(' ') + '\n';
}
```

**Image Conversion** (for vision models):
```typescript
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport
  }).promise;
  
  images.push(canvas.toDataURL('image/png'));
}
```

### Text Files
```typescript
const textContent = await file.text(); // UTF-8 decode
store({ textContent, preview: textContent.slice(0, 150) });
```

### Audio Files
```typescript
const dataUrl = await readAsDataURL(file);
store({ preview: dataUrl, file });
```

---

## Capability Validation

### Check Model Capabilities
```typescript
const modelModalities = modelsStore.getModelModalities(selectedModelId);

// Validate images
if (hasImageAttachments && !modelModalities?.vision) {
  showWarning('Images require vision-capable model');
  disableImageButton();
}

// Validate audio
if (hasAudioAttachments && !modelModalities?.audio) {
  showWarning('Audio requires audio-capable model');
  disableAudioButton();
}
```

### Filter Files by Capability
```typescript
function filterByCapability(files: File[], capabilities: ModelCapabilities) {
  return files.filter(file => {
    const category = getFileCategory(file.type);
    
    switch (category) {
      case 'IMAGE':
        return capabilities.vision;
      case 'AUDIO':
        return capabilities.audio;
      case 'PDF':
      case 'TEXT':
        return true; // Always supported
      default:
        return false;
    }
  });
}
```

---

## API Format

### Message Content with Attachments
```typescript
{
  role: 'user',
  content: [
    { type: 'text', text: 'What is in this image?' },
    { 
      type: 'image_url', 
      image_url: { url: 'data:image/png;base64,iVBORw0KG...' }
    },
    {
      type: 'input_audio',
      input_audio: { 
        data: 'base64_audio_data',
        format: 'wav'
      }
    }
  ]
}
```

---

## Storage Format

### In Database
```typescript
interface DatabaseMessageExtra {
  type: 'IMAGE' | 'AUDIO' | 'PDF' | 'TEXT';
  name: string;
  base64Url?: string;      // Preview thumbnail
  base64Data?: string;     // Full file data
  content?: string;        // Text content
  images?: string[];       // PDF pages as PNG
  mimeType?: string;
  processedAsImages?: boolean;
}

// Stored in message.extra array
{
  id: 'msg-123',
  content: 'What is in this image?',
  extra: [
    {
      type: 'IMAGE',
      name: 'screenshot.png',
      base64Url: 'data:image/png;base64,...',
      mimeType: 'image/png'
    }
  ]
}
```

---

## Error Handling

### Unsupported Format
- Toast: "File type not supported: {type}"
- List supported formats
- Ignore file, don't block other uploads

### File Too Large
- No explicit frontend limit
- Server may reject (handle 413 error)
- Suggest: "File too large, try compressing"

### PDF Processing Failure
- Try text extraction first
- If fails: show error, offer to skip
- Don't block message send

### Audio Recording Failure
- Check browser support: `MediaRecorder` availability
- Request microphone permission
- Show error: "Microphone access denied"
- Fallback: File upload instead

### Capability Mismatch
- Warning icon on incompatible files
- Tooltip: "Model doesn't support {type}"
- Disable send button
- Suggest compatible model

---

## Testing Considerations

### Unit Tests
1. File type detection (MIME type → category)
2. SVG/WebP conversion (canvas rendering)
3. PDF text extraction (pdfjs)
4. Audio recording (MediaRecorder mock)
5. Capability validation logic

### Integration Tests
1. Upload flow: Select → Preview → Send
2. Drag-drop: Drop → Process → Display
3. Paste: Clipboard → Extract → Preview
4. Remove: Click X → File removed from list

### Visual Tests
1. Image thumbnails (various aspect ratios)
2. File thumbnails (long names, sizes)
3. Preview dialog (all file types)
4. Scrollable row (many attachments)

---

## Accessibility

### Keyboard Navigation
- Tab to attachment button
- Enter/Space to open menu
- Arrow keys to navigate menu
- Tab to file thumbnails
- Enter to open preview
- Escape to close preview

### Screen Reader
- Button: "Add attachments"
- Menu items: "Add images", "Record audio", etc.
- Thumbnails: "{filename}, {type}, {size}"
- Remove: "Remove {filename}"
- Recording: "Recording in progress"

### Focus Management
- Focus file input on menu select
- Return focus to button after upload
- Trap focus in preview dialog
- Focus remove button on thumbnail hover

---

## Responsive Design

### Desktop
- Single row layout (horizontal scroll)
- Thumbnails: 64px height
- Chevron buttons on hover
- Remove button on hover

### Mobile
- Single row (horizontal scroll)
- Thumbnails: 48px height  
- Touch scroll (no chevrons)
- Remove always visible
- Long-press for preview

---

_Updated: Phase attachments completed_
