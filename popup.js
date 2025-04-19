document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const aiProviderSelect = document.getElementById("ai-provider");
  const apiKeyInput = document.getElementById("api-key");
  const assistanceTypeSelect = document.getElementById("assistance-type");
  const saveSettingsButton = document.getElementById("save-settings");
  const getHelpButton = document.getElementById("get-help");
  const optimizeCodeButton = document.getElementById("optimize-code");
  const debugCodeButton = document.getElementById("debug-code");
  const explainErrorButton = document.getElementById("explain-error");
  const aiResponseDiv = document.getElementById("ai-response");
  const insertCodeButton = document.getElementById("insert-code");
  const problemDetailsDiv = document.getElementById("problem-details");
  const modelInfoDiv = document.getElementById("model-info");
  const loadingIndicator = document.getElementById("loading-indicator");
  const settingsToggleButton = document.getElementById("settings-toggle");
  const settingsSection = document.getElementById("settings-section");

  // Current problem details
  let currentProblemDetails = null;
  let currentCode = "";
  let currentTestCases = [];
  let currentSubmissionResults = null;

  // Settings toggle
  settingsToggleButton.addEventListener("click", function () {
    settingsSection.classList.toggle("hidden");
  });

  // Load saved settings
  chrome.storage.sync.get(
    ["aiProvider", "apiKey", "assistanceType"],
    function (result) {
      if (result.aiProvider) aiProviderSelect.value = result.aiProvider;
      if (result.apiKey) {
        apiKeyInput.value = result.apiKey;
        settingsToggleButton.classList.add("configured");
      }
      if (result.assistanceType)
        assistanceTypeSelect.value = result.assistanceType;
    }
  );

  // Save settings
  saveSettingsButton.addEventListener("click", function () {
    const settings = {
      aiProvider: aiProviderSelect.value,
      apiKey: apiKeyInput.value,
      assistanceType: assistanceTypeSelect.value,
    };

    chrome.storage.sync.set(settings, function () {
      showNotification("Settings saved!", "success");
      // Hide settings section after saving
      settingsSection.classList.add("hidden");

      // Add configured class if API key is set
      if (settings.apiKey) {
        settingsToggleButton.classList.add("configured");
      } else {
        settingsToggleButton.classList.remove("configured");
      }
    });
  });

  // Check if we're on a LeetCode problem page
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    if (currentTab.url.includes("leetcode.com/problems/")) {
      // Send message to content script to get problem details
      chrome.tabs.sendMessage(
        currentTab.id,
        { action: "getProblemDetails" },
        function (response) {
          if (response && response.problemDetails) {
            currentProblemDetails = response.problemDetails;
            displayProblemDetails(currentProblemDetails);

            // Get current code
            chrome.tabs.sendMessage(
              currentTab.id,
              { action: "getCurrentCode" },
              function (codeResponse) {
                if (codeResponse && codeResponse.code) {
                  currentCode = codeResponse.code;
                }
              }
            );

            // Get test cases
            chrome.tabs.sendMessage(
              currentTab.id,
              { action: "getTestCases" },
              function (testResponse) {
                if (testResponse && testResponse.testCases) {
                  currentTestCases = testResponse.testCases;
                }
              }
            );

            // Get submission results
            chrome.tabs.sendMessage(
              currentTab.id,
              { action: "getSubmissionResults" },
              function (resultResponse) {
                if (resultResponse && resultResponse.results) {
                  currentSubmissionResults = resultResponse.results;

                  // If there's an error, enable the explain error button
                  if (currentSubmissionResults.status === "error") {
                    explainErrorButton.disabled = false;
                    explainErrorButton.classList.remove("hidden");
                  }
                }
              }
            );
          } else {
            problemDetailsDiv.innerHTML =
              "<p>Error retrieving problem details. Please refresh the page.</p>";
          }
        }
      );
    } else {
      problemDetailsDiv.innerHTML =
        "<p>Not on a LeetCode problem page. Please navigate to a problem.</p>";
      disableAllButtons();
    }
  });

  // Get help button click handler
  getHelpButton.addEventListener("click", function () {
    // Get current settings
    chrome.storage.sync.get(
      ["aiProvider", "apiKey", "assistanceType"],
      function (settings) {
        if (!settings.apiKey) {
          showNotification("Please enter an API key in the settings.", "error");
          return;
        }

        // Show loading state
        showLoading("Thinking...");

        // Get problem details from the content script
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "getProblemDetails" },
              function (response) {
                if (response && response.problemDetails) {
                  currentProblemDetails = response.problemDetails;

                  // Send to background script to make API call
                  chrome.runtime.sendMessage(
                    {
                      action: "getAIHelp",
                      problemDetails: currentProblemDetails,
                      settings: settings,
                    },
                    function (aiResponse) {
                      hideLoading();
                      if (aiResponse && aiResponse.content) {
                        displayAIResponse(aiResponse.content, aiResponse.model);

                        // Show insert code button if we have a solution
                        if (
                          settings.assistanceType === "solution" ||
                          settings.assistanceType === "optimize"
                        ) {
                          insertCodeButton.classList.remove("hidden");
                        }
                      } else {
                        showNotification(
                          "Error getting AI response. Please check your API key and try again.",
                          "error"
                        );
                      }
                    }
                  );
                } else {
                  hideLoading();
                  showNotification(
                    "Error retrieving problem details. Please refresh the page.",
                    "error"
                  );
                }
              }
            );
          }
        );
      }
    );
  });

  // Optimize code button click handler
  optimizeCodeButton.addEventListener("click", function () {
    // Get current settings
    chrome.storage.sync.get(["aiProvider", "apiKey"], function (settings) {
      if (!settings.apiKey) {
        showNotification("Please enter an API key in the settings.", "error");
        return;
      }

      // Show loading state
      showLoading("Optimizing your code...");

      // Get current code from the editor
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "getCurrentCode" },
          function (response) {
            if (response && response.code) {
              currentCode = response.code;

              // Send to background script to make API call
              chrome.runtime.sendMessage(
                {
                  action: "optimizeCode",
                  code: currentCode,
                  problemDetails: currentProblemDetails,
                  settings: settings,
                },
                function (aiResponse) {
                  hideLoading();
                  if (aiResponse && aiResponse.content) {
                    displayAIResponse(aiResponse.content, aiResponse.model);
                    insertCodeButton.classList.remove("hidden");
                  } else {
                    showNotification(
                      "Error optimizing code. Please check your API key and try again.",
                      "error"
                    );
                  }
                }
              );
            } else {
              hideLoading();
              showNotification(
                "Error retrieving your code. Please make sure you have code in the editor.",
                "error"
              );
            }
          }
        );
      });
    });
  });

  // Debug code button click handler
  if (debugCodeButton) {
    debugCodeButton.addEventListener("click", function () {
      // Get current settings
      chrome.storage.sync.get(["aiProvider", "apiKey"], function (settings) {
        if (!settings.apiKey) {
          showNotification("Please enter an API key in the settings.", "error");
          return;
        }

        // Show loading state
        showLoading("Debugging your code...");

        // Get current code from the editor
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "getCurrentCode" },
              function (response) {
                if (response && response.code) {
                  currentCode = response.code;

                  // Get test cases if we don't have them yet
                  if (currentTestCases.length === 0) {
                    chrome.tabs.sendMessage(
                      tabs[0].id,
                      { action: "getTestCases" },
                      function (testResponse) {
                        if (testResponse && testResponse.testCases) {
                          currentTestCases = testResponse.testCases;
                        }

                        // Send to background script to make API call
                        sendDebugRequest(
                          settings,
                          currentCode,
                          currentTestCases,
                          currentProblemDetails
                        );
                      }
                    );
                  } else {
                    // Send to background script to make API call
                    sendDebugRequest(
                      settings,
                      currentCode,
                      currentTestCases,
                      currentProblemDetails
                    );
                  }
                } else {
                  hideLoading();
                  showNotification(
                    "Error retrieving your code. Please make sure you have code in the editor.",
                    "error"
                  );
                }
              }
            );
          }
        );
      });
    });
  }

  // Explain error button click handler
  if (explainErrorButton) {
    explainErrorButton.addEventListener("click", function () {
      // Get current settings
      chrome.storage.sync.get(["aiProvider", "apiKey"], function (settings) {
        if (!settings.apiKey) {
          showNotification("Please enter an API key in the settings.", "error");
          return;
        }

        // Show loading state
        showLoading("Analyzing error...");

        // Get current code and error message
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "getCurrentCode" },
              function (codeResponse) {
                if (codeResponse && codeResponse.code) {
                  currentCode = codeResponse.code;

                  // Get submission results if we don't have them yet
                  if (!currentSubmissionResults) {
                    chrome.tabs.sendMessage(
                      tabs[0].id,
                      { action: "getSubmissionResults" },
                      function (resultResponse) {
                        if (resultResponse && resultResponse.results) {
                          currentSubmissionResults = resultResponse.results;
                          sendExplainErrorRequest(
                            settings,
                            currentCode,
                            currentSubmissionResults,
                            currentProblemDetails
                          );
                        } else {
                          hideLoading();
                          showNotification(
                            "No error found. Please run your code first to get an error message.",
                            "warning"
                          );
                        }
                      }
                    );
                  } else {
                    sendExplainErrorRequest(
                      settings,
                      currentCode,
                      currentSubmissionResults,
                      currentProblemDetails
                    );
                  }
                } else {
                  hideLoading();
                  showNotification(
                    "Error retrieving your code. Please make sure you have code in the editor.",
                    "error"
                  );
                }
              }
            );
          }
        );
      });
    });
  }

  // Insert code button click handler
  insertCodeButton.addEventListener("click", function () {
    const codeMatch = aiResponseDiv.innerText.match(
      /```(?:[\w]*)\n([\s\S]*?)```/
    );
    if (codeMatch && codeMatch[1]) {
      const codeToInsert = codeMatch[1].trim();

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "insertCode",
            code: codeToInsert,
          },
          function (response) {
            if (response && response.success) {
              showNotification("Code inserted successfully!", "success");
            } else {
              showNotification(
                "Failed to insert code. Please try again.",
                "error"
              );
            }
          }
        );
      });
    } else {
      showNotification(
        "No code found in the AI response to insert.",
        "warning"
      );
    }
  });

  // Helper functions
  function displayProblemDetails(details) {
    // Check if title is available and properly formatted
    let title = details.title || "Unknown Problem";

    // Clean up title if it contains HTML (like when scraping from LeetCode)
    if (title.includes("<a") || title.includes("</a>")) {
      // Extract text from HTML title
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = title;
      title = tempDiv.textContent || tempDiv.innerText || title;
    }

    // Format difficulty with appropriate styling
    let difficultyHTML = "";
    if (details.difficulty) {
      const diffClass = details.difficulty.toLowerCase();
      difficultyHTML = `<span class="difficulty ${diffClass}">${details.difficulty}</span>`;
    }

    // Truncate description to a reasonable length
    const truncatedDescription = details.description
      ? details.description.length > 120
        ? details.description.substring(0, 120) + "..."
        : details.description
      : "No description available";

    problemDetailsDiv.innerHTML = `
      <p><strong>Problem:</strong> ${title}</p>
      <p><strong>Difficulty:</strong> ${difficultyHTML}</p>
      <p><strong>Description:</strong> ${truncatedDescription}</p>
      ${
        details.topics && details.topics.length > 0
          ? `<p><strong>Topics:</strong> ${details.topics
              .map((topic) => `<span class="topic-tag">${topic}</span>`)
              .join(" ")}</p>`
          : ""
      }
    `;
  }

  function displayAIResponse(content, model) {
    // Check if marked library is loaded
    if (typeof marked === "undefined") {
      console.error("Marked library is not loaded. Cannot render Markdown.");
      // Display raw content with a warning
      aiResponseDiv.innerHTML =
        '<p style="color: red; font-weight: bold;">Error: Markdown library not found.</p>' +
        "<pre><code>" +
        escapeHtml(content) +
        "</code></pre>";
      // Optionally hide model info/insert button if rendering failed
      if (modelInfoDiv) modelInfoDiv.classList.add("hidden");
      insertCodeButton.classList.add("hidden");
      return;
    }

    try {
      // Use marked library to convert markdown to HTML
      const formattedContent = marked.parse(content);
      aiResponseDiv.innerHTML = formattedContent;

      // Add copy buttons to all code blocks
      const codeBlocks = aiResponseDiv.querySelectorAll("pre code");
      codeBlocks.forEach((codeBlock, index) => {
        const pre = codeBlock.parentNode;

        // Create a container for the code block to position the copy button
        const container = document.createElement("div");
        container.className = "code-block-container";
        pre.parentNode.insertBefore(container, pre);
        container.appendChild(pre);

        // Create copy button
        const copyButton = document.createElement("button");
        copyButton.className = "copy-code-button";
        copyButton.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        copyButton.title = "Copy code";
        copyButton.dataset.index = index;

        // Add copy button to the container
        container.appendChild(copyButton);

        // Add click event to copy button
        copyButton.addEventListener("click", function () {
          const codeText = codeBlock.textContent;
          navigator.clipboard.writeText(codeText).then(
            function () {
              showNotification("Code copied to clipboard!", "success");

              // Change to checkmark when copied
              const originalContent = copyButton.innerHTML;
              copyButton.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
              copyButton.classList.add("copied");

              setTimeout(() => {
                copyButton.classList.remove("copied");
                copyButton.innerHTML = originalContent;
              }, 1500);
            },
            function () {
              showNotification("Failed to copy code", "error");
            }
          );
        });
      });
    } catch (error) {
      console.error("Error parsing Markdown:", error);
      // Display raw content if parsing fails
      aiResponseDiv.innerHTML =
        '<p style="color: red; font-weight: bold;">Error parsing Markdown.</p>' +
        "<pre><code>" +
        escapeHtml(content) +
        "</code></pre>";
      if (modelInfoDiv) modelInfoDiv.classList.add("hidden");
      insertCodeButton.classList.add("hidden");
      return;
    }

    // Display model info if available
    if (modelInfoDiv && model) {
      modelInfoDiv.textContent = `Generated by: ${model}`;
      modelInfoDiv.classList.remove("hidden");
    }
  }

  // Helper function to escape HTML (basic version)
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function sendDebugRequest(settings, code, testCases, problemDetails) {
    chrome.runtime.sendMessage(
      {
        action: "debugCode",
        code: code,
        testCases: testCases,
        settings: settings,
        problemDetails: problemDetails,
      },
      function (aiResponse) {
        hideLoading();
        if (aiResponse && aiResponse.content) {
          displayAIResponse(aiResponse.content, aiResponse.model);
          insertCodeButton.classList.remove("hidden");
        } else {
          showNotification(
            "Error debugging code. Please check your API key and try again.",
            "error"
          );
        }
      }
    );
  }

  function sendExplainErrorRequest(
    settings,
    code,
    submissionResults,
    problemDetails
  ) {
    const errorMessage =
      submissionResults.errorDetails ||
      submissionResults.message ||
      "Unknown error";

    chrome.runtime.sendMessage(
      {
        action: "explainError",
        code: code,
        errorMessage: errorMessage,
        settings: settings,
        problemDetails: problemDetails,
      },
      function (aiResponse) {
        hideLoading();
        if (aiResponse && aiResponse.content) {
          displayAIResponse(aiResponse.content, aiResponse.model);
          insertCodeButton.classList.remove("hidden");
        } else {
          showNotification(
            "Error explaining the error. Please check your API key and try again.",
            "error"
          );
        }
      }
    );
  }

  function showLoading(message) {
    if (loadingIndicator) {
      loadingIndicator.textContent = message || "Loading...";
      loadingIndicator.classList.remove("hidden");
    }
    aiResponseDiv.innerHTML = `<p>${message || "Loading..."}</p>`;
  }

  function hideLoading() {
    if (loadingIndicator) {
      loadingIndicator.classList.add("hidden");
    }
  }

  function showNotification(message, type) {
    const notificationDiv = document.createElement("div");
    notificationDiv.className = `notification ${type || "info"}`;
    notificationDiv.textContent = message;

    document.body.appendChild(notificationDiv);

    // Remove after 3 seconds
    setTimeout(() => {
      notificationDiv.classList.add("fade-out");
      setTimeout(() => {
        document.body.removeChild(notificationDiv);
      }, 500);
    }, 3000);
  }

  function disableAllButtons() {
    getHelpButton.disabled = true;
    optimizeCodeButton.disabled = true;
    if (debugCodeButton) debugCodeButton.disabled = true;
    if (explainErrorButton) explainErrorButton.disabled = true;
  }
});
