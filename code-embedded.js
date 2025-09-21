// Flutter → Figma Plugin - Embedded HTML Version

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Flutter → Figma Converter</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      padding: 16px;
      margin: 0;
    }
    
    .container {
      max-width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .file-upload {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 32px 16px;
      text-align: center;
      margin-bottom: 16px;
      cursor: pointer;
      background: #fafafa;
    }
    
    .file-upload:hover {
      border-color: #0066cc;
      background: #f0f7ff;
    }
    
    .file-input {
      display: none;
    }
    
    .file-preview {
      display: none;
      background: #f8f9fa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .file-preview.show {
      display: block;
    }
    
    .progress-section {
      display: none;
      margin-bottom: 16px;
    }
    
    .progress-section.show {
      display: block;
    }
    
    .progress-bar {
      width: 100%;
      height: 4px;
      background: #e1e4e8;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .progress-fill {
      height: 100%;
      background: #0066cc;
      width: 0%;
      transition: width 0.3s ease;
    }
    
    .actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid #e1e4e8;
    }
    
    .btn {
      flex: 1;
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: #fff;
      color: #333;
      font-size: 12px;
      cursor: pointer;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background: #0066cc;
      color: #fff;
      border-color: #0066cc;
    }
    
    .validation-results {
      display: none;
      margin-bottom: 16px;
    }
    
    .validation-results.show {
      display: block;
    }
    
    .validation-item {
      display: flex;
      align-items: center;
      padding: 8px;
      margin-bottom: 4px;
      border-radius: 4px;
      font-size: 11px;
    }
    
    .validation-item.success {
      background: #d4edda;
      color: #155724;
    }
    
    .validation-item.warning {
      background: #fff3cd;
      color: #856404;
    }
    
    .validation-item.error {
      background: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Flutter → Figma Converter</h1>
      <p>Upload your Flutter/Dart files to generate Figma designs</p>
    </div>

    <div class="file-upload" id="fileUpload">
      <div>📄</div>
      <div>Drop your Dart files here or click to browse</div>
      <div style="font-size: 10px; color: #666; margin-top: 4px;">Supports .dart files up to 5MB</div>
    </div>
    
    <input type="file" id="fileInput" class="file-input" accept=".dart">

    <div class="file-preview" id="filePreview">
      <div><strong>File:</strong> <span id="fileName"></span></div>
      <div style="margin-top: 8px; font-size: 10px; color: #666;">Ready for conversion</div>
    </div>

    <div class="validation-results" id="validationResults"></div>

    <div class="progress-section" id="progressSection">
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div id="progressText" style="font-size: 11px; text-align: center;">Processing...</div>
    </div>

    <div class="actions">
      <button class="btn" id="clearBtn" disabled>Clear</button>
      <button class="btn btn-primary" id="convertBtn" disabled>Convert to Figma</button>
    </div>
  </div>

  <script>
    const fileInput = document.getElementById('fileInput');
    const fileUpload = document.getElementById('fileUpload');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const validationResults = document.getElementById('validationResults');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const clearBtn = document.getElementById('clearBtn');
    const convertBtn = document.getElementById('convertBtn');
    
    let currentFile = null;

    // File upload click
    fileUpload.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      handleFileSelect(e.target.files);
    });

    // Drag and drop
    fileUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUpload.style.borderColor = '#0066cc';
    });

    fileUpload.addEventListener('dragleave', () => {
      fileUpload.style.borderColor = '#ddd';
    });

    fileUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUpload.style.borderColor = '#ddd';
      handleFileSelect(e.dataTransfer.files);
    });

    // Button actions
    clearBtn.addEventListener('click', () => {
      clearFile();
    });

    convertBtn.addEventListener('click', () => {
      convertFile();
    });

    function handleFileSelect(files) {
      if (files.length === 0) return;
      
      const file = files[0];
      
      // Basic validation
      if (!file.name.endsWith('.dart')) {
        showValidation([{
          type: 'error',
          message: 'Only .dart files are supported'
        }]);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showValidation([{
          type: 'error',
          message: 'File size exceeds 5MB limit'
        }]);
        return;
      }
      
      currentFile = file;
      fileName.textContent = file.name;
      filePreview.classList.add('show');
      clearBtn.disabled = false;
      convertBtn.disabled = false;
      
      showValidation([{
        type: 'success',
        message: 'File loaded successfully'
      }]);
    }

    function showValidation(validations) {
      validationResults.innerHTML = '';
      
      validations.forEach(validation => {
        const item = document.createElement('div');
        item.className = 'validation-item ' + validation.type;
        item.textContent = validation.message;
        validationResults.appendChild(item);
      });
      
      validationResults.classList.add('show');
    }

    function showProgress(progress, text) {
      progressFill.style.width = progress + '%';
      progressText.textContent = text;
      progressSection.classList.add('show');
    }

    function hideProgress() {
      progressSection.classList.remove('show');
    }

    function clearFile() {
      currentFile = null;
      fileInput.value = '';
      filePreview.classList.remove('show');
      validationResults.classList.remove('show');
      hideProgress();
      clearBtn.disabled = true;
      convertBtn.disabled = true;
    }

    async function convertFile() {
      if (!currentFile) return;
      
      try {
        convertBtn.disabled = true;
        
        // Read file content
        const content = await readFileContent(currentFile);
        
        // Send to plugin for conversion
        parent.postMessage({
          pluginMessage: {
            type: 'convert-flutter-code',
            content: content,
            fileName: currentFile.name
          }
        }, '*');
        
      } catch (error) {
        showValidation([{
          type: 'error',
          message: 'Conversion failed: ' + error.message
        }]);
        convertBtn.disabled = false;
        hideProgress();
      }
    }

    function readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    }

    // Listen for messages from plugin
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      
      switch (message.type) {
        case 'conversion-progress':
          showProgress(message.progress, message.text);
          break;
        case 'conversion-complete':
          showProgress(100, 'Conversion complete!');
          convertBtn.disabled = false;
          setTimeout(() => hideProgress(), 2000);
          break;
        case 'error':
          showValidation([{
            type: 'error',
            message: message.message
          }]);
          convertBtn.disabled = false;
          hideProgress();
          break;
      }
    };
  </script>
</body>
</html>
`;

// Show the UI with embedded HTML
figma.showUI(htmlContent, { 
  width: 400, 
  height: 600,
  title: 'Flutter → Figma Converter'
});

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'convert-flutter-code':
        await handleFlutterCodeConversion(msg.content, msg.fileName);
        break;
      case 'close-plugin':
        figma.closePlugin();
        break;
      default:
        console.warn('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Plugin error:', error);
    figma.ui.postMessage({
      type: 'error',
      message: error.message || 'Unknown error occurred'
    });
  }
};

// Handle Flutter code conversion
async function handleFlutterCodeConversion(content, fileName) {
  try {
    // Send progress updates
    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: 10,
      text: 'Starting conversion...'
    });

    // Basic validation
    if (!content || content.trim().length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'File content is empty. Please select a valid Dart file.'
      });
      return;
    }

    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: 30,
      text: 'Parsing Flutter widgets...'
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    figma.ui.postMessage({
      type: 'conversion-progress',
      progress: 60,
      text: 'Creating Figma elements...'
    });

    // Create a demonstration frame
    const frame = figma.createFrame();
    frame.name = 'Flutter Conversion - ' + fileName;
    frame.resize(400, 300);
    frame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];

    // Add a text node to show it's working
    const textNode = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    textNode.characters = 'Converted from: ' + fileName + '\n\n' +
      'This is a demo conversion showing that the UI is working!\n\n' +
      'File size: ' + content.length + ' characters\n' +
      'Contains Flutter widgets: ' + (content.includes('Widget') ? 'Yes' : 'No') + '\n' +
      'Contains Container: ' + (content.includes('Container') ? 'Yes' : 'No') + '\n' +
      'Contains Text: ' + (content.includes('Text') ? 'Yes' : 'No');
    textNode.fontSize = 12;
    textNode.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
    textNode.x = 20;
    textNode.y = 20;
    textNode.resize(360, 200);

    frame.appendChild(textNode);
    figma.currentPage.appendChild(frame);

    // Select the created frame
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send completion message
    figma.ui.postMessage({
      type: 'conversion-complete',
      message: 'Demo conversion complete! The UI is now working correctly.'
    });

  } catch (error) {
    console.error('Conversion error:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Conversion failed: ' + (error.message || 'Unknown error')
    });
  }
}