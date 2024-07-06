import { Kafka, Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import { prismaClient } from "../db/index";
import { Message } from "@prisma/client";
import { ChatServices } from "../../services/chat";

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER_STRING!],
  ssl: {
    ca: [fs.readFileSync(path.resolve("./ca.pem"), "utf-8")],
  },
  sasl: {
    username: "avnadmin",
    password: process.env.KAFKA_PASSWORD!,
    mechanism: "plain",
  },
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