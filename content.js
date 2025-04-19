// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getProblemDetails') {
    const problemDetails = extractProblemDetails();
    sendResponse({problemDetails: problemDetails});
  }
  else if (request.action === 'getCurrentCode') {
    const code = extractCurrentCode();
    sendResponse({code: code});
  }
  else if (request.action === 'insertCode') {
    const success = insertCodeToEditor(request.code);
    sendResponse({success: success});
  }
  else if (request.action === 'getTestCases') {
    const testCases = extractTestCases();
    sendResponse({testCases: testCases});
  }
  else if (request.action === 'getSubmissionResults') {
    const results = extractSubmissionResults();
    sendResponse({results: results});
  }

  // Return true to indicate we will send a response asynchronously
  return true;
});

/**
 * Extract problem details from the LeetCode page
 */
function extractProblemDetails() {
  try {
    // Extract problem title
    const titleElement = document.querySelector('[data-cy="question-title"]');
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Problem';

    // Extract problem ID and slug
    const urlPath = window.location.pathname;
    const problemSlug = urlPath.split('/problems/')[1]?.split('/')[0] || '';
    const problemId = document.querySelector('.mr-4 .text-label-1')?.textContent || '';

    // Extract difficulty
    const difficultyElement = document.querySelector('[diff]') || document.querySelector('.relative.inline-flex.items-center.justify-center.text-caption.px-2.py-1.gap-1.rounded-full.bg-fill-secondary');
    let difficulty = 'Unknown';
    if (difficultyElement) {
      const diffText = difficultyElement.textContent.trim();
      if (diffText.includes('Easy')) difficulty = 'Easy';
      else if (diffText.includes('Medium')) difficulty = 'Medium';
      else if (diffText.includes('Hard')) difficulty = 'Hard';
      else difficulty = diffText;
    }

    // Extract problem description
    const descriptionElement = document.querySelector('[data-cy="question-content"]') || document.querySelector('.elfjS');
    const description = descriptionElement ? descriptionElement.textContent.trim() : 'No description available';

    // Extract examples
    const examples = [];
    const exampleBlocks = document.querySelectorAll('[data-cy="question-content"] pre') || document.querySelectorAll('.elfjS pre');
    exampleBlocks.forEach((block, index) => {
      examples.push({
        id: index + 1,
        content: block.textContent.trim()
      });
    });

    // Extract constraints
    let constraintsText = '';
    if (description.includes('Constraints:')) {
      const constraintsPart = description.split('Constraints:')[1];
      constraintsText = constraintsPart.split('Follow-up:')[0].trim();
    }

    // Extract topics/tags
    const topics = [];
    const topicElements = document.querySelectorAll('a[href^="/tag/"]');
    topicElements.forEach(element => {
      topics.push(element.textContent.trim());
    });

    // Extract function signature and starter code
    const codeEditorContent = extractCodeEditorContent();
    const { functionSignature, starterCode } = parseCodeEditorContent(codeEditorContent);

    return {
      id: problemId,
      slug: problemSlug,
      title,
      difficulty,
      description,
      examples,
      constraints: constraintsText,
      topics,
      functionSignature,
      starterCode
    };
  } catch (error) {
    console.error('Error extracting problem details:', error);
    return null;
  }
}

/**
 * Extract the content from the code editor
 */
function extractCodeEditorContent() {
  // Try multiple selectors to find the code editor
  const editorSelectors = [
    '.monaco-editor .view-lines',
    '.CodeMirror-code',
    '[data-mode-id]',
    '.view-lines'
  ];

  for (const selector of editorSelectors) {
    const editorElement = document.querySelector(selector);
    if (editorElement) {
      return editorElement.textContent;
    }
  }

  // Fallback to getting all monaco editor content
  const monacoEditors = document.querySelectorAll('.monaco-editor');
  if (monacoEditors.length > 0) {
    return monacoEditors[0].textContent;
  }

  return '';
}

/**
 * Parse the code editor content to extract function signature and starter code
 */
function parseCodeEditorContent(content) {
  if (!content) return { functionSignature: '', starterCode: '' };

  const lines = content.split('\n').filter(line => line.trim() !== '');
  let functionSignature = '';

  // Look for function signature based on language patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // JavaScript/TypeScript function
    if (line.includes('function') && line.includes('(')) {
      functionSignature = line;
      break;
    }
    // Python def
    else if (line.startsWith('def ') && line.includes('(')) {
      functionSignature = line;
      break;
    }
    // Java/C++ method
    else if ((line.includes('public') || line.includes('private') || line.includes('protected')) &&
             line.includes('(') && !line.includes(';')) {
      functionSignature = line;
      break;
    }
    // C++ class method
    else if (line.includes('class') && lines[i+1] && lines[i+1].includes('public:')) {
      for (let j = i+1; j < lines.length; j++) {
        if (lines[j].includes('(') && !lines[j].includes(';') &&
            !lines[j].includes('public:') && !lines[j].includes('private:')) {
          functionSignature = lines[j].trim();
          break;
        }
      }
      if (functionSignature) break;
    }
  }

  return {
    functionSignature,
    starterCode: lines.join('\n')
  };
}

/**
 * Extract current code from the editor
 */
function extractCurrentCode() {
  try {
    // Try to get code from Monaco editor
    const editorContent = extractCodeEditorContent();
    if (editorContent) {
      return editorContent;
    }

    // Try to find the textarea or pre element that contains the code
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.length > 0) {
        return textarea.value;
      }
    }

    // Try to find code in the DOM structure specific to LeetCode
    const codeLines = document.querySelectorAll('.view-line');
    if (codeLines.length > 0) {
      return Array.from(codeLines).map(line => line.textContent).join('\n');
    }

    return '';
  } catch (error) {
    console.error('Error extracting current code:', error);
    return '';
  }
}

/**
 * Extract test cases from the LeetCode page
 */
function extractTestCases() {
  try {
    const testCases = [];

    // Try to find test cases in the testcase tab
    const testcaseInputs = document.querySelectorAll('[data-e2e-locator="console-testcase-input"]');
    if (testcaseInputs.length > 0) {
      const testCase = {};
      testcaseInputs.forEach(input => {
        const label = input.closest('.flex.h-full.w-full.flex-col.space-y-2')?.querySelector('.text-xs.font-medium')?.textContent;
        if (label) {
          const key = label.replace('=', '').trim();
          testCase[key] = input.textContent.trim();
        }
      });

      if (Object.keys(testCase).length > 0) {
        testCases.push(testCase);
      }
    }

    // Try to find test cases in the examples
    const examples = document.querySelectorAll('.example');
    examples.forEach(example => {
      const inputs = example.querySelectorAll('strong:contains("Input:")');
      const outputs = example.querySelectorAll('strong:contains("Output:")');

      for (let i = 0; i < inputs.length; i++) {
        const inputText = inputs[i].nextSibling?.textContent.trim();
        const outputText = outputs[i]?.nextSibling?.textContent.trim();

        if (inputText && outputText) {
          testCases.push({
            input: inputText,
            output: outputText
          });
        }
      }
    });

    return testCases;
  } catch (error) {
    console.error('Error extracting test cases:', error);
    return [];
  }
}

/**
 * Extract submission results from the LeetCode page
 */
function extractSubmissionResults() {
  try {
    // Try to find submission results
    const resultElement = document.querySelector('[data-e2e-locator="console-result"]');
    if (resultElement) {
      const result = resultElement.textContent.trim();

      // Check for success or error messages
      const isSuccess = result.includes('Accepted') || result.includes('Success');
      const isError = result.includes('Error') || result.includes('Wrong Answer');

      // Get detailed error message if available
      const errorDetails = document.querySelector('.text-red-60') || document.querySelector('.text-red-s');
      const errorMessage = errorDetails ? errorDetails.textContent.trim() : '';

      // Get runtime and memory usage if available
      const runtimeElement = document.querySelector('div:contains("Runtime:")');
      const memoryElement = document.querySelector('div:contains("Memory:")');

      const runtime = runtimeElement ? runtimeElement.textContent.trim() : '';
      const memory = memoryElement ? memoryElement.textContent.trim() : '';

      return {
        status: isSuccess ? 'success' : (isError ? 'error' : 'unknown'),
        message: result,
        errorDetails: errorMessage,
        runtime,
        memory
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting submission results:', error);
    return null;
  }
}

/**
 * Insert code into the LeetCode editor
 */
function insertCodeToEditor(code) {
  try {
    // Try multiple approaches to insert code into the editor

    // 1. Try to find the textarea and update its value
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.length > 0) {
        // Save the original value in case we need to restore it
        const originalValue = textarea.value;

        // Update the textarea value
        textarea.value = code;

        // Dispatch input event to trigger Monaco editor update
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);

        // If successful, return true
        return true;
      }
    }

    // 2. Try to use Monaco editor's model if available
    if (window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getEditors();
      if (editors.length > 0) {
        const model = editors[0].getModel();
        if (model) {
          const fullRange = model.getFullModelRange();
          editors[0].executeEdits('extension', [{
            range: fullRange,
            text: code
          }]);
          return true;
        }
      }
    }

    // 3. Try to use document.execCommand as a fallback
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(code));
      return true;
    }

    // 4. Try to find the editor element and simulate typing
    const editorElement = document.querySelector('.monaco-editor');
    if (editorElement) {
      // Focus the editor
      editorElement.click();

      // Try to select all existing text (Ctrl+A)
      const selectAllEvent = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
        bubbles: true
      });
      editorElement.dispatchEvent(selectAllEvent);

      // Simulate pasting the code
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', code);

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: clipboardData,
        bubbles: true
      });
      editorElement.dispatchEvent(pasteEvent);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error inserting code:', error);
    return false;
  }
}
