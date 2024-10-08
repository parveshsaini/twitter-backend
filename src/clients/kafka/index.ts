import { Kafka, logLevel, Producer } from "kafkajs";

import { ChatServices } from "../../services/chat";
import { logger } from "../..";

const kafka = new Kafka({
  brokers: [process.env.KAFKA_REST_URL!],
  ssl: true,
  sasl: {
      mechanism: 'scram-sha-256',
      username: process.env.KAFKA_REST_USERNAME!,
      password: process.env.KAFKA_REST_PASSWORD!
  },
  logLevel: logLevel.ERROR,
});

let producer: null | Producer = null;

export async function createProducer() {
  if (producer) return producer;

  const _producer = kafka.producer();
  await _producer.connect();
  producer = _producer;
  return producer;
}

export async function produceMessage(body: string, recieverId: string, senderId: string) {
  const producer = await createProducer();
  await producer.send({
    messages: [{ key: `${recieverId}_${senderId}`, value: body }],
    topic: "MESSAGES",
  });
  return true;
}

export async function startMessageConsumer() {
    console.log("Consumer is running..");
    const consumer = kafka.consumer({ groupId: "default" });
    await consumer.connect();
    await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });
  
    await consumer.run({
      autoCommit: true,
      eachMessage: async ({ message, pause }) => {
        if (!message.value || !message.key) return;
        // console.log(`New Message Received..`);
        try {
          const keyParts = message.key.toString().split('_');
          if (keyParts.length !== 2) {
            throw new Error('Invalid message key format');
          }
          const recieverId = keyParts[0];
          const senderId = keyParts[1];
  
          await ChatServices.sendMessageService({ 
            body: message.value.toString(),
            recieverId: recieverId
          },
          senderId);
        } catch (err: any) {
          logger.error("Error processing message:", err.message);
          console.error("Error processing message:", err.message);
          pause();
          setTimeout(() => {
            consumer.resume([{ topic: "MESSAGES" }]);
          }, 60 * 1000);
        }
      },
    });
  }

export default kafka;