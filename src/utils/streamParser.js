/**
 * Parses a cumulative text stream into individual SSE-style data events.
 * 
 * @param {string} fullText - The cumulative text from the response stream.
 * @returns {Array<Object>} - An array of parsed JSON objects from the "data: " lines.
 */
export const parseSSEStream = (fullText) => {
    const lines = fullText.split("\n");
    const events = [];

    for (const line of lines) {
        if (line.startsWith("data: ")) {
            try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    events.push(data);
                }
            } catch (e) {
                console.error("Error parsing SSE line:", line, e);
            }
        }
    }

    return events;
};

/**
 * Extracts the combined text content from an array of parsed SSE events.
 * 
 * @param {Array<Object>} events - Array of objects parsed from the stream.
 * @returns {string} - The concatenated text content.
 */
export const getStreamText = (events) => {
    return events
        .filter(event => event.type === "text-delta")
        .map(event => event.payload?.text || "")
        .join("");
};

/**
 * Finds the latest active tool call status if any.
 * 
 * @param {Array<Object>} events - Array of objects parsed from the stream.
 * @returns {string|null} - The name of the currently active tool or null.
 */
export const getActiveTool = (events) => {
    const lastToolStart = [...events].reverse().find(e => e.type === "tool-call-input-streaming-start");
    const lastToolEnd = [...events].reverse().find(e => e.type === "tool-call-input-streaming-end");

    if (lastToolStart && (!lastToolEnd || events.indexOf(lastToolEnd) < events.indexOf(lastToolStart))) {
        return lastToolStart.payload?.toolName || "tool";
    }
    return null;
};
