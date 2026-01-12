# Feature: File Attachments

> **Source Reference Base Path**:
> `$webui-folder = /Users/amir36/Documents/workspace/src/github.com/ggml-org/llama.cpp/tools/server/webui`

> Priority: 3 | Status: Core Feature | **Implementation: ❌ Not Started**

---

## Overview

File attachment system enables users to upload images, PDFs, audio files, and text documents with chat messages. Supports drag-drop, paste, and button upload with automatic format conversion and capability validation.

---

## User Stories

- ❌ **As a user**, I can upload images to my message so that the AI can see and analyze visual content

- ❌ **As a user**, I can drag-and-drop files onto the chat area so that uploading is quick and intuitive

- ❌ **As a user**, I can paste images from clipboard so that I can share screenshots easily

- ❌ **As a user**, I can record audio directly from microphone so that I can send voice messages

- ❌ **As a user**, I can upload PDFs and text files so that the AI can read document content

- ❌ **As a user**, I can preview attachments before sending so that I verify the correct files

- ❌ **As a user**, I can remove attachments if I change my mind so that I control what gets sent

- ❌ **As a user**, the system prevents incompatible files so that I don't send images to text-only models

---

## Functional Requirements

### Upload Methods

**Behavior**: Multiple ways to attach files
- **Button click**: Attachment button → dropdown menu → select file type → file picker dialog
- **Drag & drop**: Drag files onto chat area → drop → automatic processing
- **Paste**: Ctrl/Cmd+V with file in clipboard → automatic processing
- **Audio recording**: Click microphone button → toggle recording → save as WAV file

**Edge Cases**:
- Unsupported file type → Show error toast, ignore file
- Multiple files at once → Process all valid files
- File too large → Server rejects (handle 413 error)

### File Type Support

**Images** (5 formats):
- JPEG, PNG, GIF → Use as-is
- WebP, SVG → Auto-convert to PNG

**Audio** (3 formats):
- MP3, WAV → Use as-is
- WebM → From live recording

**PDFs**:
- Text extraction for text models
- Image conversion for vision models

**Text** (25+ formats):
- Plain text, Markdown, code files, JSON, YAML, XML, HTML, CSS, etc.

### Attachment Preview

**Behavior**: Show previews before sending
- **Images**: Thumbnail with aspect ratio preserved
- **PDFs**: Icon with page count
- **Text**: First 150 characters with ellipsis
- **Audio**: Audio player icon
- Horizontal scrollable row (single-row layout)
- Remove button (X) on each thumbnail

**Actions**:
- Click thumbnail → Open full preview dialog
- Click remove (X) → Remove from list
- "Clear all" → Remove all attachments

### Full Preview Dialog

**Behavior**: Modal overlay showing full content
- **Images**: Full-size with object-contain, zoom support
- **PDFs**: Toggle tabs (Text view | Pages view)
- **Text**: Syntax-highlighted with language detection
- **Audio**: HTML5 audio player with controls
- Close button (X) or Escape key to dismiss

### Capability Validation

**Behavior**: System validates model compatibility
- If model lacks vision → Disable image upload, show warning
- If model lacks audio → Disable audio recording, show warning
- If PDF with images + text model → Show warning, suggest vision model
- Incompatible files → Warning icon, tooltip explaining issue
- Send button disabled if incompatible files present

**Edge Cases**:
- User switches model after attaching files → Re-validate capabilities
- Model capabilities unknown → Assume incompatible (safe default)

### File Processing

**Behavior**: Automatic format conversion where needed
- **SVG → PNG**: Render to canvas with white background, convert to PNG
- **WebP → PNG**: Load image, render to canvas, export as PNG
- **PDF text extraction**: Use pdfjs-dist to extract text from all pages
- **PDF image conversion**: Render each page to canvas at 1.5x scale, export as PNG
- **Text files**: Read as UTF-8 text
- **Audio files**: Store as base64 data URL

**Edge Cases**:
- PDF text extraction fails → Offer image conversion or skip
- Canvas rendering fails → Show error, allow retry
- Invalid file data → Show error, ignore file

---

## Data Model

**Attachment Entity** (pre-send):
- `file` (File): Original browser File object
- `type` (enum): IMAGE | AUDIO | PDF | TEXT
- `preview` (string): Base64 data URL for thumbnail
- `content` (string, optional): Extracted text content

**DatabaseMessageExtra** (post-send, stored):
- `type` (enum): IMAGE | AUDIO | PDF | TEXT
- `name` (string): Filename
- `base64Url` (string, optional): Preview thumbnail
- `base64Data` (string, optional): Full file data
- `content` (string, optional): Text content
- `images` (array, optional): PDF pages as PNG base64
- `mimeType` (string, optional): Original MIME type
- `processedAsImages` (boolean, optional): Whether PDF was converted to images

**Storage**: Attachments stored in `message.extra` array in IndexedDB

---

## Acceptance Criteria

### Scenario: Upload image via button

- **GIVEN** model supports vision
- **WHEN** user clicks attachment button
- **THEN** dropdown menu appears
- **WHEN** user clicks "Images"
- **THEN** file picker opens filtered to image types
- **WHEN** user selects image file
- **THEN** thumbnail appears in attachment list
- **AND** image is processed to base64

### Scenario: Drag and drop multiple files

- **GIVEN** user has multiple files selected
- **WHEN** user drags files onto chat area
- **THEN** drop zone highlight appears
- **WHEN** user drops files
- **THEN** all valid files are processed
- **AND** thumbnails appear for each file
- **AND** unsupported files show error toast

### Scenario: Paste image from clipboard

- **GIVEN** user has image in clipboard
- **WHEN** user presses Ctrl/Cmd+V in textarea
- **THEN** image is extracted from clipboard
- **AND** thumbnail appears in attachment list
- **AND** paste event is handled (not inserted as text)

### Scenario: Record audio

- **GIVEN** model supports audio
- **WHEN** user clicks microphone button
- **THEN** browser requests microphone permission
- **WHEN** permission granted and recording starts
- **THEN** microphone button shows red indicator
- **WHEN** user clicks button again to stop
- **THEN** recording saves as WAV file
- **AND** audio thumbnail appears with player

### Scenario: Prevent incompatible upload

- **GIVEN** model does NOT support vision
- **WHEN** user clicks attachment button
- **THEN** "Images" option is disabled in dropdown
- **AND** tooltip shows "Model doesn't support vision"
- **WHEN** user tries to paste image
- **THEN** warning toast appears
- **AND** image is not attached

### Scenario: Remove attachment

- **GIVEN** user has attached files
- **WHEN** user hovers over thumbnail
- **THEN** remove button (X) appears
- **WHEN** user clicks remove button
- **THEN** attachment is removed from list
- **AND** preview is cleared from memory

### Scenario: Preview PDF as text

- **GIVEN** user attached PDF file
- **WHEN** user clicks PDF thumbnail
- **THEN** preview dialog opens
- **AND** "Text" tab is selected by default
- **AND** extracted text content is displayed
- **WHEN** user clicks "Pages" tab
- **THEN** PDF pages render as images in scrollable view

### Scenario: Switch model after attaching

- **GIVEN** user attached image with vision model selected
- **WHEN** user switches to text-only model
- **THEN** image attachment shows warning icon
- **AND** tooltip says "Model doesn't support vision"
- **AND** send button is disabled

---

## API Integration

### Message Content Format with Attachments

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

### Storage Format in IndexedDB

```typescript
interface DatabaseMessageExtra {
  type: 'IMAGE' | 'AUDIO' | 'PDF' | 'TEXT';
  name: string;
  base64Url?: string;      // Preview thumbnail
  base64Data?: string;     // Full file data
  content?: string;        // Text content (for PDFs, text files)
  images?: string[];       // PDF pages as PNG base64
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

## Reference Implementation

> **Svelte Source**: llama.cpp webui uses Svelte 5 for attachment handling. Adapt to React patterns.

**Key Files**:
- `$webui-folder/src/lib/components/app/chat/ChatAttachments/` - Attachment UI components
- `$webui-folder/src/lib/utils/attachments.ts` - File processing utilities
- `$webui-folder/src/lib/stores/chat.svelte.ts` - Attachment state management

> **Note**: Svelte patterns (`$state`, `$effect`) should be adapted to React (`useState`, `useEffect`).

### File Upload Methods

**Button Click**:
```
1. Hidden <input type="file" /> with accept filter
2. Dropdown menu triggers fileInputRef.current.click()
3. onChange event → processFiles(event.target.files)
```

**Drag & Drop**:
```
1. onDrop event → event.preventDefault()
2. Extract files from event.dataTransfer.files
3. Filter and process valid files
```

**Paste**:
```
1. onPaste event in textarea
2. Extract items from event.clipboardData.items
3. Filter kind='file', get File objects
4. Prevent default paste if files found
```

**Audio Recording**:
```
1. Request microphone: navigator.mediaDevices.getUserMedia()
2. Create MediaRecorder with audio settings
3. Collect audio data in chunks
4. On stop: combine chunks → Blob → convert to WAV → File object
```

See `$webui-folder/src/lib/components/app/chat/ChatForm/ChatForm.svelte` for upload implementations.

### File Processing Algorithms

**SVG/WebP to PNG Conversion**:
```
1. Create Image element, set src to file data URL
2. On image load: create canvas with image dimensions
3. Fill canvas with white background
4. Draw image onto canvas
5. Export canvas.toDataURL('image/png')
```

**PDF Text Extraction**:
```
1. Load PDF: pdfjs.getDocument(arrayBuffer).promise
2. For each page (1 to numPages):
   - Get page: pdf.getPage(i)
   - Get text: page.getTextContent()
   - Extract strings: textContent.items.map(item => item.str)
3. Concatenate all page text
```

**PDF to Images** (for vision models):
```
1. For each PDF page:
   - Get viewport at 1.5x scale
   - Create canvas sized to viewport
   - Render page to canvas
   - Export canvas.toDataURL('image/png')
2. Store array of PNG base64 strings
```

See `$webui-folder/src/lib/utils/attachments.ts` for processing utilities.

### Capability Validation

```
1. Get model modalities from model store
2. Check file type:
   - IMAGE → requires vision=true
   - AUDIO → requires audio=true
   - PDF, TEXT → always allowed
3. If required capability missing:
   - Disable upload button
   - Show warning icon on file
   - Add tooltip explaining incompatibility
```

---

## UI Components

### Attachment Button
- Paperclip icon + count badge (if files attached)
- Dropdown menu with file type options (disabled based on capabilities)

### Microphone Button
- Microphone icon, red indicator when recording
- Disabled if model lacks audio support

### Attachment List
- Horizontal scrollable row, 64px thumbnails
- Remove button (X) on hover/always (mobile)
- "View all" button if many files

### Preview Dialog
- Modal overlay with file-specific content
- Close button, Escape key to dismiss

---

## Accessibility

**Keyboard Navigation**:
- Tab to attachment button, Enter to open menu
- Arrow keys to navigate menu, Enter to select
- Tab through thumbnails, Enter to preview
- Escape to close preview

**Screen Reader**:
- Button: "Add attachments, {count} attached"
- Menu items: "Add images", "Record audio" (with disabled state)
- Thumbnails: "{filename}, {type}, {size}"
- Remove: "Remove {filename}"

---

## Responsive Design

| Breakpoint | Thumbnail Size | Remove Button | Scroll |
|------------|----------------|---------------|--------|
| Desktop (>768px) | 64px | On hover | Chevron buttons |
| Mobile (<768px) | 48px | Always visible | Touch scroll |

---

## Verification

**Manual Testing**:
1. Click attachment button → Select image → Verify thumbnail appears
2. Drag multiple files onto chat → Verify all valid files processed
3. Copy image → Paste in textarea → Verify image attached
4. Click microphone → Record audio → Stop → Verify audio file created
5. Attach image with text-only model → Verify warning + disabled send
6. Click thumbnail → Verify preview dialog opens with correct content
7. Remove attachment → Verify removed from list
8. Attach PDF → Preview → Toggle Text/Pages tabs → Verify both views work

---

_Updated: Revised for functional focus, reduced code ratio_
