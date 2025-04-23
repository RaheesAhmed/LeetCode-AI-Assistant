// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getProblemDetails") {
    const problemDetails = extractProblemDetails();
    sendResponse({ problemDetails: problemDetails });
  } else if (request.action === "getCurrentCode") {
    const code = extractCurrentCode();
    sendResponse({ code: code });
  } else if (request.action === "insertCode") {
    const success = insertCodeToEditor(request.code);
    sendResponse({ success: success });
  } else if (request.action === "getTestCases") {
    const testCases = extractTestCases();
    sendResponse({ testCases: testCases });
  } else if (request.action === "getSubmissionResults") {
    const results = extractSubmissionResults();
    sendResponse({ results: results });
  } else if (request.action === "showNotification") {
    showNotification(request.message, request.type || "info");
    sendResponse({ success: true });
  }

  // Return true to indicate we will send a response asynchronously
  return true;
});

// Inject floating chat button when the page loads
document.addEventListener("DOMContentLoaded", injectFloatingButton);
// Also try to inject it now in case DOMContentLoaded already fired
injectFloatingButton();

/**
 * Injects a floating chat button at the bottom of the page
 */
function injectFloatingButton() {
  // Only inject on LeetCode problem pages
  if (!window.location.href.includes("leetcode.com/problems/")) {
    return;
  }

  // Check if the button already exists to avoid duplicates
  if (document.getElementById("leetcode-ai-assistant-button")) {
    return;
  }

  // Create the floating button
  const floatingButton = document.createElement("div");
  floatingButton.id = "leetcode-ai-assistant-button";
  floatingButton.innerHTML = `
    <div class="leetcode-ai-button-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c.83 0 1.5.67 1.5 1.5S12.83 8 12 8s-1.5-.67-1.5-1.5S11.17 5 12 5zm5 10.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-10 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
    </div>
    <span class="leetcode-ai-tooltip">LeetCode AI Assistant</span>
  `;

  // Add styles
  const styles = document.createElement("style");
  styles.textContent = `
    #leetcode-ai-assistant-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0a84ff, #3c52cc);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);
      z-index: 9999;
      transition: all 0.3s ease;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    
    #leetcode-ai-assistant-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(10, 132, 255, 0.4);
    }
    
    #leetcode-ai-assistant-button:active {
      transform: scale(0.95);
    }
    
    #leetcode-ai-assistant-button:hover .leetcode-ai-tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
      visibility: visible;
    }
    
    .leetcode-ai-button-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }
    
    .leetcode-ai-tooltip {
      position: absolute;
      top: -45px;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      background-color: #333;
      color: white;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      pointer-events: none;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .leetcode-ai-tooltip:after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #333;
    }
    
    @media (max-width: 768px) {
      #leetcode-ai-assistant-button {
        bottom: 15px;
        right: 15px;
        width: 50px;
        height: 50px;
      }
      
      .leetcode-ai-button-icon {
        width: 28px;
        height: 28px;
      }
    }
  `;

  // Append elements to the body
  document.body.appendChild(styles);
  document.body.appendChild(floatingButton);

  // Add click event listener
  floatingButton.addEventListener("click", openAIAssistant);
}

/**
 * Opens the AI Assistant popup
 */
function openAIAssistant() {
  // Create a custom event that will be handled by the extension
  chrome.runtime.sendMessage({ action: "openPopup" });

  // Also provide a visual feedback for the click
  const button = document.getElementById("leetcode-ai-assistant-button");
  if (button) {
    button.style.transform = "scale(0.9)";
    setTimeout(() => {
      button.style.transform = "";
    }, 200);
  }
}

/**
 * Extract problem details from the LeetCode page
 */
function extractProblemDetails() {
  try {
    // Extract problem title - Updated with multiple selector attempts
    let titleElement = document.querySelector('[data-cy="question-title"]');

    // If the standard selector doesn't work, try alternate selectors
    if (!titleElement || !titleElement.textContent) {
      // Try to find the title in the new UI structure
      titleElement = document.querySelector(".text-title-large a");

      // Additional fallbacks
      if (!titleElement || !titleElement.textContent) {
        titleElement = document.querySelector(
          'div[class*="title"] a[href*="/problems/"]'
        );
      }

      if (!titleElement || !titleElement.textContent) {
        const headings = document.querySelectorAll("h1, h2, h3, h4");
        for (const heading of headings) {
          if (heading.textContent && heading.textContent.includes(".")) {
            titleElement = heading;
            break;
          }
        }
      }
    }

    const title = titleElement
      ? titleElement.textContent.trim()
      : "Unknown Problem";

    // Extract problem ID and slug
    const urlPath = window.location.pathname;
    const problemSlug = urlPath.split("/problems/")[1]?.split("/")[0] || "";
    const problemId =
      document.querySelector(".mr-4 .text-label-1")?.textContent || "";

    // Extract difficulty
    let difficultyElement =
      document.querySelector("[diff]") ||
      document.querySelector(
        ".relative.inline-flex.items-center.justify-center.text-caption.px-2.py-1.gap-1.rounded-full.bg-fill-secondary"
      );

    // Additional selectors for difficulty
    if (!difficultyElement) {
      // Try newer UI selectors
      difficultyElement = document.querySelector("[data-difficulty]");

      if (!difficultyElement) {
        // Look for text containing difficulty keywords
        const difficultyTexts = ["Easy", "Medium", "Hard"];
        const allElements = document.querySelectorAll("div, span");

        for (const element of allElements) {
          const text = element.textContent.trim();
          if (difficultyTexts.some((diff) => text === diff)) {
            difficultyElement = element;
            break;
          }
        }
      }
    }

    let difficulty = "Unknown";
    if (difficultyElement) {
      const diffText = difficultyElement.textContent.trim();
      if (diffText.includes("Easy") || diffText === "Easy") difficulty = "Easy";
      else if (diffText.includes("Medium") || diffText === "Medium")
        difficulty = "Medium";
      else if (diffText.includes("Hard") || diffText === "Hard")
        difficulty = "Hard";
      else difficulty = diffText;
    }

    // Extract problem description
    let descriptionElement =
      document.querySelector('[data-cy="question-content"]') ||
      document.querySelector(".elfjS");

    // Additional selectors for description
    if (!descriptionElement || !descriptionElement.textContent) {
      // Try newer UI selectors
      descriptionElement = document.querySelector(".description");

      if (!descriptionElement) {
        // Try to find content div near the title
        const contentContainer = document.querySelector(
          'div[class*="content"]'
        );
        if (contentContainer) {
          // Find the main content area that's likely to contain the description
          const contentDivs =
            contentContainer.querySelectorAll("div > div > div");
          for (const div of contentDivs) {
            // Look for a div with substantial text content
            if (
              div.textContent &&
              div.textContent.length > 100 &&
              !div.querySelector("textarea, input")
            ) {
              descriptionElement = div;
              break;
            }
          }
        }
      }

      // Last resort - find the largest text block after the title
      if (!descriptionElement && titleElement) {
        const allParagraphs = document.querySelectorAll("p");
        let largestTextBlock = null;
        let maxLength = 0;

        for (const p of allParagraphs) {
          if (p.textContent && p.textContent.length > maxLength) {
            largestTextBlock = p;
            maxLength = p.textContent.length;
          }
        }

        if (largestTextBlock && maxLength > 50) {
          descriptionElement = largestTextBlock;
        }
      }
    }

    const description = descriptionElement
      ? descriptionElement.textContent.trim()
      : "No description available";

    // Extract examples
    const examples = [];
    const exampleBlocks =
      document.querySelectorAll('[data-cy="question-content"] pre') ||
      document.querySelectorAll(".elfjS pre");
    exampleBlocks.forEach((block, index) => {
      examples.push({
        id: index + 1,
        content: block.textContent.trim(),
      });
    });

    // Extract constraints
    let constraintsText = "";
    if (description.includes("Constraints:")) {
      const constraintsPart = description.split("Constraints:")[1];
      constraintsText = constraintsPart.split("Follow-up:")[0].trim();
    }

    // Extract topics/tags
    const topics = [];
    const topicElements = document.querySelectorAll('a[href^="/tag/"]');
    topicElements.forEach((element) => {
      topics.push(element.textContent.trim());
    });

    // Extract function signature and starter code
    const codeEditorContent = extractCodeEditorContent();
    const { functionSignature, starterCode, language } =
      parseCodeEditorContent(codeEditorContent);

    // Create the final result object
    const problemDetails = {
      id: problemId,
      slug: problemSlug,
      title,
      difficulty,
      description,
      examples,
      constraints: constraintsText,
      topics,
      functionSignature,
      starterCode,
      language,
    };

    // Add debug logging
    console.log("LeetCode AI Assistant - Extracted problem details:", {
      title,
      difficulty,
      language,
      description: description.substring(0, 100) + "...", // Truncate for logging
    });

    return problemDetails;
  } catch (error) {
    console.error("Error extracting problem details:", error);
    // Log the error details for debugging
    console.error("Error stack:", error.stack);
    return null;
  }
}

/**
 * Extract the content from the code editor
 */
function extractCodeEditorContent() {
  // Try multiple selectors to find the code editor
  const editorSelectors = [
    ".monaco-editor .view-lines",
    ".CodeMirror-code",
    "[data-mode-id]",
    ".view-lines",
  ];

  for (const selector of editorSelectors) {
    const editorElement = document.querySelector(selector);
    if (editorElement) {
      return editorElement.textContent;
    }
  }

  // Fallback to getting all monaco editor content
  const monacoEditors = document.querySelectorAll(".monaco-editor");
  if (monacoEditors.length > 0) {
    return monacoEditors[0].textContent;
  }

  return "";
}

/**
 * Parse the code editor content to extract function signature and starter code
 */
function parseCodeEditorContent(content) {
  if (!content) return { functionSignature: "", starterCode: "", language: "" };

  const lines = content.split("\n").filter((line) => line.trim() !== "");
  let functionSignature = "";
  let language = "";

  // Look for function signature based on language patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // JavaScript/TypeScript function
    if (line.includes("function") && line.includes("(")) {
      functionSignature = line;
      language = "javascript";
      break;
    }
    // Python def
    else if (line.startsWith("def ") && line.includes("(")) {
      functionSignature = line;
      language = "python";
      break;
    }
    // Java/C++ method
    else if (
      (line.includes("public") ||
        line.includes("private") ||
        line.includes("protected")) &&
      line.includes("(") &&
      !line.includes(";")
    ) {
      // Distinguish between Java and C++
      if (line.includes("->")) {
        language = "cpp";
      } else {
        language = "java";
      }
      functionSignature = line;
      break;
    }
    // C++ class method
    else if (
      line.includes("class") &&
      lines[i + 1] &&
      lines[i + 1].includes("public:")
    ) {
      language = "cpp";
      for (let j = i + 1; j < lines.length; j++) {
        if (
          lines[j].includes("(") &&
          !lines[j].includes(";") &&
          !lines[j].includes("public:") &&
          !lines[j].includes("private:")
        ) {
          functionSignature = lines[j].trim();
          break;
        }
      }
      if (functionSignature) break;
    }
  }

  // If we still couldn't determine the language, try to guess based on content
  if (!language) {
    if (
      content.includes("function") &&
      (content.includes("var") ||
        content.includes("let") ||
        content.includes("const"))
    ) {
      language = "javascript";
    } else if (content.includes("def ") && content.includes("return")) {
      language = "python";
    } else if (
      content.includes("public class") ||
      content.includes("private class")
    ) {
      language = "java";
    } else if (content.includes("cout") || content.includes("vector<")) {
      language = "cpp";
    }
  }

  // Check active tab/button if language still not determined
  if (!language) {
    // Check for language tabs/buttons in the DOM
    const activeTab =
      document.querySelector(".language-btn.selected") ||
      document.querySelector('[data-cy="code-tab"][aria-selected="true"]');
    if (activeTab) {
      const tabText = activeTab.textContent.toLowerCase();
      if (tabText.includes("javascript")) language = "javascript";
      else if (tabText.includes("python")) language = "python";
      else if (tabText.includes("java")) language = "java";
      else if (tabText.includes("c++")) language = "cpp";
    }
  }

  return {
    functionSignature,
    starterCode: lines.join("\n"),
    language: language || "unknown", // Default to unknown if we couldn't detect
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
    const textareas = document.querySelectorAll("textarea");
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.length > 0) {
        return textarea.value;
      }
    }

    // Try to find code in the DOM structure specific to LeetCode
    const codeLines = document.querySelectorAll(".view-line");
    if (codeLines.length > 0) {
      return Array.from(codeLines)
        .map((line) => line.textContent)
        .join("\n");
    }

    return "";
  } catch (error) {
    console.error("Error extracting current code:", error);
    return "";
  }
}

/**
 * Extract test cases from the LeetCode page
 */
function extractTestCases() {
  try {
    const testCases = [];

    // Try to find test cases in the testcase tab (new UI?)
    const testcaseTab = document.querySelector(
      '[data-e2e-locator="console-tab-testcase"]'
    );
    if (testcaseTab) {
      const testcaseInputs = document.querySelectorAll(
        '[data-e2e-locator="console-testcase-input"]'
      );
      if (testcaseInputs.length > 0) {
        const testCase = {};
        testcaseInputs.forEach((inputElement) => {
          try {
            // Find the label associated with the input
            const container = inputElement.closest(
              ".flex.h-full.w-full.flex-col.space-y-2"
            );
            const labelElement = container
              ? container.querySelector(".text-xs.font-medium")
              : null;

            if (labelElement) {
              const key = labelElement.textContent.replace("=", "").trim();
              testCase[key] = inputElement.textContent.trim();
            } else {
              console.warn(
                "Could not find label for testcase input:",
                inputElement
              );
            }
          } catch (labelError) {
            console.error(
              "Error processing single testcase input:",
              labelError,
              inputElement
            );
          }
        });

        if (Object.keys(testCase).length > 0) {
          testCases.push(testCase);
        }
      }
    }

    // Try to find test cases in the description's examples (older UI / problem view)
    const exampleContainer =
      document.querySelector('[data-cy="question-content"]') ||
      document.querySelector(".elfjS");
    if (exampleContainer) {
      const examples = exampleContainer.querySelectorAll("pre"); // Examples are often in <pre> tags
      examples.forEach((exampleBlock, index) => {
        try {
          const text = exampleBlock.textContent.trim();
          const inputMatch = text.match(/Input:\s*([\s\S]*?)(?:Output:|$)/i);
          const outputMatch = text.match(
            /Output:\s*([\s\S]*?)(?:Explanation:|$)/i
          );

          if (inputMatch && inputMatch[1] && outputMatch && outputMatch[1]) {
            const inputText = inputMatch[1].trim();
            const outputText = outputMatch[1].trim();
            testCases.push({
              id: `example_${index + 1}`,
              input: inputText,
              output: outputText,
            });
          }
        } catch (exampleError) {
          console.error(
            `Error parsing example ${index + 1}:`,
            exampleError,
            exampleBlock
          );
        }
      });
    }

    return testCases;
  } catch (error) {
    // Log the specific error type and message
    console.error(
      `Error extracting test cases (${error.name}): ${error.message}`
    );
    return []; // Return empty array on failure
  }
}

/**
 * Extract submission results from the LeetCode page
 */
function extractSubmissionResults() {
  try {
    // Try to find submission results
    const resultElement = document.querySelector(
      '[data-e2e-locator="console-result"]'
    );
    if (resultElement) {
      const result = resultElement.textContent.trim();

      // Check for success or error messages
      const isSuccess =
        result.includes("Accepted") || result.includes("Success");
      const isError =
        result.includes("Error") || result.includes("Wrong Answer");

      // Get detailed error message if available
      const errorDetails =
        document.querySelector(".text-red-60") ||
        document.querySelector(".text-red-s");
      const errorMessage = errorDetails ? errorDetails.textContent.trim() : "";

      // Get runtime and memory usage if available
      const runtimeElement = document.querySelector('div:contains("Runtime:")');
      const memoryElement = document.querySelector('div:contains("Memory:")');

      const runtime = runtimeElement ? runtimeElement.textContent.trim() : "";
      const memory = memoryElement ? memoryElement.textContent.trim() : "";

      return {
        status: isSuccess ? "success" : isError ? "error" : "unknown",
        message: result,
        errorDetails: errorMessage,
        runtime,
        memory,
      };
    }

    return null;
  } catch (error) {
    console.error("Error extracting submission results:", error);
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
    const textareas = document.querySelectorAll("textarea");
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.length > 0) {
        // Save the original value in case we need to restore it
        const originalValue = textarea.value;

        // Update the textarea value
        textarea.value = code;

        // Dispatch input event to trigger Monaco editor update
        const event = new Event("input", { bubbles: true });
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
          editors[0].executeEdits("extension", [
            {
              range: fullRange,
              text: code,
            },
          ]);
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
    const editorElement = document.querySelector(".monaco-editor");
    if (editorElement) {
      // Focus the editor
      editorElement.click();

      // Try to select all existing text (Ctrl+A)
      const selectAllEvent = new KeyboardEvent("keydown", {
        key: "a",
        code: "KeyA",
        ctrlKey: true,
        bubbles: true,
      });
      editorElement.dispatchEvent(selectAllEvent);

      // Simulate pasting the code
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", code);

      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData: clipboardData,
        bubbles: true,
      });
      editorElement.dispatchEvent(pasteEvent);

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error inserting code:", error);
    return false;
  }
}

/**
 * Shows a toast notification on the page
 */
function showNotification(message, type = "info") {
  // Check if notification container exists, if not create it
  let notificationContainer = document.getElementById(
    "leetcode-ai-notification-container"
  );
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "leetcode-ai-notification-container";
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(notificationContainer);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `leetcode-ai-notification leetcode-ai-notification-${type}`;
  notification.style.cssText = `
    padding: 12px 16px;
    background-color: #333;
    color: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-bottom: 10px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 300px;
    animation: leetcodeAiSlideIn 0.3s ease;
    border-left: 4px solid #0a84ff;
  `;

  // Set border color based on notification type
  if (type === "success") {
    notification.style.borderColor = "#28a745";
  } else if (type === "error") {
    notification.style.borderColor = "#dc3545";
  } else if (type === "warning") {
    notification.style.borderColor = "#ffc107";
  }

  // Create notification content
  notification.innerHTML = `
    <div>${message}</div>
    <div class="leetcode-ai-notification-close" style="cursor: pointer; margin-left: 12px;">✕</div>
  `;

  // Add to container
  notificationContainer.appendChild(notification);

  // Add close button functionality
  const closeButton = notification.querySelector(
    ".leetcode-ai-notification-close"
  );
  closeButton.addEventListener("click", () => {
    notification.style.animation = "leetcodeAiSlideOut 0.3s ease forwards";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "leetcodeAiSlideOut 0.3s ease forwards";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);

  // Add animation styles if not already added
  if (!document.getElementById("leetcode-ai-notification-styles")) {
    const style = document.createElement("style");
    style.id = "leetcode-ai-notification-styles";
    style.textContent = `
      @keyframes leetcodeAiSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes leetcodeAiSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
