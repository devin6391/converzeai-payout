# Assumptions
## Database
- Using MySQL for its default support for ACID properties.
- A made up tool, SomeOrm, that will create connection to MySQL server and help us query in javascript.
## UI
- I am assuming one page for cart from where user checks out. This creates a checkoutId, which will guarantee idempotency from next actions.
- Another page after checkout to "confirm and pay" - this is where we will start pay out.
## Failure protection
- Internally our system retries till a MAX_COUNT. (At least once)
## Idempotency on PSP side
- I am including a nonce. Many payment system use it to identify freshness of a payment request.
## DB
- PaymentLog is an immutable table. We might think to create constrainst to revoke updates privilages.
## Config file
- Created config.yml file to make things more secure for storing secrets and encryption technique for PSPs.
- It can be extended in future to store many configurations that we want only our CI machines to see.
## Others
- Not built for distributed systems. In distributed systems, we would need to think more around scalability, network partitions, atomicity, concurrency, durability, etc.
- Please expect some syntactical mistakes. I have tried my best to not have any of those.
