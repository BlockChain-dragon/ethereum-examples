const Web3 = require('web3')
const { waitForEvent } = require('./utils')
const streamrTweetsCounter = artifacts.require('./StreamrTweetsCounter.sol')
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:9545'))

contract('Streamr Tweets Counter Example Tests', accounts => {

  let numTweets
  const gasAmt = 3e6
  const address = accounts[0]

  beforeEach(async () => (
    { contract } = await streamrTweetsCounter.deployed(),
    { methods, events } = new web3.eth.Contract(
      contract._jsonInterface,
      contract._address
    )
  ))

  it('Should have logged a new Provable query', async () => {
    const event = await waitForEvent(events.LogNewProvableQuery)
    const description = event.returnValues.description
    assert.equal(
    description,
      'Provable query was sent, standing by for the answer...',
      'Provable query incorrectly logged!'
    )
  })

  it('Should retrieve number of tweets over the last minute', async () => {
    const event = await waitForEvent(events.LogResult)
    const contractNumTweets = event.returnValues.result
    numTweets = contractNumTweets
    assert.isAbove(
      parseInt(contractNumTweets),
      0,
      'No result was retrieved from the offchain twitter stream!'
    )
  })

  it('Should have saved the number of tweets in the smart-contract', async () => {
    const tweetCount = await methods
      .numberOfTweets()
      .call()
    assert.equal(
      parseInt(tweetCount),
      parseInt(numTweets),
      'Number of tweets should have been saved after Provable callback'
    )
  })

  it('Should log a failed second query due to lack of funds', async () => {
    const { events } = await methods
      .update()
      .send({
        from: address,
        gas: gasAmt
      })
    const description = events.LogNewProvableQuery.returnValues.description
    assert.equal(
      description,
      'Provable query was NOT sent, please add some ETH to cover for the query fee',
      'Provable query incorrectly logged!'
    )
  })
})
