$(document).ready(function () {

    // Initialize jQuery UI Accordion
    $("#accordion").accordion({
        collapsible: true,
        active: false,
        heightStyle: "content"
    });


    // Function to truncate text
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    }


    // API KEY FROM INDEXDB
    let db;
    const request = indexedDB.open("Grok2DB", 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        db.createObjectStore("apiKeys", { keyPath: "id" });
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        loadApiKey();
    };

    request.onerror = function (event) {
        console.error("IndexedDB error: " + event.target.errorCode);
        alert("Failed to initialize local database.");
    };

    function loadApiKey() {
        const transaction = db.transaction(["apiKeys"], "readonly");
        const store = transaction.objectStore("apiKeys");
        const request = store.get("key");

        request.onsuccess = function (event) {
            if (request.result) {
                $("#apiKey").val(request.result.value);
            }
        };

        request.onerror = function (event) {
            console.error("Error loading API key: ", event.target.error);
        };
    }

    $("#saveKey").on("click", function () {
        const apiKey = $("#apiKey").val();
        if (!apiKey) {
            alert("Please enter an API key before saving.");
            return;
        }

        try {
            const transaction = db.transaction(["apiKeys"], "readwrite");
            const store = transaction.objectStore("apiKeys");
            const request = store.put({ id: "key", value: apiKey });

            request.onsuccess = function () {
                alert("API Key saved successfully!");
            };

            request.onerror = function (event) {
                console.error("Error saving API key: ", event.target.error);
                alert("Failed to save API key.");
            };
        } catch (error) {
            console.error("Error during save operation: ", error);
            alert("An error occurred while saving the API key.");
        }
    });


    $("#sendPrompt").on("click", async function () {
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

        // Get the current date
        const id = Date.now();
        // Prompt string truncated
        const truncatedPrompt = truncateText(prompt, 250);



        // MODIFY PROMPT
        // any modifications to the prompt
        // take place here, such as appending
        // instructions.
        if ($("#resultsInHTML").is(":checked")) {
            // finalPrompt += " give response formatted in HTML";
        }

        let finalPrompt = prompt;



        // ADD ACCORDION ITEM
        const newAccordionItem = `
<h3 class="accordion-header" id="header-${id}">
    ${truncatedPrompt}
    <span class="delete-button" data-id="${id}">X</span>
</h3>
<div class="accordion-content" id="response-${id}">
    <p><strong>Prompt:</strong> ${prompt}</p>
    <div class="response">Response: </div>
</div>
`;


        // Append the new item to the accordion
$("#accordion").append(newAccordionItem);

// Refresh and activate the new accordion item
$("#accordion").accordion("refresh");
const headers = $("#accordion h3");
$("#accordion").accordion("option", "active", headers.length - 1); // Activate the new item

// Scroll into view (optional)
document.querySelector(`#response-${id}`).scrollIntoView({ behavior: "smooth" });


     // ADD DELETE BUTTON LOGIC
$(`#header-${id} .delete-button`).on("click", function () {
    const itemId = $(this).data("id");
    $(`#header-${itemId}`).remove();
    $(`#response-${itemId}`).remove();
    $("#accordion").accordion("refresh");
});


        // PAYLOAD FOR REQUEST TO API
        const payload = {
            "messages": [
                { "role": "system", "content": "You are a helpful assistant." },
                { "role": "user", "content": finalPrompt }
            ],
            "model": "grok-beta",
            "stream": true,
            "temperature": 0
        };


        // SET UP THE RESPONSE CONTAINER
        const responseContainer = $(`#response-${id} .response`);


        // VARIABLES FOR TRACKING STREAMING DATA
        let accumulatedMarkdown = ""; // Holds the full markdown content
        let lastRenderedHTML = ""; // Tracks what has already been rendered


        try {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.body) {
                throw new Error("Streaming not supported by the response.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter(line => line.trim() !== "");



                lines.forEach(line => {
                    if (line.trim() === "data: [DONE]") {
                        console.log("Stream finished.");
                        return;
                    }

                    if (line.startsWith("data:")) {
                        try {
                            const json = JSON.parse(line.slice(5).trim());
                            const content = json.choices[0].delta?.content || "";

                            // Accumulate the markdown content
                            accumulatedMarkdown += content;


                            // RE-RENDER THE HTML FROM MARKDOWN WITH EACH
                            // INCOMING STREAMED TOKEN.
                            // Convert the full accumulated markdown to HTML
                            const fullHTML = marked.parse(accumulatedMarkdown);

                            // Sanitize the HTML for security
                            const sanitizedHTML = DOMPurify.sanitize(fullHTML);



                            // UPDATE THE ENTIRE CONTAINER
                            if (sanitizedHTML !== lastRenderedHTML) {
                                responseContainer.html(sanitizedHTML); // Update the entire container
                                lastRenderedHTML = sanitizedHTML; // Update rendered state
                            }


                        } catch (err) {
                            console.error("Error parsing JSON:", err, line);
                        }
                    }


                });



            }

        } catch (error) {
            console.error("Fetch error:", error);
            alert("An error occurred while processing your request.");
        }

        $("#prompt").val(getRandomQuestion());
    });
});



$(document).ready(function () {
    // Set an initial random question in the prompt input
    $("#prompt").val(getRandomQuestion());

});

function randomPrompt() {
    $("#prompt").val(getRandomQuestion());
}

const questions = [
    "What is the Luoshu? What is Hetu?",
    "Who is Yu The Great?",
    "List all of the dynasties of ancient China",
    "What is the Book of Changes (I Ching) and how does it relate to Wuxing?",
    "How is the concept of Taiji (Supreme Ultimate) connected to all phenomena?",
    "What are the Wu Xing (Five Phases), and how do they constitute all things and phenomena?",
    "How do Yin and Yang explain balance and change in nature?",
    "What role does the I Ching play in understanding divination and decision-making?",
    "How is the principle of Taiji expressed in martial arts like Tai Chi?",
    "What are the Five Phases (Wu Xing), and how are they applied in traditional Chinese medicine?",
    "How do the trigrams of the I Ching represent natural phenomena?",
    "What is the relationship between Yin and Yang and the Wu Xing in Chinese philosophy?",
    "How does the I Ching explain the process of transformation and change?",
    "What is the significance of the hexagrams in the I Ching?",
    "How is the idea of Taiji connected to the creation of the universe in Chinese cosmology?",
    "What are the key philosophical differences between Confucian and Daoist interpretations of the I Ching?",
    "How does Yin and Yang influence the design of traditional Chinese architecture and city planning?",
    "What is the connection between the Wu Xing and the Chinese calendar system?",
    "How are Yin and Yang represented in the natural cycles, such as day and night or the seasons?",
    "What is the meaning of the Taijitu (Yin-Yang symbol) in Chinese philosophy discussed as if real?",
    "How do the Five Phases (Wu Xing) explain relationships in governance and society?",
    "What is the philosophical significance of the Eight Trigrams in the I Ching?",
    "How is the balance of Yin and Yang used to understand health and illness in traditional Chinese medicine?"
];

// Function to get a random question
function getRandomQuestion() {
    return questions[Math.floor(Math.random() * questions.length)];
}
