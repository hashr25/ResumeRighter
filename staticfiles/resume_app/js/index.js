document.addEventListener("DOMContentLoaded", () => {
    const steps = [
        { message: "Welcome to the Resume Righter Terminal!", action: null },
        {
            message: "This application will help you take your resume and tailor it to the job listing that you are applying for!",
            action: null,
        },
        { message: "Step 1: Please upload your resume file.", action: "file" },
        { message: "Step 2: Enter the job posting URL.", action: "url" },
        { message: "Step 3: Add any special considerations (or press Enter to skip).", action: "text" },
        { message: "Processing your input... Please wait.", action: "submit" },
        { message: "Generating your new resume.", action: "generate" },
    ];

    const outputDiv = document.getElementById("output");
    const inputField = document.getElementById("terminal-input");
    let currentStep = 0;
    const inputs = {};

    function showNextStep() {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            const message = document.createElement("div");
            message.textContent = step.message;
            outputDiv.appendChild(message);

            if (step.action === "file") {
                createFileInput();
            } else if (step.action === "url" || step.action === "text") {
                inputField.style.display = "inline-block";
                inputField.disabled = false;
                inputField.focus();
            } else if (step.action === "submit") {
                handleSubmit();
            } else if (step.action === "generate") {
                generateResume();
            } else {
                inputField.style.display = "none";
            }

            currentStep++;
            scrollToBottom();
        }
    }

    function createFileInput() {
        inputField.style.display = "none";
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".txt,.docx,.pdf";

        fileInput.addEventListener("change", async () => {
            const file = fileInput.files[0];
            if (!file) {
                appendMessage("No file selected. Please upload a file.");
                return;
            }

            const formData = new FormData();
            formData.append("resume_file", file);

            try {
                const response = await fetch("/api/validate-resume/", {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                    },
                });

                const data = await response.json();
                if (data.valid) {
                    appendMessage("The uploaded file is a valid resume!");
                    inputs.resumeText = data.extracted_text;
                    showNextStep();
                } else {
                    appendMessage("The uploaded file is NOT a valid resume.");
                }
            } catch (error) {
                console.error("Error:", error);
                appendMessage("An error occurred while validating the resume.");
            }
        });

        outputDiv.appendChild(fileInput);
    }

    inputField.addEventListener("keypress", async (e) => {
        if (e.key === "Enter" && currentStep > 0) {
            const step = steps[currentStep - 1];
            const input = inputField.value.trim();

            if (step.action === "url") {
                try {
                    const response = await fetch("/api/validate-job-posting/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCSRFToken(),
                        },
                        body: JSON.stringify({ url: input }),
                    });

                    const data = await response.json();
                    if (data.valid) {
                        appendMessage("The URL is a valid job posting!");
                        inputs.jobPostingText = data.job_posting_text;
                        inputField.value = "";
                        showNextStep();
                    } else {
                        appendMessage("The URL is NOT a valid job posting. Please try again.");
                    }
                } catch (error) {
                    console.error("Error validating job posting:", error);
                    appendMessage("An error occurred while validating the job posting.");
                }
            } else if (step.action === "text") {
                console.log("Text inputed");
                console.log(input);
                if (input.trim() === "") {
                    console.log("No special considerations provided");
                    // Skip validation for empty special considerations
                    appendMessage("No special considerations provided. Skipping this step.");
                    inputs.text = ""; // Assign empty string
                    inputField.value = "";
                    currentStep++;
                    showNextStep();
                } else {
                    console.log("Special considerations are provided. Continuing");
                    try {
                        const response = await fetch("/api/validate-special-considerations/", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRFToken": getCSRFToken(),
                            },
                            body: JSON.stringify({ text: input }),
                        });

                        const data = await response.json();
                        if (data.valid) {
                            appendMessage("Special considerations accepted!");
                            inputs.text = data.validated_data;
                            inputField.value = "";
                            showNextStep();
                        } else {
                            appendMessage("Special considerations are not relevant. Please try again.");
                        }
                    } catch (error) {
                        console.error("Error validating special considerations:", error);
                        appendMessage("An error occurred while validating special considerations.");
                    }
                }
            }
        }
    });

    async function handleSubmit() {
        if (!inputs.resumeText) {
            appendMessage("Resume validation is missing.");
        } else if (!inputs.jobPostingText) {
            appendMessage("Job posting validation is missing.");
        } else if (inputs.text === undefined) {
            appendMessage("Special considerations validation is missing.");
        } else {
            appendMessage("All inputs validated successfully.");
            showNextStep();
        }
    }

    async function generateResume() {
        try {
            const response = await fetch("/api/generate-resume/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify({
                    resume_text: inputs.resumeText,
                    job_posting_text: inputs.jobPostingText,
                    considerations: inputs.text,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate rewritten resume.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Rewritten_Resume.docx";
            a.click();
            window.URL.revokeObjectURL(url);

            appendMessage("Your rewritten resume has been downloaded!");
        } catch (error) {
            console.error("Error generating resume:", error);
            appendMessage("An error occurred while generating your resume.");
        }
    }

    function appendMessage(message) {
        const messageDiv = document.createElement("div");
        messageDiv.textContent = message;
        outputDiv.appendChild(messageDiv);
    }

    function getCSRFToken() {
        const csrfInput = document.querySelector("input[name=csrfmiddlewaretoken]");
        return csrfInput ? csrfInput.value : "";
    }

    function scrollToBottom() {
        outputDiv.scrollTop = outputDiv.scrollHeight;
    }

    showNextStep();
    showNextStep();
    showNextStep();
});
