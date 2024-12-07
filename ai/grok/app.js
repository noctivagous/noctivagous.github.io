$(document).ready(function() {
    let db;
    const request = indexedDB.open("Grok2DB", 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        db.createObjectStore("apiKeys", { keyPath: "id" });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadApiKey();
    };

    request.onerror = function(event) {
        console.error("IndexedDB error: " + event.target.errorCode);
        alert("Failed to initialize local database.");
    };

    $("#saveKey").on("click", function() {
        const apiKey = $("#apiKey").val();
        if (!apiKey) {
            alert("Please enter an API key before saving.");
            return;
        }
        
        try {
            const transaction = db.transaction(["apiKeys"], "readwrite");
            const store = transaction.objectStore("apiKeys");
            const request = store.put({id: "key", value: apiKey});

            request.onsuccess = function() {
                alert("API Key saved successfully!");
            };

            request.onerror = function(event) {
                console.error("Error saving API key: ", event.target.error);
                alert("Failed to save API key.");
            };
        } catch (error) {
            console.error("Error during save operation: ", error);
            alert("An error occurred while saving the API key.");
        }
    });

    function loadApiKey() {
        const transaction = db.transaction(["apiKeys"], "readonly");
        const store = transaction.objectStore("apiKeys");
        const request = store.get("key");

        request.onsuccess = function(event) {
            if (request.result) {
                $("#apiKey").val(request.result.value);
            }
        };

        request.onerror = function(event) {
            console.error("Error loading API key: ", event.target.error);
        };
    }

    $("#sendPrompt").on("click", function() {
        const prompt = $("#prompt").val();
        const apiKey = $("#apiKey").val();

        if (!apiKey) {
            alert("Please enter an API key.");
            return;
        }

        if (!prompt) {
            alert("Please enter a prompt.");
            return;
        }

        let finalPrompt = prompt;
        if (resultsInHTML) {
            finalPrompt += "give response formatted in HTML";  // Append the HTML request to the prompt if checked
        }




        const payload = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI with deep knowledge of history, specializing in providing accurate, contextual information about past events, cultures, and figures."
                },
                {
                    "role": "user",
                    "content": finalPrompt
                }
            ],
            "model": "grok-beta",
            "stream": false,
            "temperature": 0
        };

        $.ajax({
            url: 'https://api.x.ai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            data: JSON.stringify(payload),
            contentType: 'application/json',
            success: function(response) {
                const template = $.templates("#responseTemplate");
                $("#responseList").append(template.render({ response: response }));
            },
            error: function(xhr, status, error) {
                console.error('API Error:', status, error);
                let errorMessage = 'An unexpected error occurred. Please try again later.';

                // ... (previous error handling code here)

                errorMessage = `${xhr.status}. An error occurred: ${xhr.statusText}.`;


                if (xhr.status === 422) {
                    errorMessage = 'Unprocessable Entity. The server understood the content type and syntax of the request but could not process the instructions. Please check your input for semantic errors.';
                }

                // ... (rest of error handling code here)

                alert(errorMessage);
            }
        });
    });

    $.templates({
        responseTemplate: 
        '<div class="response">{{:response}}</div>'
    });
});