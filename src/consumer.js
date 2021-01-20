const { Kafka } = require('kafkajs')
const config = require('./config')
const igniteSave = require('./ignite-sql');

const kafka = new Kafka({
  clientId: config.kafka.CLIENTID,
  brokers: config.kafka.BROKERS
})

const topic = config.kafka.TOPIC
const consumer = kafka.consumer({
  groupId: config.kafka.GROUPID
})

const run = async () => {
  await consumer.connect()
  await consumer.subscribe({ topic, fromBeginning: true })
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const ogledInfo = JSON.parse(message.value.toString())
        console.log(`Prejet je ogled ${ogledInfo.UserOgledID}.`)
        if (ogledInfo) {
          await igniteSave.performSqlFieldsQuery(ogledInfo);
          console.log(
            '******* Informacije o ogledu *********',
            ogledInfo
          )
        }
      } catch (error) {
        console.log('err=', error)
      }
    }
  })
}

run().catch(e => console.error(`[example/consumer] ${e.message}`, e))
