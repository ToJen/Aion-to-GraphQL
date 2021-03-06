const { graphql } = require('graphql')
const path = require('path')
const fs = require('fs')
const { expect } = require('chai')
const ExampleContract = fs.readFileSync(
  path.resolve(__dirname, '../contracts', 'Example.sol'),
  'utf8'
)
const { genGraphQlProperties } = require('../lib/index')
const { deploy, mainAccount, web3 } = require('../aion')
let schema, rootValue

const deployContract = async () => {
  const {
    deployedContract: { abi, address }
  } = await deploy(ExampleContract, 'Example', '')
  global.mainAccount = mainAccount
  console.log('deployed at ' + address)

  return await genGraphQlProperties({
    artifact: {
      abi
    },
    contract: web3.eth.contract(abi).at(address)
  })
}
describe('Contract Deployment', async () => {
  it('It should deploy', async () => {
    const gqlData = await deployContract()
    schema = gqlData.schema
    rootValue = gqlData.rootValue
    expect(gqlData).to.exist
  }).timeout(0)
})
describe('Test All functions', async () => {
  it('should verify the initial value is 5', async () => {
    const query = `
      query {
        num {
          uint128_0 {
            int
          }
        }
      }
    `
    const result = await graphql(schema, query, rootValue)
    console.dir(result.data)
    expect(result.data.num['uint128_0']['int']).to.equal(5)
  }).timeout(0)

  it('should succesfully set the value to 100', async () => {
    const mutation = `
    mutation{
      setA(a:100)
    }
  `
    const result = await graphql(schema, mutation, rootValue)
    console.log(result)
    expect(result.data['setA']).to.be.true
  }).timeout(0)

  it('should succesfully add 20 to the num and expect 120', async () => {
    const query = `
    query {
      add(a:20) {
        uint128_0 {
          int
        }
      }
    }
  `
    const result = await graphql(schema, query, rootValue)
    console.dir(result)
    expect(result.data['add']['uint128_0']['int']).to.equal(120)
  }).timeout(0)
})
