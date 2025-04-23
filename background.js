// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getAIHelp") {
    getAIHelp(request.problemDetails, request.settings)
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error("Error getting AI help:", error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates we'll respond asynchronously
  } else if (request.action === "optimizeCode") {
    optimizeCode(request.code, request.settings, request.problemDetails)
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error("Error optimizing code:", error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates we'll respond asynchronously
  } else if (request.action === "debugCode") {
    debugCode(
      request.code,
      request.testCases,
      request.settings,
      request.problemDetails
    )
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error("Error debugging code:", error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates we'll respond asynchronously
  } else if (request.action === "explainError") {
    explainError(
      request.code,
      request.errorMessage,
      request.settings,
      request.problemDetails
    )
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error("Error explaining error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates we'll respond asynchronously
  } else if (request.action === "openPopup") {
    // Handle request to open the popup
    openExtensionPopup(sender.tab.id);
    return false; // No async response needed
  }
});

/**
 * Get help from AI for a LeetCode problem
 */
async function getAIHelp(problemDetails, settings) {
  const { aiProvider, apiKey, assistanceType } = settings;

  // Construct prompt based on assistance type
  let prompt = constructPrompt(problemDetails, assistanceType);

  // Call the appropriate AI API
  if (aiProvider === "openai") {
    return await callOpenAI(prompt, apiKey);
  } else if (aiProvider === "gemini") {
    return await callGemini(prompt, apiKey);
  } else {
    throw new Error("Invalid AI provider");
  }
}

/**
 * Optimize code using AI
 */
async function optimizeCode(code, settings, problemDetails = null) {
  const { aiProvider, apiKey } = settings;

  // Determine language from problemDetails or set default
  const language = problemDetails?.language || "javascript";

  // Construct prompt for code optimization
  let prompt = `
    I have the following code for a LeetCode problem:

    \`\`\`
    ${code}
    \`\`\`

    Please optimize this code for:
    1. Time complexity
    2. Space complexity
    3. Readability
    4. Edge cases

    The code is written in ${language}.
    Provide the optimized code with explanations of the improvements made.
    IMPORTANT: Please provide your solution in the same language (${language}).
  `;

  // Add problem details if available
  if (problemDetails) {
    const { title, difficulty, description, constraints, language } =
      problemDetails;
    const detectedLanguage = language || "javascript";

    prompt = `
      LeetCode Problem: ${title}
      Difficulty: ${difficulty}
      Programming Language: ${detectedLanguage}

      Description:
      ${description}

      ${constraints ? "Constraints:\n" + constraints : ""}

      Current code implementation:
      \`\`\`
      ${code}
      \`\`\`

      Please optimize this code for:
      1. Time complexity
      2. Space complexity
      3. Readability
      4. Edge cases

      Provide the optimized code with explanations of the improvements made.
      Make sure the solution passes all test cases and handles all edge cases.
      Format the optimized code between triple backticks.
      IMPORTANT: The optimized code MUST be written in ${detectedLanguage} programming language.
    `;
  }

  // Call the appropriate AI API
  if (aiProvider === "openai") {
    return await callOpenAI(prompt, apiKey);
  } else if (aiProvider === "gemini") {
    return await callGemini(prompt, apiKey);
  } else {
    throw new Error("Invalid AI provider");
  }
}

/**
 * Debug code using AI
 */
async function debugCode(code, testCases, settings, problemDetails = null) {
  const { aiProvider, apiKey } = settings;

  // Determine language from problemDetails or set default
  const language = problemDetails?.language || "javascript";

  // Construct prompt for debugging
  let prompt = `
    I have the following code for a LeetCode problem that isn't working correctly:

    \`\`\`
    ${code}
    \`\`\`

    ${
      testCases && testCases.length > 0
        ? "Test cases:\n" + JSON.stringify(testCases, null, 2)
        : ""
    }

    The code is written in ${language}.
    Please help me debug this code. Identify any issues and provide a corrected version.
    Explain what was wrong and how you fixed it.
    Format the corrected code between triple backticks.
    IMPORTANT: Please provide your solution in the same language (${language}).
  `;

  // Add problem details if available
  if (problemDetails) {
    const { title, difficulty, description, examples, constraints, language } =
      problemDetails;
    const detectedLanguage = language || "javascript";

    prompt = `
      LeetCode Problem: ${title}
      Difficulty: ${difficulty}
      Programming Language: ${detectedLanguage}

      Description:
      ${description}

      ${
        examples && examples.length > 0
          ? "Examples:\n" +
            examples
              .map((ex) => `Example ${ex.id}:\n${ex.content}`)
              .join("\n\n")
          : ""
      }

      ${constraints ? "Constraints:\n" + constraints : ""}

      Current code implementation (not working correctly):
      \`\`\`
      ${code}
      \`\`\`

      ${
        testCases && testCases.length > 0
          ? "Test cases:\n" + JSON.stringify(testCases, null, 2)
          : ""
      }

      Please help me debug this code. Identify any issues and provide a corrected version.
      Explain what was wrong and how you fixed it.
      Format the corrected code between triple backticks.
      IMPORTANT: The corrected code MUST be written in ${detectedLanguage} programming language.
    `;
  }

  // Call the appropriate AI API
  if (aiProvider === "openai") {
    return await callOpenAI(prompt, apiKey);
  } else if (aiProvider === "gemini") {
    return await callGemini(prompt, apiKey);
  } else {
    throw new Error("Invalid AI provider");
  }
}

/**
 * Explain error using AI
 */
async function explainError(
  code,
  errorMessage,
  settings,
  problemDetails = null
) {
  const { aiProvider, apiKey } = settings;

  // Determine language from problemDetails or set default
  const language = problemDetails?.language || "javascript";

  // Construct prompt for explaining error
  let prompt = `
    I have the following code for a LeetCode problem that is giving an error:

    \`\`\`
    ${code}
    \`\`\`

    Error message:
    ${errorMessage}

    The code is written in ${language}.
    Please explain what this error means, why it's happening, and how to fix it.
    Provide a corrected version of the code.
    Format the corrected code between triple backticks.
    IMPORTANT: Please provide your solution in the same language (${language}).
  `;

  // Add problem details if available
  if (problemDetails) {
    const { title, difficulty, language } = problemDetails;
    const detectedLanguage = language || "javascript";

    prompt = `
      LeetCode Problem: ${title}
      Difficulty: ${difficulty}
      Programming Language: ${detectedLanguage}

      Code with error:
      \`\`\`
      ${code}
      \`\`\`

      Error message:
      ${errorMessage}

      Please explain what this error means, why it's happening, and how to fix it.
      Provide a corrected version of the code.
      Format the corrected code between triple backticks.
      IMPORTANT: The corrected code MUST be written in ${detectedLanguage} programming language.
    `;
  }

  // Call the appropriate AI API
  if (aiProvider === "openai") {
    return await callOpenAI(prompt, apiKey);
  } else if (aiProvider === "gemini") {
    return await callGemini(prompt, apiKey);
  } else {
    throw new Error("Invalid AI provider");
  }
}

/**
 * Construct a prompt based on problem details and assistance type
 */
function constructPrompt(problemDetails, assistanceType) {
  const {
    title,
    difficulty,
    description,
    examples,
    constraints,
    functionSignature,
    starterCode,
    topics,
    language,
  } = problemDetails;

  // Default to JavaScript if language is not detected
  const detectedLanguage = language || "javascript";

  let prompt = `
    LeetCode Problem: ${title}
    Difficulty: ${difficulty}
    Programming Language: ${detectedLanguage}

    Description:
    ${description}

    ${
      examples && examples.length > 0
        ? "Examples:\n" +
          examples.map((ex) => `Example ${ex.id}:\n${ex.content}`).join("\n\n")
        : ""
    }

    ${constraints ? "Constraints:\n" + constraints : ""}

    ${functionSignature ? "Function Signature:\n" + functionSignature : ""}

    ${starterCode ? "Starter Code:\n```\n" + starterCode + "\n```" : ""}

    ${topics && topics.length > 0 ? "Related Topics: " + topics.join(", ") : ""}
  `;

  // Add specific instructions based on assistance type
  switch (assistanceType) {
    case "hint":
      prompt += `
        Please provide a hint for solving this problem without giving away the full solution.
        Focus on the key insight or approach needed to solve it.
        Don't provide any code, just the conceptual hint.
      `;
      break;
    case "approach":
      prompt += `
        Please explain the approach to solve this problem step by step.
        Include:
        1. The intuition behind the solution
        2. The algorithm in plain English
        3. Time and space complexity analysis
        4. Any important edge cases to consider
        Do not provide the actual code implementation.
      `;
      break;
    case "solution":
      prompt += `
        Please provide a complete solution to this problem in ${detectedLanguage}.
        Include:
        1. The intuition behind the solution
        2. The algorithm in plain English
        3. The code implementation in ${detectedLanguage} (make sure it's correct and optimized)
        4. Time and space complexity analysis
        5. Explanation of how the solution handles all test cases

        Format the code solution between triple backticks.
        Make sure the solution is correct and handles all edge cases mentioned in the constraints.
        IMPORTANT: The solution MUST be written in ${detectedLanguage} programming language.
      `;
      break;
    case "optimize":
      prompt += `
        Please analyze this problem and provide the most optimized solution possible in ${detectedLanguage}.
        Include:
        1. The optimal algorithm approach
        2. The code implementation in ${detectedLanguage} (make sure it's correct and highly optimized)
        3. Detailed time and space complexity analysis
        4. Any trade-offs made for optimization
        5. Explanation of why this is the most efficient solution

        Format the code solution between triple backticks.
        If there are multiple approaches with different time/space trade-offs, please explain them.
        IMPORTANT: The solution MUST be written in ${detectedLanguage} programming language.
      `;
      break;
    case "explain":
      prompt += `
        Please explain this problem in simple terms.
        Include:
        1. What the problem is asking for
        2. Breakdown of the input and output
        3. Explanation of any confusing terminology or concepts
        4. A simple example with step-by-step walkthrough

        Don't provide a solution, just help me understand the problem better.
      `;
      break;
    default:
      prompt += `
        Please provide guidance on how to solve this problem in ${detectedLanguage}.
        Include a high-level approach and any key insights needed.
      `;
  }

  return prompt;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, apiKey) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert algorithm and data structure specialist helping to solve LeetCode problems. You provide clear, concise, and correct solutions with detailed explanations. Always respect the programming language specified in the user's prompt and provide solutions in that language only. Do not switch to a different language than what was requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Error calling OpenAI API");
    }

    return {
      content: data.choices[0].message.content,
      model: "gpt-4-turbo",
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt, apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert algorithm and data structure specialist helping to solve LeetCode problems. You provide clear, concise, and correct solutions with detailed explanations. Always respect the programming language specified in the prompt and provide solutions in that language only. Do not switch to a different language than what was requested.\n\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Error calling Gemini API");
    }

    return {
      content: data.candidates[0].content.parts[0].text,
      model: "gemini-pro",
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Opens the extension popup programmatically
 */
function openExtensionPopup(tabId) {
  try {
    // First attempt to use the chrome.action API (preferred method in MV3)
    if (typeof chrome.action !== "undefined" && chrome.action.openPopup) {
      chrome.action.openPopup();
      return;
    }

    // Fallback: Execute script in the tab to simulate clicking the extension icon
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: simulateExtensionClick,
      args: [chrome.runtime.id],
    });
  } catch (error) {
    console.error("Error opening popup:", error);

    // Last resort: Send a message to content script to show a notification
    chrome.tabs.sendMessage(tabId, {
      action: "showNotification",
      message:
        "Please click the extension icon in the toolbar to open the AI Assistant",
    });
  }
}

/**
 * Function to be injected into the tab to simulate clicking the extension
 */
function simulateExtensionClick(extensionId) {
  // Create a notification to inform the user
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px;
    background-color: #333;
    color: white;
    border-radius: 8px;
    z-index: 10000;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 300px;
    animation: slideIn 0.3s ease;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center;">
      <div style="flex: 1;">Opening LeetCode AI Assistant...</div>
      <div style="margin-left: 12px; cursor: pointer;" id="close-notification">✕</div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.parentNode.removeChild(notification), 300);
    }
  }, 5000);

  // Add event listener to close button
  document
    .getElementById("close-notification")
    .addEventListener("click", () => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.parentNode.removeChild(notification), 300);
    });

  // Add animation styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
