document.getElementById('autofillBtn').addEventListener('click', () => {
    const resumeId = document.getElementById('resumeIdInput').value.trim();
    if (!resumeId) {
        alert('Please enter a resume ID.');
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'FILL_FORM',
            resumeId: resumeId
        });
    });
});


let selectedFile = null;

document.getElementById("pdfInput").addEventListener("change", function (e) {
    selectedFile = e.target.files[0];

    if (!selectedFile && selectedFile.type !== "application/pdf") {
        selectedFile = null;
    }
});


const resumeIdDisplay = document.getElementById("resumeIdDisplay");
document.getElementById("submitBtn").addEventListener("click", async () => {
    if (!selectedFile) {
        return;
    }

    try {
        // Step 1: Call API Gateway to get presigned URL
        const res = await fetch("https://htx51u309i.execute-api.us-east-1.amazonaws.com/upload", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Failed to get presigned URL");
        const [presignedUrl, id] = await res.json().then(data => [data['uploadUrl'], data['fileKey'].split('.', 1)[0]]);
        resumeIdDisplay.textContent = `Your Resume ID (this code is reusable): ${id}`;
        console.log(presignedUrl);
        // Step 2: Upload to S3

        const uploadRes = await fetch(presignedUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/pdf"
            },
            body: selectedFile
        });

        if (!uploadRes.ok) throw new Error("Failed to upload file");

    } catch (err) {
        console.error(err);
    }
});
