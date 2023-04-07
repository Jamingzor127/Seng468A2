import { Kafka } from "kafkajs"


const consumer = new Kafka({brokers: ["127.0.0.1:9093"]}).consumer({groupId: "client-test-group"})

async function main() {
    console.log("Kafka Client Started")
    await consumer.connect()
    await consumer.subscribe({topic: "message-zcnFjK", fromBeginning: true})
    await consumer.subscribe({topic: "notification-zcnFjK", fromBeginning: true})
    await consumer.run({
		// this function is called every time the consumer gets a new message
		eachMessage: async ({ topic, message }) => {
			// here, we just log the message to the standard output
            if(topic == "message-zcnFjK") {
                console.log("Message Received: ", message.value?.toString())
            } else if(topic == "notification-zcnFjK") {
                console.log("Notification Received: ", message.value?.toString())
            }
                
		},
	})
}

main()
