const mqtt = require("mqtt");

const topicToSubscribe = "test"; // Replace with the topic you want to subscribe to

// Create an MQTT client instance
const client = mqtt.connect({
  host: "localhost",
  protocol: "mqtt",
  port: 1883,
});

// Handle MQTT connection events
client.on("connect", () => {
  console.log("Connected to MQTT broker");
  // Subscribe to the desired topic
  client.subscribe(topicToSubscribe, (err) => {
    if (!err) {
      console.log(`Subscribed to MQTT topic: ${topicToSubscribe}`);
    }
  });
});

// Handle incoming MQTT messages
client.on("message", (topic, message) => {
  console.log(`Received MQTT message on topic ${topic}: ${message.toString()}`);
  // Process the message here as needed
});

// Handle MQTT disconnection (optional)
client.on("close", () => {
  console.log("Disconnected from MQTT broker");
});

// Handle MQTT errors (optional)
client.on("error", (err) => {
  console.error("MQTT client error:", err);
});
